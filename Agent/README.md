# Agent Backend

The Agent  handles the creation and updating of n8n workflows through conversation

## 🧠 How it Works

The agent uses a **Supervisor Architecture (via LangGraph)** :

1. **Context Retrieval**: It searches a ChromaDB vector database to find existing workflow patterns that match the user's request.
2. **n8n Interaction**: A specialized sub-agent connects to your n8n instance to push updates or create new nodes.


## 🔑 Authentication

To make requests to the agent server (at localhost:2024), you must include the following headers:

- **Bearer Token**: A Supabase JWT to verify the user.
- **x-n8n-api-key**: The API key for the target n8n instance.
- **x-n8n-endpoint**: The URL of the target n8n instance.

## 🛠 Local Testing

To test the agent logic separately from the main system:

1. Create a virtual environment and install dependencies:
  macOS/Linux:
  ```bash
  python3 -m venv .venv && source .venv/bin/activate && pip install -e .
  ```
Windows:
  ```bash
  python -m venv .venv; .venv\Scripts\activate; pip install -e .
  ```
2. Fill in the `.env` file (see `.env.example`).
3. Start the agent server:

```bash
langgraph dev --allow-blocking --no-browser
```
The current vector db  contains 150 workflows from the workflow collection; more workflows  will  improve the agent's performance and accuracy.
Contribute your n8n .json workflow files to the workflows folder.
