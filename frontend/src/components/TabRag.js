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
            ds2apiAvailable: false,
            chatProvider: 'ollama',
            ds2apiLoggedIn: false,
            error: null,
        };
        this.messagesEndRef = React.createRef();
    }

    async componentDidMount() {
        try {
            const [wings, ds2apiStatus, provider] = await Promise.all([
                ApiService.getWings(),
                ApiService.getDs2apiStatus(),
                ApiService.getChatProvider(),
            ]);

            let ds2apiLoggedIn = false;
            if (window.electronAPI) {
                try {
                    const session = await window.electronAPI.getLoginSession('DeepSeek');
                    ds2apiLoggedIn = !!session?.cookies?.length;
                } catch {}
            }

            this.setState({
                wings,
                ds2apiAvailable: ds2apiStatus.available,
                chatProvider: provider.provider,
                ds2apiLoggedIn,
            });
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    componentDidUpdate() {
        this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    handleSendMessage() {
        const { inputMessage, messages } = this.state;
        if (!inputMessage.trim()) return;

        const newMessages = [...messages, { role: 'user', content: inputMessage }];

        this.setState({ messages: newMessages, inputMessage: '', loading: true, error: null });

        const context = this.props.documents.map(doc => doc.markdown);

        ApiService.chat(inputMessage, context, this.state.selectedWings)
            .then((response) => {
                const aiMessage = response.message?.content || response.response || 'Xin lỗi, có lỗi xảy ra.';
                const sources = response.sources || [];
                this.setState({
                    messages: [...newMessages, { role: 'assistant', content: aiMessage, sources }],
                    loading: false,
                });
            })
            .catch((error) => {
                this.setState({
                    messages: [...newMessages, { role: 'assistant', content: 'Lỗi: ' + error.message }],
                    loading: false,
                    error: 'Không thể kết nối tới AI: ' + error.message,
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

    clearChat() { this.setState({ messages: [], error: null }); }
    dismissError() { this.setState({ error: null }); }

    render() {
        const { messages, inputMessage, loading, wings, selectedWings, error, ds2apiAvailable, chatProvider, ds2apiLoggedIn } = this.state;

        return (
            <div className="flex flex-col h-full bg-gray-50/50">
                <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-3 flex-shrink-0 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI:</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        chatProvider === 'ds2api'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-emerald-100 text-emerald-700'
                    }`}>
                        {chatProvider === 'ds2api' ? '\u{1F310} ds2api' : '\u{1F5A8} Ollama'}
                    </span>
                    {chatProvider === 'ds2api' && React.createElement(window.WebViewLoginComponent, {
                        service: "DeepSeek",
                        loginUrl: "https://chat.deepseek.com",
                        compact: true,
                        onLogin: () => this.setState({ ds2apiLoggedIn: true }),
                        onLogout: () => this.setState({ ds2apiLoggedIn: false }),
                    })}
                    {!ds2apiAvailable && chatProvider === 'ollama' && React.createElement(window.WebViewLoginComponent, {
                        service: "DeepSeek",
                        loginUrl: "https://chat.deepseek.com",
                        compact: true,
                        onLogin: () => this.setState({ ds2apiLoggedIn: true }),
                        onLogout: () => this.setState({ ds2apiLoggedIn: false }),
                    })}
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-2">{'\u{1F3F7}\uFE0F'} Lọc:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(wings) && wings.map((wing, idx) => {
                            const label = typeof wing === 'object' ? (wing.name || wing.id || '') : wing;
                            const key = typeof wing === 'object' ? (wing.name || wing.id || idx) : wing;
                            return (
                            <button key={key} onClick={() => this.toggleWing(wing)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                    selectedWings.includes(wing)
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {label}
                            </button>
                            );
                        })}
                        {(!Array.isArray(wings) || wings.length === 0) && (
                            <span className="text-xs text-gray-400 italic">Chưa có loại tài liệu</span>
                        )}
                    </div>
                    {messages.length > 0 && (
                        <button onClick={() => this.clearChat()}
                            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50">
                            {'\u{1F5D1}\uFE0F'} Xóa lịch sử
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 animate-slide-up flex-shrink-0">
                        <span className="text-lg flex-shrink-0">{'\u26A0\uFE0F'}</span>
                        <p className="text-sm text-red-700 flex-1">{error}</p>
                        <button onClick={() => this.dismissError()} className="text-red-400 hover:text-red-600">{'\u2715'}</button>
                    </div>
                )}

                <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full min-h-[400px]">
                                <div className="text-center animate-fade-in">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center mb-5">
                                        <span className="text-4xl">{'\u{1F4AC}'}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700">Hỏi đáp với Tài liệu</h3>
                                    <p className="text-sm text-gray-400 mt-2 max-w-sm">
                                        Đặt câu hỏi về tài liệu đã lưu. AI sẽ tìm kiếm và trả lời dựa trên nội dung tài liệu của bạn.
                                    </p>
                                    <div className="flex items-center gap-4 mt-6 justify-center text-xs text-gray-400">
                                        <span className="flex items-center gap-1">{'\u{1F4C4}'} {this.props.documents.length} tài liệu</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="flex items-center gap-1">{'\u{1F916}'} Gemini AI</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-1.5 px-1">
                                            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                                <span className="text-[10px]">{'\u{1F916}'}</span>
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                                        </div>
                                    )}
                                    <div className={`px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-md shadow-sm shadow-primary-200'
                                            : 'bg-white border border-gray-100 rounded-2xl rounded-tl-md shadow-sm'
                                    }`}>
                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                                            {msg.content}
                                        </p>
                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-[11px] font-medium text-gray-400 mb-1.5">{'\u{1F4DA}'} Nguồn trích dẫn</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.sources.map((source, idx) => (
                                                        <span key={idx} className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                                                            {source.filename || 'Unknown'}{source.chunk ? ` (#${source.chunk})` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="max-w-[70%]">
                                    <div className="flex items-center gap-2 mb-1.5 px-1">
                                        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                            <span className="text-[10px]">{'\u{1F916}'}</span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md shadow-sm px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-sm text-gray-400 ml-2">AI đang suy nghĩ...</span>
                                        </div>
                                        <p className="text-xs text-gray-300 mt-2">
                                            Đang tìm kiếm trong {this.props.documents.length} tài liệu
                                            {selectedWings.length > 0 && ` (${selectedWings.length} loại)`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={this.messagesEndRef} />
                    </div>
                </div>

                <div className="border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => this.setState({ inputMessage: e.target.value })}
                                    onKeyPress={(e) => this.handleKeyPress(e)}
                                    placeholder="Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                                    className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none resize-none transition-all bg-gray-50/50"
                                    rows="2"
                                    disabled={loading} />
                            </div>
                            <button
                                onClick={() => this.handleSendMessage()}
                                disabled={loading || !inputMessage.trim()}
                                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center gap-2 ${
                                    loading || !inputMessage.trim()
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200'
                                }`}>
                                Gửi {'\u2192'}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-gray-400">
                                {'\u{1F4DA}'} Nguồn: {this.props.documents.length} tài liệu đã lưu
                            </span>
                            <span className="text-[11px] text-gray-300">{'\u21E7'} Enter {'\u21A9'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = TabRag;
