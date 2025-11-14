import pickle
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import dotenv_values
import json
import os
import gdown



vector_store = Chroma(
    collection_name='n8n_workflow',
    persist_directory="./chroma_db"
)



def setup_chroma_db(path:str,id:str):

    #load the collection

    try:
        gdown.download(output=output_path,id=id)

        print('✓ collection fetch complete.\n vector db creation in progress.\n ')

        with open('chroma_export.pkl', 'rb') as f:
             data = pickle.load(f)

        vector_store._collection.add(
                                    ids=data['ids'],
                                    documents=data['documents'],
                                    metadatas=data['metadatas'],
                                    embeddings=data['embeddings']
                                )
        
        print('✓ workflow vector db successfuly created ')
        



        pass
    except Exception as e:
        print(f"An error occurred during download: {e}")

if __name__ == '__main__':
    id ='1-wf5LVkvhUZgu4xKfSPcO7zhOBVRAOB6'
    output_path = 'chroma_export.pkl'

    setup_chroma_db(output_path,id)
        
