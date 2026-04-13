"""Parse PDF and DOCX documents into plain text."""

import io

from PyPDF2 import PdfReader
from docx import Document as DocxDocument


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def parse_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = DocxDocument(io.BytesIO(file_bytes))
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def parse_document(file_bytes: bytes, filename: str) -> str:
    """Parse a document based on its file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return parse_docx(file_bytes)
    else:
        raise ValueError(f"Format non supporte : {filename}. Utilisez PDF ou DOCX.")
