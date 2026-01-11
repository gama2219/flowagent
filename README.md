# Flow Agent 

Talk to your n8n workflows. Build and iterate in seconds.

Flow Agent is an AI-powered companion for n8n developers. It bridges the gap between natural language and complex automation, allowing you to create, refine, and update workflows simply by chatting.

## 📋 Prerequisites

To run this project, you must have a container engine installed:

- **Docker & Docker Compose**
- **OR**
- **Podman & Podman Compose**

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
