from fastapi import FastAPI,Header,Request,HTTPException
from contextlib import asynccontextmanager
from src.agent.utils.dbcreation import database_creation
from requests import request
from typing import Annotated
import os 


app = FastAPI()






@app.get("/n8n_user")
def n8n_user(x_n8n_api_key:Annotated[str | None, Header()],n8n_endpoint:Annotated[str | None, Header()])->dict:

    """
    the endpoint should be a complete endpoint f'{n8n_endpoint}/api/v1/users/{email}?includeRole=true'
    """

    headers={
        'accept': 'application/json',
        'X-N8N-API-KEY':x_n8n_api_key
    }

    response=request('GET',n8n_endpoint,headers=headers)
    response.raise_for_status()

    """
    response 
    """


    return response.json()


@app.get("/workflows")
def workflows(x_n8n_api_key:Annotated[str | None, Header()],n8n_endpoint:Annotated[str | None, Header()])->dict:
    
    """
    the ebdpoint should be a complete endpoint f'{n8n_endpoint}/api/v1/workflows?excludePinnedData=true&limit=100'
    """

    headers={
        'accept': 'application/json',
        'X-N8N-API-KEY':x_n8n_api_key
    }
    response=request('GET',n8n_endpoint,headers=headers)

    response.raise_for_status()
    response_body=response.json()

    return_response={'data':[x.get('name') for x in response_body.get('data') if  x.get('isArchived')==False]}
    """
    return dictionary  {data:[..list of workflows name]}
    """
    
    return_response

@app.get("/test")
def test_endpoint(n8n_endpoint:Annotated[str | None, Header()]):

    return {'headers':n8n_endpoint}