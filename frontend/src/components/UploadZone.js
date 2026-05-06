const React = require('react');
const ApiService = require('../services/api').default;

class UploadZone extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isDragging: false,
            mode: props.operationMode || 'hybrid',
            files: [],
            processing: false,
            progress: 0,
            status: '',
            processedFiles: [],
            error: null,
            showLogin: false,
            googleLoggedIn: false,
        };
        this.fileInputRef = React.createRef();
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

    async handleFiles(files) {
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length === 0) {
            this.setState({ error: 'Vui lòng chọn file PDF' });
            return;
        }

        this.setState({ files: pdfFiles, error: null, processedFiles: [] });

        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            this.setState({
                processing: true,
                progress: ((i) / pdfFiles.length) * 100,
                status: `${i + 1}/${pdfFiles.length}: ${file.name}`,
            });

            try {
                const filePath = file.path || file.name;
                const useCloud = this.state.mode === 'hybrid';

                if (useCloud) {
                    this.setState({ status: `${i + 1}/${pdfFiles.length}: Đang tải lên Máy lọc Cloud...` });
                } else {
                    this.setState({ status: `${i + 1}/${pdfFiles.length}: Đang xử lý Local...` });
                }

                const result = await ApiService.processFile(filePath, { method: useCloud ? 'cloud' : 'local' });

                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: result.metadata?.filename || file.name,
                        success: true,
                        method: useCloud ? '\u2601\uFE0F Cloud' : '\u{1F5A8} Local',
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
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: file.name, success: false, error: error.message
                    }],
                    error: `Lỗi xử lý ${file.name}: ${error.message}`
                }));
            }
        }

        this.setState({ processing: false, progress: 100 });
    }

    handleGoogleLogin(session) {
        this.setState({ googleLoggedIn: !!session?.cookies?.length });
    }

    render() {
        const { isDragging, mode, files, processing, progress, status, error, processedFiles, showLogin, googleLoggedIn } = this.state;

        const processIcon = mode === 'hybrid' ? '\u2601\uFE0F' : '\u{1F5A8}\uFE0F';
        const processLabel = mode === 'hybrid'
            ? 'Máy lọc Cloud (NotebookLM)'
            : 'Xử lý Local (Docling)';

        return (
            <div className="p-8 max-w-3xl mx-auto animate-fade-in">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {'\u{1F4E5}'} Tải lên Tài liệu
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Chế độ: {processLabel}</p>
                </div>

                {/* Google Login for NotebookLM */}
                {mode === 'hybrid' && (
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
                    <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-600">{'\u2699\uFE0F'} Phương thức xử lý:</span>
                        <button onClick={() => this.props.onModeToggle('hybrid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'hybrid' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 border'}`}>
                            {'\u2601\uFE0F'} Cloud (NotebookLM)
                        </button>
                        <button onClick={() => this.props.onModeToggle('local')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'local' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border'}`}>
                            {'\u{1F5A8}\uFE0F'} Local (Docling)
                        </button>
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
                                <span className="text-4xl">{processIcon}</span>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">Kéo thả PDF vào đây</p>
                                <p className="text-sm text-gray-400 mt-1">hoặc nhấp để chọn file</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <span className={`px-2 py-0.5 rounded-full ${mode === 'hybrid' ? 'bg-primary-50 text-primary-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {processLabel}
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
                            <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
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

                {/* Login Status */}
                {mode === 'hybrid' && !googleLoggedIn && (
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
