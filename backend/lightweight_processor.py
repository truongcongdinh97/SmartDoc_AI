"""Lightweight Document Processor — 3-tier pipeline for all users.

Tier 1: pypdf text extraction (instant, 100% CPU, không cần model)
Tier 2: RapidOCR (cho PDF scan, nhẹ hơn Docling 10x)
Tier 3: Docling (fallback cho layout phức tạp, cần GPU)

Wing: smartdoc_backend
Topic: document_processing
Updated: 2026-05-06
"""

import os
import re
import math
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)


class LightweightProcessor:
    """3-tier document processor. Try fast first, fallback slow."""

    # ─── Tier 1: pypdf ─────────────────────

    def extract_text_pypdf(self, file_path: str) -> Optional[str]:
        """Extract text via pypdf. Fastest, no models."""
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text and text.strip():
                    pages.append(text.strip())
            if pages:
                result = "\n\n".join(pages)
                logger.info(f"[pypdf] Extracted {len(pages)} pages, {len(result)} chars")
                return result
            return None
        except Exception as e:
            logger.warning(f"[pypdf] Failed: {e}")
            return None

    # ─── Tier 2: RapidOCR ──────────────────

    def extract_text_ocr(self, file_path: str) -> Optional[str]:
        """OCR via RapidOCR. For scanned PDFs, no GPU needed."""
        try:
            from rapidocr_onnxruntime import RapidOCR
            import fitz  # PyMuPDF

            ocr = RapidOCR()
            doc = fitz.open(file_path)
            all_text = []

            for page_num in range(len(doc)):
                pix = doc[page_num].get_pixmap(dpi=200)
                img = pix.tobytes("png")
                result, _ = ocr(img)
                if result:
                    page_text = "\n".join([line[1] for line in result if line[1]])
                    all_text.append(page_text)

            doc.close()
            if all_text:
                result = "\n\n".join(all_text)
                logger.info(f"[OCR] Extracted {len(all_text)} pages via RapidOCR")
                return result
            return None
        except ImportError:
            logger.warning("[OCR] rapidocr_onnxruntime or PyMuPDF not installed")
            return None
        except Exception as e:
            logger.warning(f"[OCR] Failed: {e}")
            return None

    # ─── Tier 3: Docling (fallback) ────────

    def extract_text_docling(self, file_path: str) -> Optional[str]:
        """Full Docling pipeline. Heavy, needs GPU for speed."""
        try:
            from docling.document_converter import DocumentConverter
            converter = DocumentConverter()
            result = converter.convert(file_path)
            markdown = result.document.export_to_markdown()
            logger.info(f"[Docling] Converted {file_path}")
            return markdown
        except Exception as e:
            logger.error(f"[Docling] Failed: {e}")
            return None

    # ─── Chunking ─────────────────────────

    def chunk_text(self, text: str, chunk_size: int = 2000) -> List[str]:
        """Split text into chunks at paragraph boundaries.

        Args:
            text: Full markdown text
            chunk_size: Target chars per chunk (~500 tokens)

        Returns:
            List of chunk strings
        """
        if not text:
            return []

        paragraphs = text.split('\n\n')
        chunks = []
        current = []

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            current_len = sum(len(p) for p in current)
            if current_len + len(para) > chunk_size and current:
                chunks.append('\n\n'.join(current))
                current = [para]
            else:
                current.append(para)

        if current:
            chunks.append('\n\n'.join(current))

        if not chunks:
            chunks = [text]

        logger.info(f"[Chunk] Split {len(text)} chars into {len(chunks)} chunks")
        return chunks

    def chunk_data(self, text: str, chunk_size: int = 2000) -> List[dict]:
        """Generate chunk data with embeddings placeholder.

        Args:
            text: Full markdown text
            chunk_size: Target chars per chunk

        Returns:
            List of chunk dicts with text, length, index
        """
        chunks = self.chunk_text(text, chunk_size)
        return [
            {'index': i, 'text': c, 'length': len(c)}
            for i, c in enumerate(chunks)
        ]

    # ─── Main pipeline ─────────────────────

    def process(self, file_path: str, mode: str = "auto") -> dict:
        """Process document with auto fallback.

        Args:
            file_path: Path to PDF file
            mode: 'fast' (pypdf only), 'auto' (pypdf→OCR→Docling),
                  'ocr' (force OCR), 'enhanced' (force Docling)

        Returns:
            dict with success, markdown, method, pages, chars
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}

        # Get file size for logging
        file_size = os.path.getsize(file_path)

        if mode == "enhanced":
            markdown = self.extract_text_docling(file_path)
            method = "docling"
        elif mode == "ocr":
            markdown = self.extract_text_ocr(file_path) or self.extract_text_docling(file_path)
            method = "ocr"
        elif mode == "fast":
            markdown = self.extract_text_pypdf(file_path)
            method = "pypdf"
        else:  # auto
            markdown = self.extract_text_pypdf(file_path)
            if markdown and len(markdown) > 50:
                method = "pypdf"
            else:
                logger.info("[Auto] pypdf returned little text, trying OCR...")
                markdown = self.extract_text_ocr(file_path)
                if markdown:
                    method = "ocr"
                else:
                    logger.info("[Auto] OCR failed, trying Docling...")
                    markdown = self.extract_text_docling(file_path)
                    method = "docling" if markdown else None

        if markdown:
            return {
                "success": True,
                "markdown": markdown,
                "chunks": self.chunk_data(markdown),
                "method": method or "unknown",
                "chars": len(markdown),
                "size_bytes": file_size,
            }
        else:
            return {"success": False, "error": "All extraction methods failed", "method": None}
