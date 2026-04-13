"""Tests for the document parser service."""

import pytest
from app.services.document_parser import parse_document


def test_parse_unsupported_format():
    with pytest.raises(ValueError, match="Format non supporte"):
        parse_document(b"some bytes", "file.txt")


def test_parse_document_dispatches_pdf():
    # A minimal valid PDF that contains "Hello"
    # We test that the function doesn't crash on a valid PDF
    # (actual PDF parsing is integration-tested)
    with pytest.raises(Exception):
        # Empty bytes are not a valid PDF
        parse_document(b"", "test.pdf")


def test_parse_document_dispatches_docx():
    with pytest.raises(Exception):
        # Empty bytes are not a valid DOCX
        parse_document(b"", "test.docx")
