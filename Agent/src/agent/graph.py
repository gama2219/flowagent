from langchain_google_genai import ChatGoogleGenerativeAI
from src.agent.tools import workflow_examples,web_search_tool,tools
from src.agent.prompt import the_main_agent,prompt_template_n8n_agent
from langgraph.prebuilt import create_react_agent
from src.agent.supervisor_agent import create_supervisor_agent

import os

google_api_key= os.getenv('google_api_key')
agent_name=os.getenv('agent_name')


prompt_n8n_agent=prompt_template_n8n_agent.invoke({"tools": tools})


model = ChatGoogleGenerativeAI(
    model='gemini-2.5-pro',
    temperature=1,
    google_api_key=google_api_key
)


#agents

   
agent_n8n =create_react_agent(model=model,name='n8n_agent',prompt=prompt_n8n_agent.text,tools=tools)

#test_workflow=create_react_agent(name='workflow_tester',prompt='__')

graph=create_supervisor_agent(
    model=model,
    agents=[agent_n8n],
    prompt=the_main_agent.text,
    tools=[web_search_tool,workflow_examples],
    supervisor_name=agent_name,
    add_handoff_back_messages=True
).compile()