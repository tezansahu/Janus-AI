FROM python:3.8-slim

RUN apt-get update -y && \
    apt-get dist-upgrade -y && \
    apt-get install -y && \
    apt-get install build-essential -y \
    supervisor wget unzip

WORKDIR /user/src/janus-ai/

COPY paraphrasingModule.py /user/src/janus-ai/paraphrasingModule.py
COPY main.py /user/src/janus-ai/main.py
COPY requirements.txt /user/src/janus-ai/requirements.txt

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]