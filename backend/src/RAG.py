import os
import faiss
from dotenv import load_dotenv
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

class RAG:
    def __init__(self, folder_path,retriever,llm):
        """This is init method for module 1 and 2 

        Args:
            folder_path (_type_): _description_
        """
        self.folder_path = folder_path
        self.retriever = retriever
        self.llm = llm

    def run(self,query : str) -> str:
        """This run method for ModuleFourAndFive class.
        Args:
            query (_String_): asked query by user.
        Returns:
            ans (_string_): llm response

        """
        prompt = PromptTemplate(
        template="""
        You are a highly experienced Banking Domain Expert with deep knowledge of
        retail banking, corporate banking, risk management, compliance, loans, 
        credit cards, financial regulations, and investment products.

        Your role is to act as a domain consultant and provide clear, accurate, 
        and concise answers ONLY based on the given context. 

        Instructions:
        1. Only use the information provided in the context to answer.
        2. If the answer is not present in the context, respond with:
        "The information is not available in the provided context."
        3. Provide explanations in a professional and structured manner.
        4. Where applicable, highlight important terms, risks, or compliance notes.

        here is the context : 
        context : {text} 
        Question :{question}
        """,
        input_variables=["text", "question"]
        )

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
        rag_chain = (
        {"text": self.retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | self.llm
        | StrOutputParser()
        )
        ans = rag_chain.invoke(query)
        return ans
# obj = ModuleFourAndFive("/Users/sameersingh/Documents/masin_ai/data/module1&2/Khabourah_school-_Final_EOT_report.pdf")
# questions = """
# write an EOT letter from the atteched report.
# """
# ans = obj.run(questions)
# print(ans)