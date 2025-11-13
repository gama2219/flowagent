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
#this will work well with a paid tier

configurations:dict = dotenv_values()

google_api_key=configurations.get('google_api_key')

rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.2,  
    check_every_n_seconds=0.1,
    max_bucket_size=10
)

embeddings = GoogleGenerativeAIEmbeddings(
    model='models/gemini-embedding-001',
    google_api_key=google_api_key,
    rate_limiter=rate_limiter
)

vector_store = Chroma(
    collection_name='n8n_workflow',
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

def metadata_func(record: dict, metadata: dict) -> dict:
    metadata["original_json"] = json.dumps(record)
    return metadata

def check_if_lastelement(list_ord:list, element)->bool:
    return list_ord[-1] == element if list_ord else False

def handle_error_recursive(batchlist:list):
    if len(batchlist) <= 1:
        sleep(30)  
        try:
            if len(batchlist) > 0:
                vector_store.add_documents(documents=batchlist)
                print(f"✓ Retry successful: {len(batchlist)} doc")
        except GoogleGenerativeAIError as e:
            print(f"✗ Failed: {e}")
        return
    
    mid = len(batchlist) // 2
    a, b = batchlist[:mid], batchlist[mid:]
    
    for batch in [a, b]:
        if len(batch) == 0:
            continue
        try:
            vector_store.add_documents(documents=batch)
            print(f"✓ Added {len(batch)} docs")
            sleep(20)  
        except GoogleGenerativeAIError as e:
            print(f"Rate limit on {len(batch)} docs, splitting...")
            handle_error_recursive(batch)

def database_creation(path_:str, batch:int)->None:
    lss = os.listdir(path_)
    batch_list = []
    total = 0
    
    for x in tqdm(lss, desc='Processing workflows'):
        for i in os.listdir(f'{path_}/{x}'):
            path = f'{path_}/{x}/{i}'
            loader = JSONLoader(
                file_path=path,
                jq_schema='.',
                content_key='.name // "untitled"',
                metadata_func=metadata_func,
                is_content_key_jq_parsable=True
            )
            docs = loader.load()
            batch_list.extend([d for d in docs if d.page_content.strip()])
            
            is_last = check_if_lastelement(lss, x) and check_if_lastelement(os.listdir(f'{path_}/{x}'), i)
            
            if len(batch_list) >= batch or (len(batch_list) > 0 and is_last):
                try:
                    vector_store.add_documents(documents=batch_list)
                    print(f"✓ Batch: {len(batch_list)} docs")
                    total += len(batch_list)
                    batch_list = []
                    sleep(20)
                except GoogleGenerativeAIError as e:
                    if "429" in str(e) or "quota" in str(e).lower():
                        print(f"Rate limit! Splitting {len(batch_list)} docs...")
                        handle_error_recursive(batch_list)
                        total += len(batch_list)
                        batch_list = []
                    else:
                        print(f"Error: {e}")
    
    print(f"\n✓ Total: {total} documents")
    print(f"✓ Vector store count: {vector_store._collection.count()}")

if __name__ == "__main__":
                
    database_creation('workflows',100)
