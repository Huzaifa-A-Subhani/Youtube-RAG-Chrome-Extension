# rag_backend.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_huggingface import HuggingFaceEmbeddings
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.schema import Document
from langchain_core.runnables import RunnableLambda, RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from urllib.parse import urlparse, parse_qs
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Allow requests from the extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    video_id: str
    question: str

@app.post("/query")
async def rag_query(query: Query):
    # 🔹 call your existing RAG pipeline here
    answer = run_rag_pipeline(query.video_id, query.question)
    return {"answer": answer}

# Replace with your actual RAG function
def run_rag_pipeline(video_id, question):

    try:
        yt = YouTubeTranscriptApi()
        transcript_list = yt.fetch(video_id=video_id)
        transcript=" ".join(snippet.text for snippet in transcript_list )
    #print(transcript)
    except TranscriptsDisabled:
        return "No captions available for this video"
    
    docs = [Document(page_content=transcript)]
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)

    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2",
        model_kwargs={"device": "cpu"}
    )

    vector_store = FAISS.from_documents(chunks, embedding)

    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 4})

    def format_docs(retrieved_docs):
        context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
        return context_text

    llm = ChatOpenAI(
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",  # Important!
        model="deepseek/deepseek-r1"  # DeepSeek R1 free model
    )

    prompt = PromptTemplate(
        template="""You are a helpful assistant.
        Answer only from the provided transcript context.
        If the context is insufficient, just say you don't know.
    
        {context}
        Question: {question}""",
        input_variables=["context", "question"]
    )

    parallel_chain = RunnableParallel({
        'context': retriever | RunnableLambda(format_docs),
        'question': RunnablePassthrough()
    })

    parser = StrOutputParser()

    final_chain = parallel_chain | prompt | llm | parser

    return final_chain.invoke(question)
    