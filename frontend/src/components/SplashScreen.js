const React = require('react');

class SplashScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phase: 'detecting',
            hardware: null,
            error: null,
            progress: 0,
            userName: '',
            userPosition: '',
        };
    }

    componentDidMount() {
        this.runDetection();
    }

    async runDetection() {
        this.setState({ phase: 'detecting' });

        const steps = [
            { msg: 'Dang kiem tra cau hinh phan cung...', delay: 400 },
            { msg: 'Dang phat hien GPU...', delay: 600 },
            { msg: 'Dang phan tich bo nho...', delay: 500 },
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, steps[i].delay));
            this.setState({ progress: ((i + 1) / steps.length) * 70 });
        }

        try {
            if (window.electronAPI && window.electronAPI.hardwareCheck) {
                const result = await window.electronAPI.hardwareCheck();
                this.setState({ hardware: result, progress: 100, phase: 'done' });
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
        this.props.onComplete({
            hardware: this.state.hardware || { gpu: { gpu_detected: false, recommended_mode: 'hybrid' } },
            userName: this.state.userName.trim() || null,
            userPosition: this.state.userPosition.trim() || null,
        });
    }

    render() {
        const { phase, hardware, error, progress, userName, userPosition } = this.state;

        const gpu = hardware?.gpu;
        const mode = gpu?.recommended_mode === 'local' ? 'Local' : 'Hybrid';
        const canContinue = phase === 'done' || phase === 'error';

        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
                <div className="text-center max-w-md px-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/20 mb-8">
                        <span className="text-3xl">{'\u{1F4C4}'}</span>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">SmartDoc AI</h1>
                    <p className="text-sm text-slate-400 mb-8">Quan ly tai lieu thong minh</p>

                    <div className="w-full bg-slate-700/50 rounded-full h-2 mb-6 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                            style={{ width: progress + '%' }} />
                    </div>

                    {phase === 'detecting' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-dot"></span>
                            Dang kiem tra cau hinh...
                        </div>
                    )}

                    {phase === 'error' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-sm text-red-300">{error || 'Khong the phat hien phan cung'}</p>
                            </div>
                            <p className="text-xs text-slate-500">App se chay o che do Hybrid mac dinh</p>
                        </div>
                    )}

                    {canContinue && (
                        <div className="space-y-4 animate-fade-in mt-6">
                            {/* Hardware Info */}
                            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-2 text-left">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">GPU</span>
                                    <span className="text-slate-200 font-medium">
                                        {gpu?.gpu_detected ? gpu.gpu_name : 'Khong phat hien'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">VRAM</span>
                                    <span className="text-slate-200 font-medium">
                                        {gpu?.vram_total_mb ? gpu.vram_total_mb + ' MB' : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Che do de xuat</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        mode === 'Local' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                    }`}>{mode}</span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="space-y-3 text-left">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Ten cua ban</label>
                                    <input type="text" value={userName}
                                        onChange={(e) => this.setState({ userName: e.target.value })}
                                        placeholder="Nhap ten..."
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Chuc vu / Phong ban</label>
                                    <input type="text" value={userPosition}
                                        onChange={(e) => this.setState({ userPosition: e.target.value })}
                                        placeholder="Vd: Nhan vien ke toan..."
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors" />
                                </div>
                            </div>

                            <button onClick={() => this.handleContinue()}
                                className="w-full px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all active:scale-95">
                                {'\u2192'} Bat dau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

module.exports = SplashScreen;
