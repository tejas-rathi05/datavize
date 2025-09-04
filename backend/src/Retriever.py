import os
import faiss
from dotenv import load_dotenv
# from langchain_anthropic import ChatAnthropic
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI,OpenAI
from document_loader import document_loaders,Chunking
# Load environment variables
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key is not None:
    os.environ["OPENAI_API_KEY"] = openai_api_key
else:
    raise EnvironmentError("OPENAI_API_KEY not found in environment variables.")

class Retriever:
    def __init__(self,folder_path):
        self.folder_path = folder_path

    def retriever(self):
        """
        retriever method is responsible for extracting text from documents, chunking and creating the embeddings and then store those embeddings into the vector database.
        """
        ## loading the files
        print("INFO : loading the files......")
        document = document_loaders(self.folder_path)
        ## creating Chunking
        print("INFO : creating Chunking......")
        chunks = Chunking(document)
        ## creating embeddings
        print("INFO : creating embeddings.......")
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        ## creating index 
        print("INFO : creating index  ........")
        index = faiss.IndexFlatL2(3072) 
        ## creating vector stores
        print("INFO : creating vector stores......")
        vector_store=FAISS(
            embedding_function=embeddings,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )
        ## adding embeddings in vector store
        print("INFO : adding embeddings in vector store")
        vector_store.add_documents(chunks)
        ## creating retriever
        print("INFO :  creating retriever.......")
        retriever=vector_store.as_retriever(search_kwargs={"k": 230})
        print("INFO : intilizing llm's gpt 5..........")
        llm = ChatOpenAI(model="gpt-4.1-2025-04-14",temperature=1)
        return retriever,llm