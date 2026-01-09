from fastapi import FastAPI,Header,Request,HTTPException
from contextlib import asynccontextmanager
from requests import request
from typing import Annotated
from pathlib import Path
from v_db import setup_chroma_db
import os 



vector_path = Path('chroma_db')
id = os.getenv('workflows_drive_location')
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
