/**
 * Frontend: TabRag Component — RAG chat interface.
 *
 * Tab 3: Chat with AI using document context.
 * Displays sources and citations from retrieved documents.
 *
 * Wing: smartdoc_frontend
 * Topic: ui_components
 * Last Updated: 2026-05-05 13:37
 */

const React = require('react');
const ApiService = require('../services/api').default;

class TabRag extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            inputMessage: '',
            loading: false,
            selectedWings: [],
            wings: [],
            error: null,
        };
    }

    async componentDidMount() {
        // Load wings
        try {
            const wings = await ApiService.getWings();
            this.setState({ wings });
        } catch (error) {
            console.error('Failed to load wings:', error);
        }
    }

    handleSendMessage() {
        const { inputMessage, messages } = this.state;

        if (!inputMessage.trim()) {
            return;
        }

        // Add user message
        const newMessages = [
            ...messages,
            { role: 'user', content: inputMessage },
        ];

        this.setState({
            messages: newMessages,
            inputMessage: '',
            loading: true,
            error: null,
        });

        // Get document context
        const context = this.props.documents.map(doc => doc.markdown);

        // Call AI
        ApiService.chat(inputMessage, context, this.state.selectedWings)
            .then((response) => {
                const aiMessage = response.message?.content || response.response || 'Xin lỗi, có lỗi xảy ra.';
                const sources = response.sources || [];

                this.setState({
                    messages: [
                        ...newMessages,
                        { 
                            role: 'assistant', 
                            content: aiMessage,
                            sources: sources
                        },
                    ],
                    loading: false,
                });
            })
            .catch((error) => {
                this.setState({
                    messages: [
                        ...newMessages,
                        { role: 'assistant', content: `Lỗi: ${error.message}` },
                    ],
                    loading: false,
                    error: `Không thể kết nối tới AI: ${error.message}`
                });
            });
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    toggleWing(wing) {
        this.setState(prevState => ({
            selectedWings: prevState.selectedWings.includes(wing)
                ? prevState.selectedWings.filter(w => w !== wing)
                : [...prevState.selectedWings, wing]
        }));
    }

    clearChat() {
        this.setState({
            messages: [],
            error: null
        });
    }

    dismissError() {
        this.setState({ error: null });
    }

    render() {
        const { messages, inputMessage, loading, wings, selectedWings, error } = this.state;

        return (
            <div className="flex flex-col h-full">
                {/* Wing Filter */}
                <div className="border-b bg-white p-3">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">Lọc theo loại:</span>
                            <div className="flex flex-wrap gap-2">
                                {wings.map(wing => (
                                    <button
                                        key={wing}
                                        onClick={() => this.toggleWing(wing)}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            selectedWings.includes(wing)
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {wing}
                                    </button>
                                ))}
                            </div>
                            {messages.length > 0 && (
                                <button
                                    onClick={() => this.clearChat()}
                                    className="ml-auto text-sm text-gray-600 hover:text-gray-800"
                                >
                                    🗑️ Xóa lịch sử
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start">
                        <span className="text-xl mr-2">⚠️</span>
                        <div className="flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button
                            onClick={() => this.dismissError()}
                            className="text-red-500 hover:text-red-700 ml-2"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 overflow-auto p-6 bg-background">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💬</div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    Hỏi đáp với Tài liệu của bạn
                                </h3>
                                <p className="text-gray-600 mt-2">
                                    Hãy đặt câu hỏi về các tài liệu đã được lưu vào kho
                                </p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-2xl p-4 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-white'
                                            : 'bg-white border shadow-sm'
                                    }`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="text-sm font-medium text-primary mb-2">
                                            🤖 AI Assistant
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap text-base">
                                        {msg.content}
                                    </div>
                                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="text-xs font-medium text-gray-600 mb-2">
                                                📚 Nguồn trích dẫn:
                                            </div>
                                            <div className="space-y-1">
                                                {msg.sources.map((source, idx) => (
                                                    <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                        <span className="font-medium">File:</span> {source.filename || 'Unknown'}
                                                        {source.chunk && <span> | <span className="font-medium">Đoạn:</span> {source.chunk}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border shadow-sm p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin text-2xl">⏳</div>
                                        <div>
                                            <div className="font-medium text-gray-800">AI đang suy nghĩ...</div>
                                            <div className="text-sm text-gray-500">
                                                Đang tìm kiếm trong {this.props.documents.length} tài liệu
                                                {selectedWings.length > 0 && ` (${selectedWings.length} loại)`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t bg-white p-4">
                    <div className="max-w-4xl mx-auto flex gap-2">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => this.setState({ inputMessage: e.target.value })}
                            onKeyPress={(e) => this.handleKeyPress(e)}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary resize-none"
                            rows="3"
                            disabled={loading}
                        ></textarea>
                        <button
                            onClick={() => this.handleSendMessage()}
                            disabled={loading || !inputMessage.trim()}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed self-end"
                        >
                            Gửi
                        </button>
                    </div>
                </div>

                {/* Source Info */}
                <div className="border-t bg-gray-50 p-2">
                    <div className="max-w-4xl mx-auto text-sm text-gray-600">
                        📚 Nguồn dữ liệu: {this.props.documents.length} tài liệu đã lưu
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = TabRag;