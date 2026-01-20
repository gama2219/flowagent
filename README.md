# Flow Agent 

Talk to your n8n workflows.

Flow Agent is an AI-powered companion for n8n developers.Allows you to create, refine, and update workflows simply by chatting.

![Screenshot at 2026-01-20 12-30-15](https://github.com/user-attachments/assets/63b1fa61-6cc4-41e9-b6cd-3f62dbc06801)

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

Open `.env` and fill in the following variables:

**LANGSMITH_API_KEY** - Your LangSmith API key for debugging  
**google_api_key** - Your Google Gemini API Key  
**TAVILY_API_KEY** - Required for real-time node research  
**NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL (Local or Cloud)  
**NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase Anon/Public key  
**agent_name** - Default is `flowagent`  
**LANGGRAPH_SERVER_URL** - Default is `http://127.0.0.1:2024`

## 3️⃣ Launch the Agent

Build and start the application using your preferred tool:

**Using Docker:**
```bash
docker compose up
```
**Using Podman :**

```bash
podman-compose up --build
```

The application will be available at http://localhost:3000.


### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request

