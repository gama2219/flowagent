from langchain_community.document_loaders import JSONLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from tqdm import tqdm
from time import sleep
import json
import os


google_api_key='AIzaSyCiqPhMA-zpr03dUtW122r83cT0IaiDCHE'


def metadata_func(record: dict, metadata: dict) -> dict:
    metadata["original_json"] = json.dumps(record)
    return metadata



def database_creation(path_:str)->None:
    lss:list=os.listdir(path_)

    embeddings=GoogleGenerativeAIEmbeddings(model='models/gemini-embedding-001',google_api_key=google_api_key)
    vector_store = Chroma(collection_name='n8n_workflow',embedding_function=embeddings,persist_directory="./chroma_db")
    


    for x in tqdm(lss,desc='loading workflow:',bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt}'):
        for i in os.listdir(path_+f'/{x}'):
            path=path_ + f'/{x}/{i}'
            
            loader=JSONLoader(file_path=path,jq_schema='.',content_key='.name',metadata_func=metadata_func,is_content_key_jq_parsable=True )
            docs=loader.load()
            try:
                vector_store.add_documents(documents=docs)
            except Exception as e:
                sleep(70)
                vector_store.add_documents(documents=docs)
                continue
 
database_creation('workflows')