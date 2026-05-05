/**
 * Frontend: TabPreview Component — Document preview and editing interface.
 *
 * Tab 2: Review processed documents with metadata editing.
 * Includes AI assistance for document refinement.
 *
 * Wing: smartdoc_frontend
 * Topic: ui_components
 * Last Updated: 2026-05-05 09:46
 */

const React = require('react');
const ApiService = require('../services/api');

class TabPreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDoc: props.document,
            editing: false,
            title: props.document?.metadata?.title || '',
            date: props.document?.metadata?.date || '',
            author: props.document?.metadata?.author || '',
            wing: props.document?.wing || '',
            aiLoading: false,
            aiError: null,
            aiResponse: '',
            customInstruction: '',
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.document !== this.props.document) {
            this.setState({
                selectedDoc: this.props.document,
                editing: false,
                title: this.props.document?.metadata?.title || '',
                date: this.props.document?.metadata?.date || '',
                author: this.props.document?.metadata?.author || '',
                wing: this.props.document?.wing || '',
                aiResponse: '',
                customInstruction: '',
                aiError: null,
            });
        }
    }

    handleEdit() {
        this.setState({ editing: true });
    }

    handleSave() {
        const { title, date, author, wing } = this.state;
        const updatedDoc = {
            ...this.state.selectedDoc,
            metadata: {
                ...this.state.selectedDoc.metadata,
                title,
                date,
                author,
            },
            wing,
        };

        this.setState({ selectedDoc: updatedDoc, editing: false });
        // TODO: Send update to backend
    }

    handleCancel() {
        this.setState({
            editing: false,
            title: this.state.selectedDoc?.metadata?.title || '',
            date: this.state.selectedDoc?.metadata?.date || '',
            author: this.state.selectedDoc?.metadata?.author || '',
            wing: this.state.selectedDoc?.wing || '',
        });
    }

    handleInputChange(field, value) {
        this.setState({ [field]: value });
    }

    async handleSummarize() {
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.summarizeDocument(this.state.selectedDoc.markdown);
            this.setState({ aiResponse: result.summary, aiLoading: false });
        } catch (error) {
            this.setState({ 
                aiError: `Không thể tóm tắt: ${error.message}`, 
                aiLoading: false 
            });
        }
    }

    async handleFormalize() {
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.formalizeDocument(this.state.selectedDoc.markdown);
            this.setState({ aiResponse: result.markdown, aiLoading: false });
        } catch (error) {
            this.setState({ 
                aiError: `Không thể viết lại: ${error.message}`, 
                aiLoading: false 
            });
        }
    }

    async handleCustomRefinement() {
        if (!this.state.customInstruction.trim()) {
            this.setState({ aiError: 'Vui lòng nhập yêu cầu của bạn' });
            return;
        }
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.customRefinement(
                this.state.selectedDoc.markdown,
                this.state.customInstruction
            );
            this.setState({ aiResponse: result.markdown, aiLoading: false });
        } catch (error) {
            this.setState({ 
                aiError: `Không thể thực hiện yêu cầu: ${error.message}`, 
                aiLoading: false 
            });
        }
    }

    render() {
        const { documents, onDocumentSelect } = this.props;
        const { 
            selectedDoc, 
            editing, 
            title, 
            date, 
            author, 
            wing,
            aiLoading,
            aiError,
            aiResponse,
            customInstruction
        } = this.state;

        if (!selectedDoc) {
            return (
                <div className="container mx-auto p-6 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-600">
                        Chưa có tài liệu nào được chọn
                    </h3>
                    <p className="text-gray-500 mt-2">Vui lòng xử lý tài liệu ở Tab 1 trước</p>
                </div>
            );
        }

        return (
            <div className="flex h-full">
                {/* Document List */}
                <div className="w-1/4 border-r bg-white overflow-auto p-4">
                    <h3 className="font-bold mb-4 text-gray-800">Danh sách tài liệu</h3>
                    <ul className="space-y-2">
                        {documents.map((doc, index) => (
                            <li
                                key={index}
                                onClick={() => onDocumentSelect(doc)}
                                className={`p-3 rounded cursor-pointer transition-colors ${
                                    doc === selectedDoc
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                <div className="font-medium truncate">{doc.filename}</div>
                                <div className="text-sm opacity-75">{doc.wing}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Document Preview */}
                <div className="flex-1 overflow-auto p-6 bg-background">
                    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
                        {/* Metadata Header */}
                        <div className="mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Thông tin tài liệu</h2>

                            {editing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tiêu đề:
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => this.handleInputChange('title', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày tháng:
                                        </label>
                                        <input
                                            type="text"
                                            value={date}
                                            onChange={(e) => this.handleInputChange('date', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tác giả/Phòng ban:
                                        </label>
                                        <input
                                            type="text"
                                            value={author}
                                            onChange={(e) => this.handleInputChange('author', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại tài liệu (Wing):
                                        </label>
                                        <input
                                            type="text"
                                            value={wing}
                                            onChange={(e) => this.handleInputChange('wing', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => this.handleSave()}
                                            className="bg-success text-white px-4 py-2 rounded hover:bg-green-600"
                                        >
                                            💾 Lưu
                                        </button>
                                        <button
                                            onClick={() => this.handleCancel()}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                        >
                                            ✗ Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Tiêu đề: </span>
                                        <span className="text-gray-800">{title || 'Chưa có'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Ngày: </span>
                                        <span className="text-gray-800">{date || 'Chưa có'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Tác giả: </span>
                                        <span className="text-gray-800">{author || 'Chưa có'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Wing: </span>
                                        <span className="text-gray-800">{wing || 'Chưa phân loại'}</span>
                                    </div>
                                    <button
                                        onClick={() => this.handleEdit()}
                                        className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        ✏️ Chỉnh sửa thông tin
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Markdown Content */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Nội dung tài liệu</h3>
                            <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-96">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                                    {selectedDoc.markdown}
                                </pre>
                            </div>
                        </div>

                        {/* AI Assistant */}
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">🤖 Trợ lý AI</h3>
                            
                            {/* Error Message */}
                            {aiError && (
                                <div className="mb-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                                    ⚠️ {aiError}
                                </div>
                            )}

                            {/* AI Buttons */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    onClick={() => this.handleSummarize()}
                                    disabled={aiLoading}
                                    className={`px-3 py-2 rounded ${
                                        aiLoading 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-warning text-black hover:bg-yellow-500'
                                    }`}
                                >
                                    {aiLoading ? '⏳ Đang xử lý...' : '📝 Tóm tắt lại'}
                                </button>
                                <button
                                    onClick={() => this.handleFormalize()}
                                    disabled={aiLoading}
                                    className={`px-3 py-2 rounded ${
                                        aiLoading 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-warning text-black hover:bg-yellow-500'
                                    }`}
                                >
                                    {aiLoading ? '⏳ Đang xử lý...' : '✍️ Viết lại trang trọng'}
                                </button>
                            </div>

                            {/* Custom Instruction */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Yêu cầu tùy chỉnh:
                                </label>
                                <textarea
                                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary"
                                    rows="2"
                                    placeholder="Ví dụ: Trích xuất tất cả các bảng dữ liệu, tìm các ngày tháng quan trọng..."
                                    value={customInstruction}
                                    onChange={(e) => this.setState({ customInstruction: e.target.value })}
                                    disabled={aiLoading}
                                ></textarea>
                                <button
                                    onClick={() => this.handleCustomRefinement()}
                                    disabled={aiLoading}
                                    className={`mt-2 px-4 py-2 rounded ${
                                        aiLoading 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-primary text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {aiLoading ? '⏳ Đang xử lý...' : '🚀 Thực hiện'}
                                </button>
                            </div>

                            {/* AI Response */}
                            {aiResponse && (
                                <div className="mt-4">
                                    <h4 className="text-md font-semibold text-gray-800 mb-2">
                                        💡 Kết quả AI:
                                    </h4>
                                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                                            {aiResponse}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = TabPreview;