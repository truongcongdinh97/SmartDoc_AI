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

    handleEdit() { this.setState({ editing: true }); }

    handleSave() {
        const { title, date, author, wing } = this.state;
        const updatedDoc = {
            ...this.state.selectedDoc,
            metadata: { ...this.state.selectedDoc.metadata, title, date, author },
            wing,
        };
        this.setState({ selectedDoc: updatedDoc, editing: false });
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

    handleInputChange(field, value) { this.setState({ [field]: value }); }

    async handleSummarize() {
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.summarizeDocument(this.state.selectedDoc.markdown);
            this.setState({ aiResponse: result.summary, aiLoading: false });
        } catch (error) {
            this.setState({ aiError: 'Không thể tóm tắt: ' + error.message, aiLoading: false });
        }
    }

    async handleFormalize() {
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.formalizeDocument(this.state.selectedDoc.markdown);
            this.setState({ aiResponse: result.markdown, aiLoading: false });
        } catch (error) {
            this.setState({ aiError: 'Không thể viết lại: ' + error.message, aiLoading: false });
        }
    }

    async handleCustomRefinement() {
        if (!this.state.customInstruction.trim()) {
            this.setState({ aiError: 'Vui lòng nhập yêu cầu của bạn' });
            return;
        }
        this.setState({ aiLoading: true, aiError: null, aiResponse: '' });
        try {
            const result = await ApiService.customRefinement(this.state.selectedDoc.markdown, this.state.customInstruction);
            this.setState({ aiResponse: result.markdown, aiLoading: false });
        } catch (error) {
            this.setState({ aiError: 'Không thể thực hiện yêu cầu: ' + error.message, aiLoading: false });
        }
    }

    render() {
        const { documents, onDocumentSelect } = this.props;
        const { selectedDoc, editing, title, date, author, wing, aiLoading, aiError, aiResponse, customInstruction } = this.state;

        if (!selectedDoc) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
                            <span className="text-5xl">{'\u{1F4ED}'}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-400">Chưa có tài liệu nào được chọn</h3>
                        <p className="text-sm text-gray-400 mt-2">Vui lòng xử lý tài liệu ở tab <strong>Tiếp nhận & Quét</strong> trước</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex h-full animate-fade-in">
                <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{'\u{1F4C1}'} Danh sách tài liệu</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{documents.length} tài liệu</p>
                    </div>
                    <div className="flex-1 overflow-auto p-3 space-y-1.5">
                        {documents.map((doc, index) => (
                            <button
                                key={index}
                                onClick={() => onDocumentSelect(doc)}
                                className={`w-full text-left p-3 rounded-xl transition-all ${
                                    doc === selectedDoc
                                        ? 'bg-primary-50 border border-primary-200 shadow-sm'
                                        : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        doc === selectedDoc ? 'bg-primary-100' : 'bg-gray-100'
                                    }`}>
                                        <span className="text-sm">{'\u{1F4C4}'}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium truncate ${doc === selectedDoc ? 'text-primary-700' : 'text-gray-700'}`}>
                                            {doc.filename}
                                        </p>
                                        <p className={`text-xs ${doc === selectedDoc ? 'text-primary-400' : 'text-gray-400'}`}>
                                            {doc.wing || 'Chưa phân loại'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50/50">
                    <div className="max-w-4xl mx-auto p-6 space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-gray-800">{'\u{1F4CB}'} Thông tin tài liệu</h2>
                                    {!editing && (
                                        <button onClick={() => this.handleEdit()}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors">
                                            {'\u270F\uFE0F'} Chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                {editing ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Tiêu đề', field: 'title', value: title },
                                            { label: 'Ngày tháng', field: 'date', value: date },
                                            { label: 'Tác giả / Phòng ban', field: 'author', value: author },
                                            { label: 'Loại tài liệu (Wing)', field: 'wing', value: wing },
                                        ].map(f => (
                                            <div key={f.field}>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                                                <input type="text" value={f.value}
                                                    onChange={(e) => this.handleInputChange(f.field, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all" />
                                            </div>
                                        ))}
                                        <div className="col-span-2 flex gap-2 pt-2">
                                            <button onClick={() => this.handleSave()}
                                                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all active:scale-95">
                                                {'\u{1F4BE}'} Lưu thay đổi
                                            </button>
                                            <button onClick={() => this.handleCancel()}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
                                                {'\u2715'} Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Tiêu đề', value: title || 'Chưa có', icon: '\u{1F3F7}\uFE0F' },
                                            { label: 'Ngày tháng', value: date || 'Chưa có', icon: '\u{1F4C5}' },
                                            { label: 'Tác giả', value: author || 'Chưa có', icon: '\u{1F464}' },
                                            { label: 'Wing', value: wing || 'Chưa phân loại', icon: '\u{1F3F7}\uFE0F' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                <span className="text-lg">{item.icon}</span>
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                    <p className="text-sm font-medium text-gray-700">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <h3 className="text-base font-semibold text-gray-800">{'\u{1F4D6}'} Nội dung tài liệu</h3>
                            </div>
                            <div className="p-6">
                                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-auto max-h-96 p-4">
                                    <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-mono">
                                        {selectedDoc.markdown}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <h3 className="text-base font-semibold text-gray-800">{'\u{1F916}'} Trợ lý AI</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {aiError && (
                                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                                        <span className="text-lg flex-shrink-0">{'\u26A0\uFE0F'}</span>
                                        <p className="text-sm text-red-700">{aiError}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => this.handleSummarize()} disabled={aiLoading}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                            aiLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                        }`}>
                                        {aiLoading ? '\u23F3 Đang xử lý...' : '\u{1F4DD} Tóm tắt lại'}
                                    </button>
                                    <button onClick={() => this.handleFormalize()} disabled={aiLoading}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                            aiLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
                                        }`}>
                                        {aiLoading ? '\u23F3 Đang xử lý...' : '\u270D\uFE0F Viết lại trang trọng'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Yêu cầu tùy chỉnh</label>
                                    <div className="flex gap-2">
                                        <textarea
                                            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none resize-none transition-all"
                                            rows="2" placeholder="Ví dụ: Trích xuất bảng dữ liệu, tìm ngày tháng quan trọng..."
                                            value={customInstruction}
                                            onChange={(e) => this.setState({ customInstruction: e.target.value })}
                                            disabled={aiLoading} />
                                        <button onClick={() => this.handleCustomRefinement()} disabled={aiLoading}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all self-end active:scale-95 ${
                                                aiLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200'
                                            }`}>
                                            {aiLoading ? '\u23F3' : '\u{1F680} Thực hiện'}
                                        </button>
                                    </div>
                                </div>

                                {aiResponse && (
                                    <div className="animate-slide-up">
                                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">{'\u{1F4A1}'} Kết quả AI</h4>
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-xl border border-blue-100">
                                            <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{aiResponse}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = TabPreview;
