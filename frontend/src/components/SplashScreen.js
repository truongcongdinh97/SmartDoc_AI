const React = require('react');

class SplashScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phase: 'detecting',
            hardware: null,
            error: null,
            progress: 0,
        };
    }

    componentDidMount() {
        this.runDetection();
    }

    async runDetection() {
        this.setState({ phase: 'detecting' });

        const steps = [
            { msg: 'Đang kiểm tra cấu hình phần cứng...', delay: 500 },
            { msg: 'Đang phát hiện GPU...', delay: 800 },
            { msg: 'Đang phân tích bộ nhớ...', delay: 600 },
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, steps[i].delay));
            this.setState({ progress: ((i + 1) / steps.length) * 70 });
        }

        try {
            if (window.electronAPI && window.electronAPI.hardwareCheck) {
                const result = await window.electronAPI.hardwareCheck();
                this.setState({ hardware: result, progress: 100 });

                if (result && result.gpu) {
                    await new Promise(r => setTimeout(r, 800));
                    this.props.onComplete(result);
                }
            } else {
                this.setState({
                    phase: 'error',
                    error: 'electronAPI not available (dev mode)',
                    hardware: { gpu: { gpu_detected: false, recommended_mode: 'hybrid' } },
                });
            }
        } catch (err) {
            this.setState({
                phase: 'error',
                error: err.message,
                hardware: { gpu: { gpu_detected: false, recommended_mode: 'hybrid' } },
            });
        }
    }

    handleContinue() {
        this.props.onComplete(this.state.hardware || {
            gpu: { gpu_detected: false, recommended_mode: 'hybrid' }
        });
    }

    render() {
        const { phase, hardware, error, progress } = this.state;

        const gpu = hardware?.gpu;
        const mode = gpu?.recommended_mode === 'local' ? 'Local' : 'Hybrid';

        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
                <div className="text-center max-w-md px-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/20 mb-8">
                        <span className="text-3xl">{'\u{1F4C4}'}</span>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">SmartDoc AI</h1>
                    <p className="text-sm text-slate-400 mb-8">Đang chuẩn bị môi trường...</p>

                    <div className="w-full bg-slate-700/50 rounded-full h-2 mb-6 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                            style={{ width: progress + '%' }} />
                    </div>

                    {phase === 'detecting' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-dot"></span>
                                Đang kiểm tra cấu hình...
                            </div>
                        </div>
                    )}

                    {phase === 'error' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-sm text-red-300">{error || 'Không thể phát hiện phần cứng'}</p>
                            </div>
                            <p className="text-xs text-slate-500">App sẽ chạy ở chế độ Hybrid mặc định</p>
                            <button onClick={() => this.handleContinue()}
                                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all">
                                Tiếp tục
                            </button>
                        </div>
                    )}

                    {hardware && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-2 text-left">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">GPU</span>
                                    <span className="text-slate-200 font-medium">
                                        {gpu?.gpu_detected ? gpu.gpu_name : 'Không phát hiện'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">VRAM</span>
                                    <span className="text-slate-200 font-medium">
                                        {gpu?.vram_total_mb ? gpu.vram_total_mb + ' MB' : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Chế độ đề xuất</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        mode === 'Local' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                        {mode}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => this.handleContinue()}
                                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all active:scale-95">
                                {'\u2192'} Tiếp tục
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

module.exports = SplashScreen;
