"""Backend: Main Entry Point — Flask API server.

Provides REST API endpoints for Electron frontend to interact with.
Routes file processing, storage, and RAG operations.

Wing: smartdoc_backend
Topic: api_server
Last Updated: 2026-05-05 09:05
"""

import argparse
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from processor import DocumentProcessor
from lightweight_processor import LightweightProcessor
from vector_storage import VectorStorage
from ollama_client import OllamaClient
from ds2api_client import DS2APIClient
from bridge_manager import BridgeManager
from metadata_extractor import MetadataExtractor
from embedding_service import EmbeddingService
from rag_pipeline import RAGPipeline
from document_refiner import DocumentRefiner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Electron frontend

# Initialize components (lazy: Docling loads models on first use)
processor = None  # Docling - lazy init in process_file
light_processor = LightweightProcessor()  # pypdf -> OCR -> Docling
storage = VectorStorage()

# Initialize AI clients
ollama = OllamaClient(model="gemma4:e2b")
ds2api = DS2APIClient()
bridge = BridgeManager()

# Chat provider: 'ollama' or 'ds2api'
chat_provider = "ollama"

# Cancel tracking for long-running processes
cancel_requests = {}

# Initialize other services
metadata_extractor = MetadataExtractor(ollama)
document_refiner = DocumentRefiner(ollama, ds2api)

# Initialize embedding service with nomic-embed-text (768 dimensions)
embedding_service = EmbeddingService(model="nomic-embed-text")
rag_pipeline = RAGPipeline(embedding_service, storage, ollama, ds2api)

# Ensure database wings exist
storage.ensure_wings()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    ollama_running = ollama.is_running()
    return jsonify({
        'status': 'healthy',
        'ollama_running': ollama_running
    })


@app.route('/api/ollama/start', methods=['POST'])
def start_ollama():
    """Start Ollama service."""
    success = ollama.start_ollama()
    return jsonify({'success': success})


@app.route('/api/process', methods=['POST'])
def process_file():
    """Process uploaded file with Gemma 4 multimodal and RAG embedding."""
    global processor
    if processor is None:
        from processor import DocumentProcessor
        processor = DocumentProcessor()
    data = request.json
    file_path = data.get('file_path')
    method = data.get('method', 'local')

    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': 'Invalid file path'}), 400

    try:
        # Determine processing pipeline
        if method == 'cloud':
            logger.info(f"Processing via Cloud bridge: {file_path}")
            bridge_result = bridge.convert_document(file_path, prefer_cloud=True)
            if bridge_result['success']:
                result = {
                    'success': True,
                    'markdown': bridge_result['markdown'],
                    'metadata': {'method': bridge_result['method']},
                    'images': None,
                }
            else:
                logger.warning(f"Cloud bridge failed, falling back to local: {bridge_result.get('error')}")
                lp_result = light_processor.process(file_path, mode='auto')
                result = lp_result if lp_result['success'] else processor.process_file(file_path, generate_images=False)
                if result.get('success'):
                    result['metadata'] = {'method': result.get('method', 'docling')}
        elif method == 'enhanced':
            logger.info(f"Processing via Enhanced (Docling): {file_path}")
            dl_result = processor.process_file(file_path, generate_images=generate_images)
            result = dl_result if dl_result['success'] else light_processor.process(file_path, mode='auto')
        else:
            logger.info(f"Processing via Lightweight pipeline: {file_path}")
            lp_result = light_processor.process(file_path, mode='auto')
            if lp_result['success']:
                result = {
                    'success': True,
                    'markdown': lp_result['markdown'],
                    'metadata': {'method': lp_result.get('method', 'pypdf')},
                    'images': None,
                }
            else:
                result = processor.process_file(file_path, generate_images=generate_images)

        if not result['success']:
            return jsonify({'error': result['metadata'].get('error', 'Processing failed')}), 500

        # Lightweight mode: return immediately (no storage/AI calls)
        return jsonify({
            'success': True,
            'markdown': result['markdown'],
            'metadata': {
                'method': result.get('metadata', {}).get('method', 'pypdf'),
                'filename': os.path.basename(file_path),
            },
            'wing': 'tai_lieu_khac',
            'chunks_embedded': 0,
            'has_images': False,
        })

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Processing error: {e}\n{tb}")
        return jsonify({'error': str(e) or 'Unknown error'}), 500


@app.route('/api/process/cancel', methods=['POST'])
def cancel_process():
    """Cancel a running document process."""
    data = request.json
    file_path = data.get('file_path', '')
    cancel_requests[file_path] = True
    logger.info(f"Cancel requested for: {file_path}")
    return jsonify({'success': True, 'cancelled': file_path})


@app.route('/api/process/status', methods=['POST'])
def process_status():
    """Check if processing was cancelled."""
    data = request.json
    file_path = data.get('file_path', '')
    return jsonify({'cancelled': cancel_requests.pop(file_path, False)})


@app.route('/api/wings', methods=['GET'])
def list_wings():
    """Get list of available wings."""
    wings = storage.list_wings()
    wing_info = []
    for wing in wings:
        wing_info.append({
            'name': wing,
            'count': storage.get_document_count(wing)
        })
    return jsonify(wing_info)


