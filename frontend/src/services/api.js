/**
 * Frontend: API Service — Handles communication with Python backend.
 *
 * Provides methods for file processing, storage, and RAG operations.
 * Uses fetch API to communicate with Flask server on port 5000.
 *
 * Wing: smartdoc_frontend
 * Topic: api_service
 * Last Updated: 2026-05-05 09:45
 */

let API_PORT = 5000;

class ApiService {
    static get port() { return API_PORT; }
    static setPort(port) { API_PORT = port; }

    get baseUrl() {
        return `http://127.0.0.1:${API_PORT}/api`;
    }

    setPort(port) {
        API_PORT = port;
    }

    /**
     * Check backend health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', ollama_running: false };
        }
    }

    /**
     * Process a document file
     * @param {string} filePath - Full path to the file
     */
    async processFile(filePath, options = {}, signal = null) {
        try {
            const response = await fetch(`${this.baseUrl}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_path: filePath, ...options }),
                signal,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Processing failed');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('File processing failed:', error);
            throw error;
        }
    }

    async cancelProcess(filePath) {
        try {
            await fetch(`${this.baseUrl}/process/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: filePath }),
            });
        } catch {}
    }

    /**
     * Get list of all wings (categories)
     */
    async getWings() {
        try {
            const response = await fetch(`${this.baseUrl}/wings`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get wings:', error);
            return [];
        }
    }

    /**
     * Start Ollama service
     */
    async startOllama() {
        try {
            const response = await fetch(`${this.baseUrl}/ollama/start`, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to start Ollama:', error);
            return { success: false };
        }
    }

    /**
     * Chat with AI
     * @param {string} message - User message
     * @param {string[]} context - Document context
     * @param {string[]} wings - Optional wings to search
     */
    async chat(message, context = [], wings = []) {
        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, context, wings }),
            });

            return await response.json();
        } catch (error) {
            console.error('Chat failed:', error);
            throw error;
        }
    }

    /**
     * Summarize document
     * @param {string} markdown - Document markdown content
     */
    async summarizeDocument(markdown, provider = 'ds2api') {
        try {
            const response = await fetch(`${this.baseUrl}/refine/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ markdown, provider }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Summarization failed');
            }

            return data;
        } catch (error) {
            console.error('Summarization failed:', error);
            throw error;
        }
    }

    /**
     * Formalize document
     * @param {string} markdown - Document markdown content
     */
    async formalizeDocument(markdown, provider = 'ds2api') {
        try {
            const response = await fetch(`${this.baseUrl}/refine/formalize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ markdown, provider }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Formalization failed');
            }

            return data;
        } catch (error) {
            console.error('Formalization failed:', error);
            throw error;
        }
    }

    /**
     * Custom refinement
     * @param {string} markdown - Document markdown content
     * @param {string} instruction - Custom instruction
     */
    async getDs2apiStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/ds2api/status`);
            return await response.json();
        } catch { return { available: false }; }
    }

    async getDs2apiModels() {
        try {
            const response = await fetch(`${this.baseUrl}/ds2api/models`);
            return await response.json();
        } catch { return { models: [] }; }
    }

    async getChatProvider() {
        try {
            const response = await fetch(`${this.baseUrl}/chat/provider`);
            return await response.json();
        } catch { return { provider: 'ollama' }; }
    }

    async setChatProvider(provider) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/provider`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider }),
            });
            return await response.json();
        } catch { return { status: 'error' }; }
    }

    async customRefinement(markdown, instruction, provider = 'ds2api') {
        try {
            const response = await fetch(`${this.baseUrl}/refine/custom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ markdown, instruction, provider }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Custom refinement failed');
            }

            return data;
        } catch (error) {
            console.error('Custom refinement failed:', error);
            throw error;
        }
    }
}

module.exports = new ApiService();
