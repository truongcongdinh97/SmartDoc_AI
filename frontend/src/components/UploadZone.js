const React = require('react');
const ApiService = require('../services/api').default;

const MODE_CONFIG = {
    auto: { icon: '\u26A1', label: 'Nhanh (Auto)', method: 'local' },
    cloud: { icon: '\u2601\uFE0F', label: 'Cloud (NotebookLM)', method: 'cloud' },
    enhanced: { icon: '\u{1F52C}', label: 'Nâng cao (Docling)', method: 'enhanced' },
};

class UploadZone extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isDragging: false,
            mode: 'cloud',
            files: [],
            processing: false,
            cancelled: false,
            progress: 0,
            status: '',
            processedFiles: [],
            error: null,
            showLogin: false,
            googleLoggedIn: false,
        };
        this.fileInputRef = React.createRef();
        this.abortController = null;
    }

    openWebView(url) {
        if (window.electronAPI && window.electronAPI.openWebView) {
            window.electronAPI.openWebView(url);
        } else {
            this.setState({ showWebView: true, webViewUrl: url });
        }
    }

    handleDragOver(e) { e.preventDefault(); this.setState({ isDragging: true }); }
    handleDragLeave(e) { e.preventDefault(); this.setState({ isDragging: false }); }

    handleDrop(e) {
        e.preventDefault();
        this.setState({ isDragging: false });
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        this.handleFiles(Array.from(e.target.files));
    }

    handleCancel() {
        this.setState({ cancelled: true });
        if (this.abortController) {
            this.abortController.abort();
        }
            if (this.state.mode === 'cloud' && this.state.files.length > 0) {
            this.state.files.forEach(f => {
                ApiService.cancelProcess(f.path || f.name);
            });
        }
    }

    async handleFiles(files) {
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length === 0) {
            this.setState({ error: 'Vui lòng chọn file PDF' });
            return;
        }

        this.setState({ files: pdfFiles, error: null, processedFiles: [], cancelled: false });
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        for (let i = 0; i < pdfFiles.length; i++) {
            if (this.state.cancelled) break;

            const file = pdfFiles[i];
            this.setState({
                processing: true,
                progress: ((i) / pdfFiles.length) * 100,
                status: `${i + 1}/${pdfFiles.length}: ${file.name}`,
            });

            try {
                const filePath = file.path || file.name;
                const activeMode = this.state.mode;
                const apiMethod = MODE_CONFIG[activeMode]?.method || 'local';
                const label = MODE_CONFIG[activeMode]?.label || 'Local';
                this.setState({ status: `${i + 1}/${pdfFiles.length}: ${label}...` });

                const result = await ApiService.processFile(
                    filePath,
                    { method: apiMethod },
                    signal
                );

                const usedMethod = result?.metadata?.method || apiMethod;
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: result.metadata?.filename || file.name,
                        success: true,
                        method: usedMethod === 'pypdf' ? '\u26A1 Nhanh' : usedMethod === 'ocr' ? '\u{1F4F7} OCR' : usedMethod === 'cloud' ? '\u2601\uFE0F Cloud' : '\u{1F52C} Docling',
                    }]
                }));

                this.props.onDocumentProcessed({
                    filename: result.metadata?.filename || file.name,
                    markdown: result.markdown,
                    metadata: result.metadata,
                    wing: result.wing,
                    filePath: filePath,
                });
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.setState({
                        cancelled: false,
                        status: 'Đã huỷ',
                        error: 'Người dùng đã huỷ xử lý',
                    });
                    break;
                }
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: file.name, success: false, error: error.message
                    }],
                    error: `Lỗi xử lý ${file.name}: ${error.message}`
                }));
            }
        }

        this.abortController = null;
        this.setState({ processing: false, cancelled: false, progress: 100 });
    }

    handleGoogleLogin(session) {
        this.setState({ googleLoggedIn: !!session?.cookies?.length });
    }

    render() {
        const { isDragging, mode, files, processing, progress, status, error, processedFiles, showLogin, googleLoggedIn } = this.state;

        const current = MODE_CONFIG[mode] || MODE_CONFIG.auto;

        return (
            <div className="p-8 max-w-3xl mx-auto animate-fade-in">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {'\u{1F4E5}'} Tải lên Tài liệu
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Chế độ: {current.icon} {current.label}</p>
                </div>

                {/* Google Login for NotebookLM */}
                {mode === 'cloud' && (
                    <div className="mb-4">
                        {React.createElement(window.WebViewLoginComponent, {
                            service: "Google",
                            icon: '\u{1FF7}\uFE0F',
                            loginUrl: "https://accounts.google.com",
                            onLogin: (s) => this.handleGoogleLogin(s),
                            onLogout: () => this.setState({ googleLoggedIn: false }),
                            compact: true,
                        })}
                    </div>
                )}

                {/* Mode Toggle */}
                {this.props.onModeToggle && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-600">{'\u2699\uFE0F'} Phương thức:</span>
                        {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
                            <button key={key} onClick={() => this.props.onModeToggle(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    mode === key
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 border hover:bg-gray-100'
                                }`}>
                                {cfg.icon} {cfg.label}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
                        <span className="text-lg">{'\u26A0\uFE0F'}</span>
                        <p className="text-sm text-red-600 flex-1">{error}</p>
                        <button onClick={() => this.setState({ error: null })} className="text-red-400">{'\u2715'}</button>
                    </div>
                )}

                {/* Drop Zone */}
                <div
                    onDragOver={(e) => this.handleDragOver(e)}
                    onDragLeave={(e) => this.handleDragLeave(e)}
                    onDrop={(e) => this.handleDrop(e)}
                    onClick={() => !processing && this.fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all duration-300 ${
                        isDragging
                            ? 'border-primary-400 bg-primary-50/80 scale-[1.01] shadow-lg'
                            : processing
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50/80'
                    }`}
                >
                    <input ref={this.fileInputRef} type="file" multiple accept=".pdf"
                        style={{ display: 'none' }} onChange={(e) => this.handleFileSelect(e)} />

                    {!processing && !isDragging && (
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-accent-50 rounded-2xl flex items-center justify-center">
                                <span className="text-4xl">{current.icon}</span>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">Kéo thả PDF vào đây</p>
                                <p className="text-sm text-gray-400 mt-1">hoặc nhấp để chọn file</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${mode === 'auto' ? 'bg-amber-50 text-amber-700' : mode === 'cloud' ? 'bg-primary-50 text-primary-600' : 'bg-violet-50 text-violet-600'}`}>
                                    {current.icon} {current.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {processing && (
                        <div className="space-y-4 max-w-sm mx-auto">
                            <div className="text-4xl animate-spin">{'\u23F3'}</div>
                            <p className="text-sm font-medium text-gray-700 truncate">{status}</p>
                            <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                                    style={{ width: progress + '%' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
                                <button onClick={() => this.handleCancel()}
                                    className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all active:scale-95">
                                    {'\u2715'} Huỷ
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* File List */}
                {files.length > 0 && !processing && (
                    <div className="mt-5 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">{'\u{1F4C1}'} {files.length} file</p>
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
                                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                                    <span>{'\u{1F4D1}'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                                    <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">PDF</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {processedFiles.length > 0 && (
                    <div className="mt-5 space-y-2 animate-slide-up">
                        <p className="text-xs font-semibold text-gray-500 uppercase">{'\u2705'} Kết quả</p>
                        {processedFiles.map((f, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                f.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                            }`}>
                                <span className="text-lg">{f.success ? '\u2705' : '\u274C'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{f.filename}</p>
                                    <p className={`text-xs ${f.success ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {f.success ? f.method : f.error}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Login Status (only for cloud mode) */}
                {mode === 'cloud' && !googleLoggedIn && (
                    <div className="mt-4">
                        {React.createElement(window.WebViewLoginComponent, {
                            service: "Google",
                            icon: '\u{1F310}',
                            loginUrl: "https://accounts.google.com",
                            onLogin: (s) => this.handleGoogleLogin(s),
                            onLogout: () => this.setState({ googleLoggedIn: false }),
                        })}
                    </div>
                )}
            </div>
        );
    }
}

module.exports = UploadZone;
