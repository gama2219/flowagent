from langchain_core.tools import tool,InjectedToolCallId,BaseTool
from langgraph.types import Command, Send
from typing_extensions import Annotated
from langgraph.prebuilt import InjectedState
from langchain_core.messages import HumanMessage,AIMessage,BaseMessage,SystemMessage,ToolMessage
import re
import inspect
from typing import Any, Callable, Literal, Optional, Sequence, Type, Union, cast, get_args
from uuid import UUID, uuid5

from langchain_core.language_models import BaseChatModel, LanguageModelLike
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt.chat_agent_executor import (
    AgentState,
    Prompt,
    StateSchemaType,
    StructuredResponseSchema,
    create_react_agent,
)
from langgraph.pregel import Pregel
from langgraph.utils.config import patch_configurable
from langgraph.utils.runnable import RunnableCallable

from langgraph_supervisor.agent_name import AgentNameMode, with_agent_name
from langgraph_supervisor.handoff import (
    METADATA_KEY_HANDOFF_DESTINATION,
    _normalize_agent_name,
    create_handoff_back_messages
)


METADATA_KEY_HANDOFF_DESTINATION = "__handoff_destination"
WHITESPACE_RE = re.compile(r"\s+")

def _normalize_agent_name(agent_name: str) -> str:
    return WHITESPACE_RE.sub("_", agent_name.strip()).lower()

def  create_handoff_tool(*,
                         agent_name:str,
                         name: str | None = None,
                         description:str|None=None,
                         add_handoff_messages: bool = True,
                         )->BaseTool:
    
    if name is None:
        name = f"transfer_to_{_normalize_agent_name(agent_name)}"

    if description is None:
        description = f"Ask agent '{agent_name}' for help"

    @tool(name,description=description)
    def handoff_to_agent(
        query:Annotated[str,f'specific query to pass to {name} agent'],
        state: Annotated[dict, InjectedState],
        tool_call_id: Annotated[str, InjectedToolCallId],
    )->Command:
        _message=HumanMessage(content=query)

        tool_message = ToolMessage(
            content=f"succesfully transferd to{agent_name}",
            name=name,
            tool_call_id=tool_call_id,
            response_metadata={METADATA_KEY_HANDOFF_DESTINATION: agent_name},
        )

        if add_handoff_messages:
            update_message=state["messages"] + [tool_message]        
        else:
            update_message = state["messages"][:-1]
        return Command(
            graph=Command.PARENT,
            update={**state, "messages": update_message},
            goto=Send(agent_name, {"messages": [_message]}),
            )

        
    handoff_to_agent.metadata = {METADATA_KEY_HANDOFF_DESTINATION: agent_name}
    return handoff_to_agent




OutputMode = Literal["full_history", "last_message"]
"""Mode for adding agent outputs to the message history in the multi-agent workflow

- `full_history`: add the entire agent message history
- `last_message`: add only the last message
"""



def _make_call_agent(
    agent: Pregel,
    output_mode: OutputMode,
    add_handoff_back_messages: bool,
    supervisor_name: str,
) -> Callable[[dict], dict] | RunnableCallable:
    if output_mode not in get_args(OutputMode):
        raise ValueError(
            f"Invalid agent output mode: {output_mode}. Needs to be one of {get_args(OutputMode)}"
        )

    def _process_output(output: dict) -> dict:
        messages = output["messages"]
        if output_mode == "full_history":
            pass
        elif output_mode == "last_message":
            messages = messages[-1:]

        else:
            raise ValueError(
                f"Invalid agent output mode: {output_mode}. "
                f"Needs to be one of {OutputMode.__args__}"
            )

        if add_handoff_back_messages:
            messages.extend(create_handoff_back_messages(agent.name, supervisor_name))

        return {
            **output,
            "messages": messages,
        }

    def call_agent(state: dict, config: RunnableConfig) -> dict:
        thread_id = config["configurable"].get("thread_id")
        output = agent.invoke(
            state,
            patch_configurable(
                config,
                {"thread_id": uuid5(UUID(str(thread_id)), agent.name) if thread_id else None},
            ),
        )
        return _process_output(output)

    async def acall_agent(state: dict, config: RunnableConfig) -> dict:
        thread_id = config["configurable"].get("thread_id")
        output = await agent.ainvoke(
            state,
            patch_configurable(
                config,
                {"thread_id": uuid5(UUID(str(thread_id)), agent.name) if thread_id else None},
            ),
        )
        return _process_output(output)

    return RunnableCallable(call_agent, acall_agent)


