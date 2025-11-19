from langgraph_sdk import Auth
from supabase import create_client, Client
import asyncio
import os

url=os.getenv('supabase_endpoint')
anon=os.getenv('supabase_anon_key')



auth=Auth()
supabase:Client = create_client(url,anon)

async def get_user_info(jwt:str,n8n_id:str,n8n_endpoint:str)->dict:
    user_info = await asyncio.to_thread(supabase.auth.get_user, jwt)
    response={"identity":user_info.user.id,"n8n_id":n8n_id,"n8n_endpoint":n8n_endpoint}

    return response


@auth.authenticate
async def authenticate_request(authorization:str,headers:dict[bytes, bytes])->Auth.types.MinimalUserDict:

    tokens:list=authorization.split(" ")
    n8n_id=headers.get(b'x-n8n-api-key')
    n8n_endpoint=headers.get(b'x-n8n-endpoint')

    if len(tokens)>2:
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail='include only Bearer and jwt key in authorization '
        )
    elif tokens[0]!='Bearer' and not n8n_id:
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="""Authentication failed: Invalid Bearer token format or missing N8N API key. 
                        Please provide a valid 'Bearer <token>' in Authorization header and a valid X-N8N-API-KEY header."""
        )
    else:

        try:

            jwt_tokens=tokens[1] 
            response=await get_user_info(jwt_tokens,n8n_id.decode(),n8n_endpoint.decode())

            return response

        except Exception as e:
            raise Auth.exceptions.HTTPException(
                status_code=401,
                detail=e
            )


# Add authorization rules to actually control access to resources
@auth.on
async def forbidden_handler(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add owner to resource metadata and filter by owner."""
    raise Auth.exceptions.HTTPException(status_code=403, detail="Forbidden")


@auth.on.threads
async def threads_handler(
    ctx:Auth.types.AuthContext,
    value:dict
):
    metadata = value.setdefault("metadata", {})
    metadata["owner"] = ctx.user.identity
    return {"owner": ctx.user.identity}

@auth.on.assistants
async def assistanthandler(
    ctx:Auth.types.AuthContext,
    value:dict

):
    pass