FROM python:3.12-slim

RUN pip install --no-cache-dir -U "langgraph-cli[inmem]"


WORKDIR /app

COPY . .

RUN pip install -e .


ENTRYPOINT  ["langgraph", "dev","--allow-blocking","--no-browser"]