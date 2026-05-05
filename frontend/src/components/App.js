/**
 * Frontend: App Component — Main application with 3-tab interface.
 *
 * Manages tab navigation and overall app state.
 * Tab 1: Input & Scan (file upload)
 * Tab 2: Preview & Refine (document review)
 * Tab 3: RAG Chat (AI conversation)
 *
 * Wing: smartdoc_frontend
 * Topic: main_component
 * Last Updated: 2026-05-05 13:50
 */

const React = require('react');
const TabInput = require('./TabInput').default;
const TabPreview = require('./TabPreview').default;
const TabRag = require('./TabRag').default;
const ApiService = require('../services/api').default;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'input', // 'input', 'preview', 'rag'
            backendStatus: 'checking',
            ollamaRunning: false,
            documents: [],
            currentDocument: null,
            notification: null,
            loading: false,
        };
        this.keydownHandler = this.handleKeyDown.bind(this);
    }

    componentDidMount() {
        this.checkBackend();
        this.statusInterval = setInterval(() => this.checkBackend(), 30000);
        document.addEventListener('keydown', this.keydownHandler);
    }

    componentWillUnmount() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        document.removeEventListener('keydown', this.keydownHandler);
    }

    handleKeyDown(e) {
        // Keyboard shortcuts: Alt+1, Alt+2, Alt+3 for tab navigation
        if (e.altKey && e.key >= '1' && e.key <= '3') {
            e.preventDefault();
            const tabs = ['input', 'preview', 'rag'];
            this.handleTabChange(tabs[parseInt(e.key) - 1]);
        }
    }

    async checkBackend() {
        try {
            const health = await ApiService.checkHealth();
            this.setState({
                backendStatus: health.status,
                ollamaRunning: health.ollama_running,
            });
        } catch (error) {
            this.setState({
                backendStatus: 'error',
                ollamaRunning: false,
            });
            console.error('Backend health check failed:', error);
        }
    }

    showNotification(message, type = 'info') {
        this.setState({ notification: { message, type } });
        setTimeout(() => this.setState({ notification: null }), 5000);
    }

    handleTabChange(tab) {
        this.setState({ activeTab: tab });
    }

    async handleStartOllama() {
        this.setState({ loading: true });
        try {
            await ApiService.startOllama();
            this.showNotification('Đang khởi động Ollama...', 'info');
            // Recheck after a delay
            setTimeout(() => this.checkBackend(), 3000);
        } catch (error) {
            this.showNotification(`Không thể khởi động Ollama: ${error.message}`, 'error');
        } finally {
            this.setState({ loading: false });
        }
    }

    handleDocumentProcessed(document) {
        this.setState(prevState => ({
            documents: [...prevState.documents, document],
            currentDocument: document,
            activeTab: 'preview',
        }));
        this.showNotification(`Đã xử lý thành công: ${document.filename}`, 'success');
    }

    handleDocumentSelect(doc) {
        this.setState({ currentDocument: doc });
    }

    render() {
        const { activeTab, backendStatus, ollamaRunning, documents, currentDocument, notification, loading } = this.state;

        return (
            <div className="flex flex-col h-screen bg-background">
                {/* Header */}
                <header className="bg-primary text-white p-4 shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold">📄 SmartDoc AI</h1>
                            <p className="text-xs text-blue-100 mt-1">Quản lý tài liệu thông minh</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`px-2 py-1 rounded text-xs ${
                                backendStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                Backend: {backendStatus === 'healthy' ? '✓ Online' : '✗ Offline'}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                                ollamaRunning ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                Ollama: {ollamaRunning ? '✓ Running' : '✗ Stopped'}
                            </div>
                            {!ollamaRunning && (
                                <button
                                    onClick={() => this.handleStartOllama()}
                                    disabled={loading}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        loading 
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-warning text-black hover:bg-yellow-500'
                                    }`}
                                    title="Khởi động dịch vụ AI"
                                >
                                    {loading ? '⏳' : '▶️'} Khởi động
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse ${
                        notification.type === 'success' ? 'bg-green-500 text-white' :
                        notification.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {notification.type === 'success' ? '✅' :
                                 notification.type === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            <span>{notification.message}</span>
                            <button
                                onClick={() => this.setState({ notification: null })}
                                className="ml-2 hover:opacity-75"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <nav className="bg-white border-b shadow-sm">
                    <div className="container mx-auto flex">
                        <button
                            onClick={() => this.handleTabChange('input')}
                            className={`flex-1 py-4 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                                activeTab === 'input'
                                    ? 'bg-primary text-white border-b-4 border-blue-600'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-b-4 border-transparent'
                            }`}
                            title="Upload và xử lý PDF (Alt+1)"
                        >
                            <span className="text-2xl mr-2">📥</span>
                            Tiếp nhận & Quét
                        </button>
                        <button
                            onClick={() => this.handleTabChange('preview')}
                            className={`flex-1 py-4 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                                activeTab === 'preview'
                                    ? 'bg-primary text-white border-b-4 border-blue-600'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-b-4 border-transparent'
                            }`}
                            title="Xem và chỉnh sửa tài liệu (Alt+2)"
                        >
                            <span className="text-2xl mr-2">📝</span>
                            Kiểm duyệt & Chỉnh sửa
                        </button>
                        <button
                            onClick={() => this.handleTabChange('rag')}
                            className={`flex-1 py-4 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                                activeTab === 'rag'
                                    ? 'bg-primary text-white border-b-4 border-blue-600'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-b-4 border-transparent'
                            }`}
                            title="Chat với AI (Alt+3)"
                        >
                            <span className="text-2xl mr-2">💬</span>
                            Tra cứu & Hỏi đáp
                        </button>
                    </div>
                </nav>

                {/* Tab Content */}
                <main className="flex-1 overflow-auto">
                    {activeTab === 'input' && (
                        <TabInput onDocumentProcessed={(doc) => this.handleDocumentProcessed(doc)} />
                    )}
                    {activeTab === 'preview' && (
                        <TabPreview
                            document={currentDocument}
                            documents={documents}
                            onDocumentSelect={(doc) => this.handleDocumentSelect(doc)}
                        />
                    )}
                    {activeTab === 'rag' && (
                        <TabRag documents={documents} />
                    )}
                </main>

                {/* Status Bar */}
                <footer className="bg-gray-800 text-gray-300 p-2 text-xs border-t">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span>📄 Tài liệu: {documents.length}</span>
                            {currentDocument && (
                                <span className="text-gray-400">|</span>
                            )}
                            {currentDocument && (
                                <span>📌 Hiện tại: {currentDocument.filename}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span>SmartDoc AI v1.0</span>
                            <span>⌨️ Alt+1/2/3: Tabs</span>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }
}

module.exports = App;