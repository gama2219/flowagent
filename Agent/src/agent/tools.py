from langchain_community.document_loaders import JSONLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from pydantic import BaseModel,Field
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from requests import request
from src.agent.n8n_request_handler import n8n_request_handler
from langgraph.config import get_config
from src.agent.prompt import (workflow_creator_description,update_wokflow_description,fetch_workflow_description,search_tool_description,workflow_search)
from src.agent.utils.dbcreation import database_creation
from typing import Any
import asyncio
import os
import json


google_api_key=os.getenv('google_api_key')
url =os.getenv("n8n_endpoint")




def checkifdatabaseexists()->None:
    existing:bool=os.path.exists('chroma_db')
    if existing:
        print('database exists')
        pass
    else:
        database_creation('workflows')
    



#checkifdatabaseexists()





embeddings=GoogleGenerativeAIEmbeddings(model='models/gemini-embedding-001',google_api_key=google_api_key)



request_handler=n8n_request_handler(url)


class argschema (BaseModel):
    workflow:str=Field(description='The complete n8n workflow str json  object to be created ')

@tool(description=workflow_creator_description,args_schema=argschema)
async def workflow_creator(workflow:str)->dict:
    config=get_config()
    n8n_id = config["configurable"].get("langgraph_auth_user").get('n8n_id')
    dict_workflow = json.loads(workflow)

    response=await asyncio.to_thread(request_handler.createWorkflow,dict_workflow,n8n_id)
    if response.status_code==200:
        tool_response={
            'status':200,
            'workflow_id':response.json().get('id')
        }
        return tool_response
    else:
        tool_response={
            'status':response.status_code,
            'reason':response.json().get('message')
        }
        return tool_response
    

    
@tool(description=fetch_workflow_description)
async def fetch_workflow(id:str)->dict:
    config=get_config()
    n8n_id = config["configurable"].get("langgraph_auth_user").get('n8n_id')
    response=await asyncio.to_thread(request_handler.fetchWorkflow_1,id,n8n_id)


    if response.status_code==200:
        return response.json()
    else:
        tool_res={
            'status':response.status_code,
            'reason':response.reason}
        
        return tool_res
    


@tool(description=update_wokflow_description)
async def update_wokflow(workflow:str,id:str)->dict:
    config=get_config()
    n8n_id = config["configurable"].get("langgraph_auth_user").get('n8n_id')

    dict_workflow = json.loads(workflow)

    response=await asyncio.to_thread(request_handler.updateWorkflow ,id,dict_workflow,n8n_id)

    if response.status_code==200:
        tool_response={
            'status':200,
            'workflow_id':response.json().get('id')
        }
        return tool_response
    else:
        tool_response={
            'status':response.status_code,
            'reason':response.json().get('message')
        }

        return tool_response
    
@tool(description=search_tool_description)
async def web_search_tool(query:str)->str:

    search =TavilySearch(
        max_results=5,
        topic="general",
        include_answer=True,
        # include_raw_content=False,
        # include_images=False,
        # include_image_descriptions=False,
        # search_depth="basic",
        # time_range="day",
        # include_domains=None,
    )
    response=await search.ainvoke({'query':query})
    return response.get('answer')


@tool(description=workflow_search)
async def workflow_examples(query:str)->list[dict]:
    vector_store = Chroma(collection_name='n8n_workflow',embedding_function=embeddings,persist_directory="./chroma_db",create_collection_if_not_exists=False)
    retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 7, "fetch_k": 10, "lambda_mult": 0.5},
    )

    response=await retriever.ainvoke(query)
    out_put=[ json.loads( i.metadata.get('original_json')) for i in response ]

    return out_put


tools=[workflow_creator,update_wokflow,fetch_workflow,web_search_tool,workflow_examples]