def _get_handoff_destinations(tools: Sequence[BaseTool | Callable]) -> list[str]:
    """Extract handoff destinations from provided tools.
    Args:
        tools: List of tools to inspect.
    Returns:
        List of agent names that are handoff destinations.
    """
    return [
        tool.metadata[METADATA_KEY_HANDOFF_DESTINATION]
        for tool in tools
        if isinstance(tool, BaseTool)
        and tool.metadata is not None
        and METADATA_KEY_HANDOFF_DESTINATION in tool.metadata
    ]


def _prepare_tool_node(
    tools: list[BaseTool | Callable] | ToolNode | None,
    handoff_tool_prefix: Optional[str],
    add_handoff_messages: bool,
    agent_names: set[str],
) -> ToolNode:
    """Prepare the ToolNode to use in supervisor agent."""
    if isinstance(tools, ToolNode):
        input_tool_node = tools
        tool_classes = list(tools.tools_by_name.values())
    elif tools:
        input_tool_node = ToolNode(tools)
        # get the tool functions wrapped in a tool class from the ToolNode
        tool_classes = list(input_tool_node.tools_by_name.values())
    else:
        input_tool_node = None
        tool_classes = []

    handoff_destinations = _get_handoff_destinations(tool_classes)
    if handoff_destinations:
        if missing_handoff_destinations := set(agent_names) - set(handoff_destinations):
            raise ValueError(
                "When providing custom handoff tools, you must provide them for all subagents. "
                f"Missing handoff tools for agents '{missing_handoff_destinations}'."
            )

        # Handoff tools should be already provided here
        tool_node = cast(ToolNode, input_tool_node)
    else:
        handoff_tools = [
            create_handoff_tool(
                agent_name=agent_name,
                name=(
                    None
                    if handoff_tool_prefix is None
                    else f"{handoff_tool_prefix}{_normalize_agent_name(agent_name)}"
                ),
                add_handoff_messages=add_handoff_messages,
            )
            for agent_name in agent_names
        ]
        all_tools = tool_classes + list(handoff_tools)

        # re-wrap the combined tools in a ToolNode
        # if the original input was a ToolNode, apply the same params
        if input_tool_node is not None:
            tool_node = ToolNode(
                all_tools,
                name=input_tool_node.name,
                tags=list(input_tool_node.tags) if input_tool_node.tags else None,
                handle_tool_errors=input_tool_node.handle_tool_errors,
                messages_key=input_tool_node.messages_key,
            )
        else:
            tool_node = ToolNode(all_tools)

    return tool_node



def create_supervisor_agent(
        *, 
        agents : list[Pregel],
        model: LanguageModelLike,
        tools: list[BaseTool | Callable] | ToolNode | None = None,
        prompt: Prompt | None = None,
        response_format: Optional[
            Union[StructuredResponseSchema, tuple[str, StructuredResponseSchema]]
        ] = None,
        parallel_tool_calls: bool = False,
        state_schema: StateSchemaType = AgentState,
        config_schema: Type[Any] | None = None,
        output_mode: OutputMode = "last_message",
        add_handoff_messages: bool = True,
        handoff_tool_prefix: Optional[str] = None,
        add_handoff_back_messages: Optional[bool] = None,
        supervisor_name: str = "supervisor",
        include_agent_name: AgentNameMode | None = None,
) -> StateGraph:
    if add_handoff_back_messages is None:
        add_handoff_back_messages = add_handoff_messages
    agent_names = set()
    for agent in agents:
        if agent.name is None or agent.name == "LangGraph":
            raise ValueError(
                "Please specify a name when you create your agent, either via `create_react_agent(..., name=agent_name)` "
                "or via `graph.compile(name=name)`."
            )

        if agent.name in agent_names:
            raise ValueError(
                f"Agent with name '{agent.name}' already exists. Agent names must be unique."
            )

        agent_names.add(agent.name)
        
    tool_node = _prepare_tool_node(
        tools,
        handoff_tool_prefix,
        add_handoff_messages,
        agent_names,
    )
    all_tools = list(tool_node.tools_by_name.values())

    #handle parallel tool calling which is false by default
    model = cast(BaseChatModel, model).bind_tools(all_tools)

    if include_agent_name:
        model = with_agent_name(model, include_agent_name)  

    supervisor_agent = create_react_agent(
        name=supervisor_name,
        model=model,
        tools=tool_node,
        prompt=prompt,
        state_schema=state_schema,
        response_format=response_format,
    )

    builder = StateGraph(state_schema, config_schema=config_schema)
    builder.add_node(supervisor_agent, destinations=tuple(agent_names) + (END,))
    builder.add_edge(START, supervisor_agent.name)
    for agent in agents:
        builder.add_node(
            agent.name,
            _make_call_agent(
                agent,
                output_mode,
                add_handoff_back_messages=add_handoff_back_messages,
                supervisor_name=supervisor_name,
            ),
        )
        builder.add_edge(agent.name, supervisor_agent.name)

    return builder