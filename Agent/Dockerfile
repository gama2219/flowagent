FROM python:3.12-slim

RUN pip install --no-cache-dir -U "langgraph-cli[inmem]"


WORKDIR /app

COPY . .

RUN pip install -e .

RUN python v_db2.py


ENTRYPOINT  ["langgraph", "dev","--allow-blocking","--no-browser"]