from langchain_google_genai import ChatGoogleGenerativeAI
from src.agent.tools import workflow_examples,web_search_tool,tools
from src.agent.prompt import the_main_agent,prompt_template_n8n_agent
from src.agent.supervisor_agent import create_supervisor_agent
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
import os

agent_name=os.getenv('agent_name')
model_= os.getenv('model')

rate_limiter = InMemoryRateLimiter(
    requests_per_second=4/60,  
    check_every_n_seconds=0.1,
    max_bucket_size=2
)

prompt_n8n_agent=prompt_template_n8n_agent.invoke({"tools": tools})


model = init_chat_model(
    model_,
    temperature=1,
    rate_limiter=rate_limiter
    )


#agents
agent_n8n =create_agent(model=model,name='n8n_agent',system_prompt=prompt_n8n_agent.text,tools=tools)



graph=create_supervisor_agent(
    model=model,
    agents=[agent_n8n],
    prompt=the_main_agent.text,
    tools=[web_search_tool,workflow_examples],
    supervisor_name=agent_name,
    add_handoff_back_messages=True
).compile()