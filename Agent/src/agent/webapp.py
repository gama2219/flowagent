from fastapi import FastAPI,Header,Request,HTTPException
from contextlib import asynccontextmanager
from src.agent.utils.dbcreation import database_creation
from requests import request
from typing import Annotated
from pathlib import Path
from v_db import setup_chroma_db
import os 

vector_path = Path('chroma_db')
id ='1-wf5LVkvhUZgu4xKfSPcO7zhOBVRAOB6'
output_path = 'chroma_export.pkl'

@asynccontextmanager
async def lifespan(app: FastAPI):


    if vector_path.exists():
        print("vector database exists")
        pass
    else:
        setup_chroma_db(output_path,id)
    
    yield

app = FastAPI(lifespan=lifespan)
