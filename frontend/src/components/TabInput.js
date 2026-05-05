/**
 * Frontend: TabInput Component — File upload and processing interface.
 *
 * Tab 1: Drag & drop zone for PDF files.
 * Displays processing status and progress.
 *
 * Wing: smartdoc_frontend
 * Topic: ui_components
 * Last Updated: 2026-05-05 13:36
 */

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
            this.setState({ 
                error: 'Vui lòng chọn file PDF hợp lệ',
                warning: null
            });
            return;
        }

        this.setState({ 
            files: pdfFiles, 
            error: null,
            warning: null,
            processedFiles: []
        });

        // Process files
        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            this.setState({
                processing: true,
                progress: ((i + 1) / pdfFiles.length) * 100,
                status: `Đang xử lý file ${i + 1}/${pdfFiles.length}: ${file.name}`,
            });

            try {
                // Get full path (Electron-specific)
                const filePath = file.path || file.name;

                const result = await ApiService.processFile(filePath);

                // Add to processed files list
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: result.metadata.filename || file.name,
                        success: true,
                        chunks: result.chunks_embedded || 0
                    }]
                }));

                // Notify parent
                this.props.onDocumentProcessed({
                    filename: result.metadata.filename || file.name,
                    markdown: result.markdown,
                    metadata: result.metadata,
                    wing: result.wing,
                    filePath: filePath,
                });

            } catch (error) {
                console.error('Processing failed:', error);
                // Add failed file to list
                this.setState(prevState => ({
                    processedFiles: [...prevState.processedFiles, {
                        filename: file.name,
                        success: false,
                        error: error.message
                    }],
                    error: `Lỗi xử lý file ${file.name}: ${error.message}`
                }));
            }
        }

        this.setState({
            processing: false,
            progress: 100,
            status: 'Hoàn tất!',
        });
    }

    dismissError() {
        this.setState({ error: null });
    }

    dismissWarning() {
        this.setState({ warning: null });
    }

    render() {
        const { isDragging, files, processing, progress, status, error, warning, processedFiles } = this.state;

        return (
            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Tiếp nhận & Quét Tài liệu</h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-start">
                            <span className="text-2xl mr-3">⚠️</span>
                            <div className="flex-1">
                                <p className="font-semibold text-red-800">Có lỗi xảy ra</p>
                                <p className="text-red-700">{error}</p>
                            </div>
                            <button
                                onClick={() => this.dismissError()}
                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Warning Message */}
                    {warning && (
                        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg flex items-start">
                            <span className="text-2xl mr-3">⚡</span>
                            <div className="flex-1">
                                <p className="font-semibold text-yellow-800">Cảnh báo</p>
                                <p className="text-yellow-700">{warning}</p>
                            </div>
                            <button
                                onClick={() => this.dismissWarning()}
                                className="text-yellow-500 hover:text-yellow-700 text-xl font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Drag & Drop Zone */}
                    <div
                        onDragOver={(e) => this.handleDragOver(e)}
                        onDragLeave={(e) => this.handleDragLeave(e)}
                        onDrop={(e) => this.handleDrop(e)}
                        onClick={() => this.fileInputRef.current.click()}
                        className={`border-4 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                            isDragging
                                ? 'border-primary bg-blue-50'
                                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                        } ${processing ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <input
                            ref={this.fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => this.handleFileSelect(e)}
                        />

                        {!processing && (
                            <div>
                                <div className="text-6xl mb-4">📄</div>
                                <h3 className="text-xl font-semibold mb-2">Kéo thả PDF vào đây</h3>
                                <p className="text-gray-600">hoặc nhấp để chọn file từ máy tính</p>
                            </div>
                        )}

                        {processing && (
                            <div>
                                <div className="text-6xl mb-4">⏳</div>
                                <h3 className="text-xl font-semibold mb-2">{status}</h3>
                                <div className="w-full bg-gray-200 rounded-full h-4 mt-4 overflow-hidden">
                                    <div
                                        className="bg-primary h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <span className="text-xs font-bold text-white">{progress.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    {progress.toFixed(0)}% hoàn thành - Đã xử lý {processedFiles.length}/{files.length} file
                                </p>
                            </div>
                        )}
                    </div>

                    {/* File List */}
                    {files.length > 0 && !processing && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Các file đã chọn:</h3>
                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="bg-white p-3 rounded shadow-sm flex items-center">
                                        <span className="text-2xl mr-3">📎</span>
                                        <span className="flex-1">{file.name}</span>
                                        <span className="text-gray-500 text-sm">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Processed Files Results */}
                    {processedFiles.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Kết quả xử lý:</h3>
                            <ul className="space-y-2">
                                {processedFiles.map((file, index) => (
                                    <li key={index} className={`p-3 rounded shadow-sm flex items-center ${
                                        file.success 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-red-50 border border-red-200'
                                    }`}>
                                        <span className="text-2xl mr-3">
                                            {file.success ? '✅' : '❌'}
                                        </span>
                                        <span className="flex-1 font-medium">{file.filename}</span>
                                        <span className={`text-sm ${
                                            file.success ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {file.success 
                                                ? `${file.chunks} đoạn đã lưu` 
                                                : file.error}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

module.exports = TabInput;