@app.route('/api/ollama/models', methods=['GET'])
def list_models():
    """Get available Ollama models."""
    models = ollama.list_models()
    return jsonify({'models': models})


@app.route('/api/ds2api/status', methods=['GET'])
def ds2api_status():
    """Check if ds2api service is available."""
    available = ds2api.is_available()
    return jsonify({'available': available})


@app.route('/api/ds2api/models', methods=['GET'])
def ds2api_models():
    """Get available ds2api models."""
    models = ds2api.get_available_models()
    return jsonify({'models': models})


@app.route('/api/bridge/status', methods=['GET'])
def bridge_status():
    """Check bridge availability."""
    return jsonify({
        'notebooklm': bridge.notebooklm_available(),
        'docling': bridge.docling_available(),
    })


@app.route('/api/bridge/install', methods=['POST'])
def bridge_install():
    """Install NotebookLM bridge."""
    data = request.json or {}
    bridge_type = data.get('type', 'notebooklm')
    try:
        if bridge_type == 'notebooklm':
            success = bridge.install_notebooklm()
            return jsonify({'success': success, 'type': 'notebooklm'})
        else:
            return jsonify({'error': 'Invalid bridge type'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/provider', methods=['GET', 'POST'])
def chat_provider():
    """Get or set the chat provider (ollama/ds2api)."""
    global chat_provider
    if request.method == 'POST':
        data = request.json
        provider = data.get('provider', 'ollama')
        if provider in ('ollama', 'ds2api'):
            chat_provider = provider
            rag_pipeline.provider = provider
            return jsonify({'provider': chat_provider, 'status': 'ok'})
        return jsonify({'error': 'Invalid provider'}), 400
    return jsonify({'provider': chat_provider})


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with AI using RAG."""
    data = request.json
    message = data.get('message')
    wings = data.get('wings')  # Optional: specific wings to search

    if not message:
        return jsonify({'error': 'Message required'}), 400

    try:
        # Use RAG pipeline
        result = rag_pipeline.query(message, wings=wings, limit=5)

        return jsonify({
            'message': {
                'role': 'assistant',
                'content': result['response']
            },
            'sources': result['sources'],
            'num_documents': result['num_documents']
        })

    except Exception as e:
        logger.error(f"RAG error: {e}")
        # Fallback to simple chat
        response = ollama.chat(prompt=message)

        # Format fallback response
        return jsonify({
            'message': {
                'role': 'assistant',
                'content': response.get('message', {}).get('content', 'Xin lỗi, có lỗi xảy ra.')
            },
            'sources': [],
            'num_documents': 0
        })


if __name__ == '__main__':
    # Check if Ollama is running (don't start it)
    if not ollama.is_running():
        logger.warning("Ollama is not running! Please start it manually.")
        logger.info("Run: ollama serve")
        logger.info("Waiting 60s for you to start Ollama...")
        import time
        time.sleep(60)

        if not ollama.is_running():
            logger.error("Ollama still not running. Exiting.")
            exit(1)

    # Verify models are available (don't pull)
    models = ollama.list_models()
    logger.info(f"Available models: {models}")

    if 'gemma4:e2b' not in models:
        logger.error("Gemma 4 not found! Please install it.")
    if 'nomic-embed-text:latest' not in models:
        logger.error("nomic-embed-text not found! Please install it.")

    # Add refinement endpoints directly
    @app.route('/api/refine/summarize', methods=['POST'])
    def summarize_document():
        """Generate summary of document."""
        data = request.json
        markdown = data.get('markdown')
        if not markdown:
            return jsonify({'error': 'Markdown content required'}), 400
        try:
            summary = document_refiner.summarize(markdown)
            return jsonify({'success': True, 'summary': summary})
        except Exception as e:
            logger.error(f"Summary error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/refine/formalize', methods=['POST'])
    def formalize_document():
        """Rewrite document in formal tone."""
        data = request.json
        markdown = data.get('markdown')
        if not markdown:
            return jsonify({'error': 'Markdown content required'}), 400
        try:
            formalized = document_refiner.formalize(markdown)
            return jsonify({'success': True, 'markdown': formalized})
        except Exception as e:
            logger.error(f"Formalization error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/refine/custom', methods=['POST'])
    def custom_refinement():
        """Apply custom refinement to document."""
        data = request.json
        markdown = data.get('markdown')
        instruction = data.get('instruction')
        if not markdown or not instruction:
            return jsonify({'error': 'Markdown and instruction required'}), 400
        try:
            refined = document_refiner.custom_refinement(markdown, instruction)
            return jsonify({'success': True, 'markdown': refined})
        except Exception as e:
            logger.error(f"Custom refinement error: {e}")
            return jsonify({'error': str(e)}), 500

    logger.info("Refinement endpoints loaded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000, help='Port to listen on')
    args = parser.parse_args()
    port = args.port
    logger.info(f"Starting Flask server on port {port}...")
    app.run(host='127.0.0.1', port=port, debug=False)
