const React = require('react');
const TabInput = require('./TabInput').default;
const TabPreview = require('./TabPreview').default;
const TabRag = require('./TabRag').default;
const ApiService = require('../services/api').default;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'input',
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
            this.setState({ backendStatus: 'error', ollamaRunning: false });
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
            setTimeout(() => this.checkBackend(), 3000);
        } catch (error) {
            this.showNotification('Không thể khởi động Ollama: ' + error.message, 'error');
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
        this.showNotification('Đã xử lý thành công: ' + document.filename, 'success');
    }

    handleDocumentSelect(doc) {
        this.setState({ currentDocument: doc });
    }

    render() {
        const { activeTab, backendStatus, ollamaRunning, documents, currentDocument, notification, loading } = this.state;

        const tabs = [
            { key: 'input', label: 'Tiếp nhận & Quét', icon: '\u{1F4E5}', shortcut: '1' },
            { key: 'preview', label: 'Kiểm duyệt & Chỉnh sửa', icon: '\u{1F4DD}', shortcut: '2' },
            { key: 'rag', label: 'Tra cứu & Hỏi đáp', icon: '\u{1F4AC}', shortcut: '3' },
        ];

        return (
            <div className="flex flex-col h-screen bg-background text-gray-900 font-sans antialiased">
                <header className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 text-white shadow-lg flex-shrink-0">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <span className="text-lg">{'\u{1F4C4}'}</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold tracking-tight">SmartDoc AI</h1>
                                <p className="text-[11px] text-blue-100/80 -mt-0.5">Quản lý tài liệu thông minh</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-sm transition-all ${
                                backendStatus === 'healthy' ? 'bg-emerald-500/25 text-emerald-100' : 'bg-red-500/25 text-red-100'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-400'}`}></span>
                                {backendStatus === 'healthy' ? 'Backend Online' : 'Backend Offline'}
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-sm transition-all ${
                                ollamaRunning ? 'bg-emerald-500/25 text-emerald-100' : 'bg-amber-500/25 text-amber-100'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ollamaRunning ? 'bg-emerald-400 animate-pulse-dot' : 'bg-amber-400'}`}></span>
                                {ollamaRunning ? 'Ollama Running' : 'Ollama Stopped'}
                            </div>
                            {!ollamaRunning && (
                                <button
                                    onClick={() => this.handleStartOllama()}
                                    disabled={loading}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        loading ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 text-white active:scale-95'
                                    }`}
                                >
                                    {loading ? '\u{23F3} Đang khởi động...' : '\u{25B6} Khởi động AI'}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {notification && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-slide-up ${
                        notification.type === 'success' ? 'bg-emerald-600/95 text-white' :
                        notification.type === 'error' ? 'bg-red-600/95 text-white' :
                        'bg-blue-600/95 text-white'
                    }`}>
                        <span className="text-lg">
                            {notification.type === 'success' ? '\u2705' : notification.type === 'error' ? '\u274C' : '\u2139\uFE0F'}
                        </span>
                        <span className="text-sm font-medium">{notification.message}</span>
                        <button onClick={() => this.setState({ notification: null })} className="ml-2 hover:opacity-70">
                            {'\u2715'}
                        </button>
                    </div>
                )}

                <nav className="bg-white border-b border-gray-200/80 shadow-sm flex-shrink-0">
                    <div className="px-6 flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => this.handleTabChange(tab.key)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-t-xl ${
                                    activeTab === tab.key
                                        ? 'text-primary-600 bg-primary-50/80 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary-500 after:rounded-full'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                                title={'Chuy\u1EC3n tab (Alt+' + tab.shortcut + ')'}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                                <span className="ml-1 text-[10px] text-gray-400 font-mono">Alt+{tab.shortcut}</span>
                            </button>
                        ))}
                    </div>
                </nav>

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

                <footer className="bg-white border-t border-gray-200 px-6 py-2 text-[11px] text-gray-400 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">{'\u{1F4C4}'} Tài liệu: <strong className="text-gray-600">{documents.length}</strong></span>
                        {currentDocument && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">{'\u{1F4CC}'} Hiện tại: <span className="text-gray-600 truncate max-w-[200px]">{currentDocument.filename}</span></span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span>SmartDoc AI v1.0</span>
                        <span className="text-gray-300">{'\u2328'} Alt+1/2/3: Chuyển tab</span>
                    </div>
                </footer>
            </div>
        );
    }
}

module.exports = App;
