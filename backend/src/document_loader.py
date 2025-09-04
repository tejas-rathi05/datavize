## importing all importent lib
import os
import sys
import glob
import math
import tempfile
from pathlib import Path
from mistralai import Mistral
from pypdf import PdfReader, PdfWriter
from langchain.schema import Document
from PyPDF2 import PdfReader, PdfWriter
from langchain_community.document_loaders import PyMuPDFLoader,TextLoader,Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter



## method for ocr the scanned pdf
def ocr_scanned_pdf(pdf_path : str) -> str:
    """ocr_scanned_pdf methhod is used for perform ocr on scanned pdf's.

    Args:
        pdf_path (str): path of the files 

    Returns:
        str: text of the ocr 
    """
    try:
        print(f"INFO : OCR start for file {pdf_path}")
        api_key = "paste your mistral key here"
        client = Mistral(api_key=api_key)
        uploded_pdf = client.files.upload(
        file={
            "file_name":pdf_path,
            "content":open(pdf_path,"rb")
        },
        purpose="ocr"
        )
        client.files.retrieve(file_id=uploded_pdf.id)
        signed_url = client.files.get_signed_url(file_id=uploded_pdf.id)
        ocr_response = client.ocr.process(
        model = "mistral-ocr-latest",
        document={
            "type" : "document_url",
            "document_url" : signed_url.url,
        },
        include_image_base64=False
        )
        text =""
        for page in ocr_response.pages:
            text = text + page.markdown + "\n"
            # print(page.markdown + "\\n")
        print(f"INFO : OCR completed for the file {pdf_path}")
        return text
    except Exception as exp:
        print(f"ERROR : error in ocr_scanned_pdf : {exp}")
        return ""

## method for checking file size(whether it is within 50 mb)
def is_pdf_too_large(pdf_path : str, size_limit_mb=50) -> bool:
    """is_pdf_too_large method is use to check whether pdf file is within 50 mb or not

    Args:
        pdf_path (str): path of the pdf files.
        size_limit_mb (int, optional): _description_. Defaults to 50.

    Returns:
        bool: True or False
    """
    try:
        file_size_bytes = os.path.getsize(pdf_path)
        file_size_mb = file_size_bytes / (1024 * 1024)
        print(f"📄 File size: {file_size_mb:.2f} MB")
        return file_size_mb > size_limit_mb
    except Exception as exp:
        print(f"INFO : is_pdf_too_large method faild due to :{exp}")

## method for reducing the size(mb) of the pdf if it is more than 50 mb
def split_pdf_by_size(input_path, target_size_mb=48):
    """split_pdf_by_size method is used for splitting pdf by size

    Args:
        input_path (_type_): _description_
        target_size_mb (int, optional): _description_. Defaults to 48.
    """
    try:
        print("INFO : split_pdf_by_size method started")
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        part = 1
        writer = PdfWriter()
        # Get the directory of document.py
        CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
        # Go one level up to reach project root
        PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
        ## path for the temp folder
        temp_folder = PROJECT_ROOT +"/data"+"/temp_folder/"
        ## first we need to deleting all files from temp folder
        folder_path = PROJECT_ROOT +"/data"+"/temp_folder"
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f" INFO : Deleted old files from temp folder: {file_path}")
        for i in range(total_pages):
            writer.add_page(reader.pages[i])
            # temp_path = "/Users/sameersingh/Documents/MASIN/construction_claims_and_arbitration_expert/data/temp_folder/"+f"split_part_{part}.pdf"
            temp_path = temp_folder + f"split_part_{part}.pdf"
            with open(temp_path, "wb") as f:
                writer.write(f)

            size_mb = os.path.getsize(temp_path) / (1024 * 1024)

            if size_mb >= target_size_mb or i == total_pages - 1:
                print(f"✅ Part {part} saved: {temp_path} ({size_mb:.2f} MB)")
                part += 1
                writer = PdfWriter()
            else:
                os.remove(temp_path)  # Not final yet, keep adding pages
    except Exception as exp:
        print(f"ERROR : split_pdf_by_size method failed due to {exp}")

