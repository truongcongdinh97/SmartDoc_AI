const React = require('react');
const TabInput = require('./TabInput').default;
const TabPreview = require('./TabPreview').default;
const TabRag = require('./TabRag').default;
const SplashScreen = require('./SplashScreen').default;
const ApiService = require('../services/api').default;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showSplash: true,
            hardwareInfo: null,
            userName: null,
            userPosition: null,
            activeTab: 'input',
            backendStatus: 'checking',
            ollamaRunning: false,
            documents: [],
            currentDocument: null,
            notification: null,
            loading: false,
        };
    }

    async handleSplashComplete(hwInfo) {
        if (window.electronAPI && window.electronAPI.getBackendPort) {
            try {
                const port = await window.electronAPI.getBackendPort();
                if (port) ApiService.setPort(port);
            } catch {}
        }

        this.setState({
            showSplash: false,
            hardwareInfo: hwInfo.hardware || hwInfo,
            userName: hwInfo.userName,
            userPosition: hwInfo.userPosition,
        });
    }

    checkBackend() {
        ApiService.checkHealth().then(health => {
            this.setState({
                backendStatus: health.status,
                ollamaRunning: health.ollama_running,
            });
        }).catch(() => {
            this.setState({ backendStatus: 'error', ollamaRunning: false });
        });
    }

    componentDidMount() {
        if (!this.state.showSplash) {
            this.checkBackend();
            this.statusInterval = setInterval(() => this.checkBackend(), 30000);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.showSplash && !this.state.showSplash) {
            this.checkBackend();
            this.statusInterval = setInterval(() => this.checkBackend(), 30000);
        }
    }

    componentWillUnmount() {
        if (this.statusInterval) clearInterval(this.statusInterval);
    }

    showNotification(message, type = 'info') {
        this.setState({ notification: { message, type } });
        setTimeout(() => this.setState({ notification: null }), 5000);
    }

    handleTabChange(tab) { this.setState({ activeTab: tab }); }

    handleDocumentProcessed(document) {
        this.setState(prevState => ({
            documents: [...prevState.documents, document],
            currentDocument: document,
            activeTab: 'preview',
        }));
        this.showNotification('Đã xử lý thành công: ' + document.filename, 'success');
    }

    handleDocumentSelect(doc) { this.setState({ currentDocument: doc }); }

    render() {
        if (this.state.showSplash) {
            return React.createElement(SplashScreen, {
                onComplete: (hw) => this.handleSplashComplete(hw)
            });
        }

        const { activeTab, backendStatus, ollamaRunning, documents, currentDocument, notification, loading, hardwareInfo, userName, userPosition } = this.state;

        const tabs = [
            { key: 'input', label: 'Tiếp nhận & Quét', icon: '\u{1F4E5}', shortcut: '1' },
            { key: 'preview', label: 'Kiểm duyệt & Chỉnh sửa', icon: '\u{1F4DD}', shortcut: '2' },
            { key: 'rag', label: 'Tra cứu & Hỏi đáp', icon: '\u{1F4AC}', shortcut: '3' },
        ];

        const gpuName = hardwareInfo?.gpu?.gpu_name;
        const gpuDetected = hardwareInfo?.gpu?.gpu_detected;

        return (
            <div className="flex flex-col h-screen bg-background text-gray-900 font-sans antialiased">
                <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg flex-shrink-0">
                    <div className="px-6 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                                <span className="text-base">{'\u{1F4C4}'}</span>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold">SmartDoc AI</h1>
                                <p className="text-[10px] text-slate-400 -mt-0.5">Phần mềm quản lý tài liệu thông minh</p>
                            </div>
                            {userName && (
                                <div className="text-[10px] text-slate-400 ml-1">
                                    {userName}{userPosition ? ' - ' + userPosition : ''}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {gpuDetected && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                    {'\u{1F5A5}\uFE0F'} {gpuName}
                                </span>
                            )}
                            <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>
                    </div>
                </header>

                {notification && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-slide-up ${
                        notification.type === 'success' ? 'bg-emerald-600/95 text-white' :
                        notification.type === 'error' ? 'bg-red-600/95 text-white' : 'bg-blue-600/95 text-white'
                    }`}>
                        <span className="text-sm font-medium">{notification.message}</span>
                        <button onClick={() => this.setState({ notification: null })} className="ml-2 hover:opacity-70">{'\u2715'}</button>
                    </div>
                )}

                <nav className="bg-white border-b border-gray-200/80 shadow-sm flex-shrink-0">
                    <div className="px-6 flex gap-1">
                        {tabs.map(tab => (
                            <button key={tab.key}
                                onClick={() => this.handleTabChange(tab.key)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-t-xl ${
                                    activeTab === tab.key
                                        ? 'text-primary-600 bg-primary-50/80 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary-500 after:rounded-full'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}>
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>

                <main className="flex-1 overflow-auto">
                    {activeTab === 'input' && React.createElement(TabInput, {
                        onDocumentProcessed: (doc) => this.handleDocumentProcessed(doc),
                    })}
                    {activeTab === 'preview' && React.createElement(TabPreview, {
                        document: currentDocument,
                        documents: documents,
                        onDocumentSelect: (doc) => this.handleDocumentSelect(doc),
                    })}
                    {activeTab === 'rag' && React.createElement(TabRag, {
                        documents: documents,
                    })}
                </main>

                <footer className="bg-white border-t border-gray-200 px-6 py-1.5 text-[10px] text-gray-400 flex items-center justify-between flex-shrink-0">
                    <span>{'\u{1F4C4}'} {documents.length} tài liệu</span>
                    <span>SmartDoc AI v2.0</span>
                </footer>
            </div>
        );
    }
}

module.exports = App;
