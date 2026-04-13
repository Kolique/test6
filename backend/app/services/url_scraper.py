"""Scrape and extract text content from URLs."""

import re

import httpx
from bs4 import BeautifulSoup


async def scrape_url(url: str) -> tuple[str, str]:
    """Fetch a URL and extract its text content.

    Returns (title, text_content).
    """
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script, style, nav, footer elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else url

    # Extract text from main content areas
    main = soup.find("main") or soup.find("article") or soup.find("body")
    if main is None:
        raise ValueError(f"Impossible d'extraire le contenu de {url}")

    text = main.get_text(separator="\n", strip=True)
    # Clean up excessive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)

    if len(text.strip()) < 50:
        raise ValueError(f"Contenu insuffisant extrait de {url}")

    return title, text