## method for splitting pdf's if pages are more than 1000 pages and then performing ocr
def split_pdf_using_temp_files(pdf_path : str, max_pages_per_chunk=500) -> str:
    """split_pdf_using_temp_files method is use for proceesing scanned pdf's if pages is more than 1000.

    Args:
        pdf_path (str): path of the pdf's
        max_pages_per_chunk (int, optional): _description_. Defaults to 900.

    Returns:
        str: _description_
    """
    try:
        print("INFO : split_pdf_using_temp_files method started")
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        num_chunks = math.ceil(total_pages / max_pages_per_chunk)
        
        final_text = ""

        for chunk in range(num_chunks):
            writer = PdfWriter()
            start = chunk * max_pages_per_chunk
            end = min((chunk + 1) * max_pages_per_chunk, total_pages)

            for i in range(start, end):
                writer.add_page(reader.pages[i])

            # Create temp file
            with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as temp_file:
                writer.write(temp_file)
                temp_file.flush()  # Ensure it's written
                temp_path = temp_file.name

                # 👇 Call your OCR function with the file path
                print(f"INFO : 📄 Processing chunk {chunk + 1}/{num_chunks} | Pages: {end - start}")
                chunk_text = ocr_scanned_pdf(temp_path)
                final_text += chunk_text + "\n"

        return final_text
    except Exception as exp:
        print(f"ERROR : split_pdf_using_temp_files method failed : {exp}")
        return ""

## method for loading and extracting text from documents
def document_loaders(folder_path : str) -> list:
    """
    Loads a document from a file path.

    This function inspects the file extension to determine the appropriate
    document loader. It is designed to handle various document types,
    starting with PDF files using PyMuPDFLoader.

    Args:
        file_path (str): The full path to the document file to be loaded.

    Returns:
        list: A list of `langchain_core.documents.Document` objects, where each
              object represents a page of the document.
    """
    try:
        print("INFO : document_loader method started")
        final_document = []
        folder_path = folder_path + "/*"
        print("INFO : starting text Extraction ")
        for file in glob.glob(folder_path):
            print(file)
            if file.endswith(".pdf") or file.endswith(".PDF"):
                try:
                    print("INFO : pdf......")
                    # time.sleep(10)
                    loader = PyMuPDFLoader(file)
                    page = loader.load()
                    # print(page)
                    ## handling scanned pdf using mistral ai(mistral ocr)
                    if page[0].page_content == "" or len(page[0].page_content) < 10: 
                        if is_pdf_too_large(file):
                            print("INFO : file is large")
                            # splitting pdf by size
                            split_pdf_by_size(file)
                            # Get the directory of document.py
                            CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
                            # Go one level up to reach project root
                            PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
                            ## path for the temp folder
                            temp_folder_path = PROJECT_ROOT +"/data"+"/temp_folder/*"
                            # temp_folder_path = "/Users/sameersingh/Documents/MASIN/construction_claims_and_arbitration_expert/data/temp_folder/*"
                            page = []
                            for temp_file in glob.glob(temp_folder_path):
                                text = split_pdf_using_temp_files(temp_file)
                                temp_pages = []
                                temp_pages.append(
                                Document(
                                page_content=text,
                                metadata={"source": file}
                                )   
                                )
                                page += temp_pages
                        else:
                            text = split_pdf_using_temp_files(file)
                            page = []
                            page.append( 
                                Document(
                                    page_content=text,
                                    metadata={"source": file}
                                )
                            )
                    # print(len(page))
                except Exception as exp:
                    try:
                        text = split_pdf_using_temp_files(file)
                        page = []
                        page.append(
                            Document(
                                page_content=text,
                                metadata={"source": file}
                            )
                        )
                    except Exception as exp:
                        print(f"ERROR : Can't extract the text from file {file} because of some problem : {exp}")
            if file.endswith(".docx"):
                print("INFO : docx......")
                # time.sleep(10)
                loader = Docx2txtLoader(file)
                page = loader.load()
                # print(len(page))
            if file.endswith(".txt"):
                print("INFO : txt......")
                # time.sleep(10)
                loader = TextLoader(file)
                page = loader.load()
            final_document = final_document + page
            # print(len(final_document))
            # time.sleep(10)
        print("INFO : .........Extraction completed...........")
        return final_document
    except Exception as exp:
        print(f"ERROR : there is problem while extracting text from the document : {exp}")
        return []

## method for creating embeddings   
def Chunking(document : list) -> list:
    """Chunking method is use for splitting the text into multiple chunks 

    Args:
        document (list): A list of `langchain_core.documents.Document` objects, where each
              object represents a page of the document.

    Returns:
        list: lists of chunks
    """
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_documents(document)
        return chunks
    except Exception as exp:
        print(f"ERROR : there is problem while creating the Chunks : {exp}")
        return []

# print(document_loaders("/Users/sameersingh/Documents/MASIN/construction_claims_and_arbitration_expert/data/processed"))