# Flow Agent 

Talk to your n8n workflows.

Flow Agent is an AI-powered companion for n8n developers.Allows you to create, refine, and update workflows simply by chatting.
![upl2](https://github.com/user-attachments/assets/0912a77e-ee6b-463d-a691-7285aa31466a)

## 📋 Prerequisites

To run this project, you must have a container engine installed:

- **Docker & Docker Compose**
- **OR**
- **Podman & Podman Compose**
  
**n8n Instance**: An accessible n8n instance with the Public API enabled.

You will also need:

- Access to a Supabase project (Local instance or Cloud)
- API keys for Google AI and Tavily

## 🛠️ Quick Setup Guide

### Clone the  repo
```bash
git clone https://github.com/gama2219/flowagent.git
```

### Navigate into the project directory:

    cd flowagent

### 1️⃣ Initialize the Database

> **⚠️ IMPORTANT**
> 
> You must run the initialization script before starting the containers to ensure the database schema is ready.

1. Navigate to `scripts/01-create-tables.sql`
2. Copy the SQL content
3. Paste and run it in your Supabase SQL Editor to create the required tables

### 2️⃣ Configure Environment Variables

1. Create your environment file by copying the example:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in the necessary variables. Ensure you:
   - **Mandatory Integrations**: Provide `TAVILY_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **Model Selection**: Choose your preferred model provider (Google Gemini, OpenAI, Anthropic, etc.), uncomment the corresponding `model` line, and provide the required API key (e.g., `GOOGLE_API_KEY`).
   - **Observability (Optional)**: Provide `LANGSMITH_API_KEY` if you wish to use LangSmith for tracing.
   - **Defaults**: `agent_name`, `NEXT_PUBLIC_APP_URL`, and `LANGGRAPH_SERVER_URL` are pre-configured for local development but can be adjusted if needed.


## 3️⃣ Launch the Agent

Build and start the application using your preferred tool:

**Using Docker:**
```bash
docker compose up -d
```
**Using Podman :**

```bash
podman-compose up -d
```

The application will be available at http://localhost:3000.

To stop and remove containers:

    Docker: docker compose down

    Podman: podman-compose down


### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request

