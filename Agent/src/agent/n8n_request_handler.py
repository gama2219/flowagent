#n8n request handler custom class

from requests import request
import json



class n8n_request_handler:

    def __init__(self):
        self.header={
             'accept': 'application/json'
        }
    
    def createWorkflow(self,workflow:dict,n8n_id:str,url:str):

        
        create_workflow_url=url + '/api/v1/workflows'
        header_update:dict={**self.header,
                            'X-N8N-API-KEY':n8n_id,
                            'Content-Type': 'application/json'}

        response = request('POST',url=create_workflow_url,headers=header_update,data=json.dumps(workflow))

        return response
    
    def fetchWorkflow_1(self,id:str,n8n_id:str,url:str):
        fetch_url=url + '/api/v1/workflows' + f'/{id}'
        header_update={
            **self.header,
            'X-N8N-API-KEY':n8n_id
        }

        response=request('GET',url=fetch_url,headers=header_update)

        return response

    def updateWorkflow(self,id:str,workflow:dict,n8n_id:str,url:str):
        update_url=url + '/api/v1/workflows' + f'/{id}'
        header_update={
            **self.header,
            'X-N8N-API-KEY':n8n_id,
            'Content-Type': 'application/json'}

        response = request ('PUT',update_url,headers=header_update,data=json.dumps(workflow) )

        return response
    
    def fetchWorkflow(self,n8n_id:str,url:str):
        fetch_url=url + '/api/v1/workflows'
        update_header={
            **self.header,
            'X-N8N-API-KEY':n8n_id
        }
        response=request('GET',url=fetch_url,header=update_header)
        
        return response