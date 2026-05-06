"""Backend: Document Refinement — AI-powered document improvement.

Uses DeepSeek (ds2api) as primary AI, Ollama fallback.
Prompts designed to preserve original content, only format/structure changes.

Wing: smartdoc_backend
Topic: document_refinement
Updated: 2026-05-06
"""

from typing import Dict, Any, Optional
from ollama_client import OllamaClient
from ds2api_client import DS2APIClient


CHANGE_NOTHING_PROMPT = """
QUAN TRONG: Tuyet doi KHONG thay doi noi dung goc.
- Giu nguyen so lieu, ten, ngay thang, con so, danh tu rieng
- KHONG them, KHONG bot, KHONG sua bat ky thong tin nao
- Chi thay doi ve mat hinh thuc: format, chinh ta, ngu phap
- Neu khong chac, giu nguyen phan do

GOC: Can giu nguyen toan bo thong tin, chi sua loi chinh ta neu co.
"""


class DocumentRefiner:
    """Refines documents using dual AI providers."""

    def __init__(self, ollama_client: OllamaClient, ds2api_client: Optional[DS2APIClient] = None):
        self.ollama = ollama_client
        self.ds2api = ds2api_client or DS2APIClient()

    def _call_ai(self, system_prompt: str, user_prompt: str, max_retry: int = 1) -> Optional[str]:
        """Try ds2api first, fallback Ollama."""
        if self.ds2api and self.ds2api.is_available():
            try:
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
                return self.ds2api.chat(messages)
            except Exception as e:
                print(f"[Refiner] ds2api failed: {e}")

        try:
            response = self.ollama.chat(prompt=user_prompt, task='document_refinement')
            if 'message' in response:
                return response['message'].get('content')
        except Exception as e:
            print(f"[Refiner] Ollama failed: {e}")

        return None

    def summarize(self, markdown: str) -> str:
        """Generate summary, preserving all facts."""
        result = self._call_ai(
            system_prompt="""Ban la tro ly AI giup tom tat tai lieu.
Tuyet doi KHONG them, KHONG bot, KHONG binh luan.
Chi rut gon, giu nguyen y chinh, so lieu, ten rieng.""",
            user_prompt=f"Tom tat tai lieu sau, giu nguyen cac con so va thong tin quan trong:\n\n{markdown[:8000]}",
        )
        return result or "Khong the tao tom tai."

    def formalize(self, markdown: str) -> str:
        """Rewrite in formal tone, preserving all content exactly."""
        result = self._call_ai(
            system_prompt=f"""Ban la tro ly chinh sua van ban. {CHANGE_NOTHING_PROMPT}
Viet lai van ban bang van phong trang trong, chuyen nghiep.
CHI sua: chinh ta, ngu phap, format. KHONG doi noi dung.""",
            user_prompt=f"Viet lai bang van phong trang trong:\n\n{markdown}",
        )
        return result or markdown

    def custom_refinement(self, markdown: str, instruction: str) -> str:
        """Apply user instruction, preserving core content."""
        result = self._call_ai(
            system_prompt=f"""Ban la tro ly chinh sua van ban. {CHANGE_NOTHING_PROMPT}
Thuc hien yeu cau cua nguoi dung, nhung KHONG lam sai lech noi dung goc.""",
            user_prompt=f"Yeu cau: {instruction}\n\nTai lieu:\n{markdown}",
        )
        return result or markdown
