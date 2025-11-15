from langchain_google_genai import ChatGoogleGenerativeAI
from src.agent.tools import workflow_examples,web_search_tool,tools
from src.agent.prompt import the_main_agent,prompt_template_n8n_agent
from src.agent.supervisor_agent import create_supervisor_agent
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain.agents import create_agent
import os

rate_limiter = InMemoryRateLimiter(
    requests_per_second=2/60,  
    check_every_n_seconds=0.1,
    max_bucket_size=2
)

google_api_key= os.getenv('google_api_key')
agent_name=os.getenv('agent_name')


prompt_n8n_agent=prompt_template_n8n_agent.invoke({"tools": tools})


model = ChatGoogleGenerativeAI(
    model='gemini-2.5-pro',
    temperature=1,
    google_api_key=google_api_key,
    rate_limiter=rate_limiter
)


#agents

   
agent_n8n =create_agent(model=model,name='n8n_agent',system_prompt=prompt_n8n_agent.text,tools=tools)

#test_workflow=create_react_agent(name='workflow_tester',prompt='__')

graph=create_supervisor_agent(
    model=model,
    agents=[agent_n8n],
    prompt=the_main_agent.text,
    tools=[web_search_tool,workflow_examples],
    supervisor_name=agent_name,
    add_handoff_back_messages=True
).compile()