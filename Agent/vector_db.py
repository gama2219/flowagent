#this script is supposed to embedd and store json docs in the chroma_db

from langchain_community.document_loaders import JSONLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_google_genai._common import GoogleGenerativeAIError
from tqdm import tqdm
from time import sleep
from dotenv import dotenv_values
import json
import os

configurations:dict = dotenv_values()

google_api_key=configurations.get('google_api_key')


rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.5,  
    check_every_n_seconds=0.1,
    max_bucket_size=10
)

embeddings=GoogleGenerativeAIEmbeddings(model='models/gemini-embedding-001',
                                        google_api_key=google_api_key,
                                        request_options={"timeout": 15000},
                                        rate_limiter=rate_limiter
                                        )
vector_store = Chroma(collection_name='n8n_workflow',embedding_function=embeddings,persist_directory="./chroma_db")

def metadata_func(record: dict, metadata: dict) -> dict:
    metadata["original_json"] = json.dumps(record)
    return metadata

def check_if_lastelement(list_ord:list,element:list)->bool:
    if list_ord[len(list_ord) - 1] == element:
        return True
    else:
        return False
    

def handle_error_recursive(batchlist:list):
    mid =( len(batchlist)-1)//2
    a , b =[batchlist[:mid],batchlist[mid:]]
    try:
        if len(a) == 0:
            return
        vector_store.add_documents(documents=a)
    except GoogleGenerativeAIError as e :
        handle_error_recursive(a)

    try:
        if len(b)==0:
            return
        vector_store.add_documents(documents=b)
    except GoogleGenerativeAIError as e:
        handle_error_recursive(b)


#reducing the time it takes to generate the 

def database_creation(path_:str,batch:int)->None:
    lss:list=os.listdir(path_)

    batch_list = []
    for x in tqdm(lss,desc='loading workflow:',bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt}'):
       
        for i in os.listdir(path_+f'/{x}'):
            path=path_ + f'/{x}/{i}'
            loader=JSONLoader(file_path=path,jq_schema='.',content_key='.name',metadata_func=metadata_func,is_content_key_jq_parsable=True )
            batch_list.extend(loader.load())
            if (len(batch_list) == batch or (len(batch_list) > 0 and (check_if_lastelement(lss,x) and check_if_lastelement(os.listdir(path_+f'/{x}'),i)))):
                try:
                    vector_store.add_documents(documents=batch_list)
                    batch_list = []
                except GoogleGenerativeAIError as e :
                    error_message = str(e.args[0])
                    if "429" in error_message or "quota exceeded" in error_message.lower():
                        handle_error_recursive(batch_list)
                        batch_list=[]
                        continue
                    
if __name__ == "__main__":
                
    database_creation('workflows',30)
