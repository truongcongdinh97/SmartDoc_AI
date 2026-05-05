const React = require('react');
const ApiService = require('../services/api').default;

class TabInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isDragging: false,
            files: [],
            processing: false,
            progress: 0,
            status: '',
            error: null,
            warning: null,
            processedFiles: [],
        };
        this.fileInputRef = React.createRef();
    }

    handleDragOver(e) {
        e.preventDefault();
        this.setState({ isDragging: true });
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.setState({ isDragging: false });
    }

    handleDrop(e) {
        e.preventDefault();
        this.setState({ isDragging: false });
        const droppedFiles = Array.from(e.dataTransfer.files);
        this.handleFiles(droppedFiles);
    }

    handleFileSelect(e) {
        const selectedFiles = Array.from(e.target.files);
        this.handleFiles(selectedFiles);
    }

    async handleFiles(files) {
        const pdfFiles = files.filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
            this.setState({ error: 'Vui lòng chọn file PDF hợp lệ', warning: null });
            return;
        }

        this.setState({ files: pdfFiles, error: null, warning: null, processedFiles: [] });

        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            this.setState({
                processing: true,
                progress: ((i + 1) / pdfFiles.length) * 100,
                status: `Đang xử lý ${i + 1}/${pdfFiles.length}: ${file.name}`,
            });

            try {
                const filePath = file.path || file.name;
                const result = await ApiService.processFile(filePath);

                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: result.metadata.filename || file.name,
                        success: true,
                        chunks: result.chunks_embedded || 0
                    }]
                }));

                this.props.onDocumentProcessed({
                    filename: result.metadata.filename || file.name,
                    markdown: result.markdown,
                    metadata: result.metadata,
                    wing: result.wing,
                    filePath: filePath,
                });
            } catch (error) {
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, { filename: file.name, success: false, error: error.message }],
                    error: `Lỗi xử lý ${file.name}: ${error.message}`
                }));
            }
        }

        this.setState({ processing: false, progress: 100, status: 'Hoàn tất!' });
    }

    dismissError() { this.setState({ error: null }); }
    dismissWarning() { this.setState({ warning: null }); }

    render() {
        const { isDragging, files, processing, progress, status, error, warning, processedFiles } = this.state;

        return (
            <div className="p-8 max-w-3xl mx-auto animate-fade-in">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{'\u{1F4E5}'} Tiếp nhận & Quét Tài liệu</h2>
                    <p className="text-sm text-gray-500 mt-1">Kéo thả file PDF hoặc nhấp để chọn từ máy tính</p>
                </div>

                {error && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
                        <span className="text-xl flex-shrink-0">{'\u26A0\uFE0F'}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-red-800 text-sm">Có lỗi xảy ra</p>
                            <p className="text-red-600 text-sm mt-0.5 break-words">{error}</p>
                        </div>
                        <button onClick={() => this.dismissError()} className="text-red-400 hover:text-red-600 flex-shrink-0">{'\u2715'}</button>
                    </div>
                )}

                {warning && (
                    <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-slide-up">
                        <span className="text-xl flex-shrink-0">{'\u26A1'}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-amber-800 text-sm">Cảnh báo</p>
                            <p className="text-amber-600 text-sm mt-0.5 break-words">{warning}</p>
                        </div>
                        <button onClick={() => this.dismissWarning()} className="text-amber-400 hover:text-amber-600 flex-shrink-0">{'\u2715'}</button>
                    </div>
                )}

                <div
                    onDragOver={(e) => this.handleDragOver(e)}
                    onDragLeave={(e) => this.handleDragLeave(e)}
                    onDrop={(e) => this.handleDrop(e)}
                    onClick={() => !processing && this.fileInputRef.current.click()}
                    className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${
                        isDragging
                            ? 'border-primary-400 bg-primary-50/80 scale-[1.01] shadow-lg shadow-primary-100'
                            : processing
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50/80 hover:shadow-md'
                    }`}
                >
                    {isDragging && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/5 to-accent-400/5 pointer-events-none"></div>
                    )}
                    <input ref={this.fileInputRef} type="file" multiple accept=".pdf" style={{ display: 'none' }} onChange={(e) => this.handleFileSelect(e)} />

                    {!processing && !isDragging && (
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="text-4xl">{'\u{1F4C4}'}</span>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">Kéo thả file PDF vào đây</p>
                                <p className="text-sm text-gray-400 mt-1">hoặc nhấp để chọn file từ máy tính</p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                                Hỗ trợ PDF
                            </div>
                        </div>
                    )}

                    {isDragging && (
                        <div className="space-y-3">
                            <div className="w-20 h-20 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center animate-bounce">
                                <span className="text-4xl">{'\u{1F4E5}'}</span>
                            </div>
                            <p className="text-lg font-semibold text-primary-600">Thả file để tải lên</p>
                        </div>
                    )}

                    {processing && (
                        <div className="space-y-5 max-w-sm mx-auto">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                                <span className="text-4xl animate-spin">{'\u23F3'}</span>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-gray-700 truncate">{status}</p>
                                <div className="mt-3 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 flex items-center justify-center"
                                        style={{ width: progress + '%' }}>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
                                    <span className="text-xs text-gray-400">{processedFiles.length}/{files.length} file</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {files.length > 0 && !processing && (
                    <div className="mt-6 animate-slide-up">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{'\u{1F4C1}'} Các file đã chọn ({files.length})</h3>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">{'\u{1F4D1}'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">PDF</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {processedFiles.length > 0 && (
                    <div className="mt-6 animate-slide-up">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{'\u2705'} Kết quả xử lý</h3>
                        <div className="space-y-2">
                            {processedFiles.map((file, index) => (
                                <div key={index} className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm transition-all ${
                                    file.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                                }`}>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        file.success ? 'bg-emerald-100' : 'bg-red-100'
                                    }`}>
                                        <span className="text-lg">{file.success ? '\u2705' : '\u274C'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{file.filename}</p>
                                        <p className={`text-xs ${file.success ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {file.success ? file.chunks + ' đoạn đã lưu vào kho' : file.error}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

module.exports = TabInput;
