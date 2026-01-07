FROM python:3.12-slim

RUN pip install "langgraph-cli[inmem]"


WORKDIR /app

COPY . .

RUN pip install -e .


CMD ["langgraph", "dev","--allow-blocking","--no-browser"]