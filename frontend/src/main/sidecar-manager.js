/**
 * Frontend: SidecarManager — Manages Python sidecar processes for Electron.
 *
 * Spawn/monitor/kill Python processes.
 * Health-check via port polling. Auto-restart on crash.
 *
 * Wing: smartdoc_frontend
 * Topic: electron_main
 * Last Updated: 2026-05-06
 */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

class SidecarManager {
    constructor() {
        this.processes = new Map();
    }

    getBackendDir() {
        return path.join(__dirname, '..', '..', '..', 'backend');
    }

    getPythonPath() {
        const venvPython = path.join(this.getBackendDir(), 'venv', 'Scripts', 'python.exe');
        try {
            require('fs').accessSync(venvPython);
            return venvPython;
        } catch {
            return 'python';
        }
    }

    async start(name, script, { port, args = [], cwd, onMessage } = {}) {
        if (this.processes.has(name) && this.processes.get(name).process) {
            console.log(`[Sidecar] ${name} already running`);
            return;
        }

        const procCwd = cwd || this.getBackendDir();
        const scriptPath = path.join(this.getBackendDir(), script);
        const python = this.getPythonPath();

        console.log(`[Sidecar] Starting ${name}: ${python} ${script} ${args.join(' ')}`);

        const child = spawn(python, [scriptPath, ...args], {
            cwd: procCwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });

        const entry = {
            process: child,
            script,
            port,
            restarts: 0,
            maxRestarts: 3,
        };

        child.stdout.on('data', (data) => {
            const text = data.toString();
            console.log(`[Sidecar:${name}] ${text.trim()}`);
            if (onMessage) onMessage(text.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(`[Sidecar:${name}:err] ${data.toString().trim()}`);
        });

        child.on('exit', (code, signal) => {
            console.log(`[Sidecar] ${name} exited (code=${code}, signal=${signal})`);
            this.processes.delete(name);

            if (code !== 0 && entry.restarts < entry.maxRestarts) {
                entry.restarts++;
                console.log(`[Sidecar] Auto-restart ${name} (${entry.restarts}/${entry.maxRestarts})`);
                this.start(name, script, { port, args, cwd, onMessage });
            }
        });

        child.on('error', (err) => {
            console.error(`[Sidecar] ${name} error:`, err.message);
        });

        this.processes.set(name, entry);

        if (port) {
            await this.waitForPort(port, 15000);
        }

        return child;
    }

    async waitForPort(port, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                await new Promise((resolve, reject) => {
                    const sock = new net.Socket();
                    sock.setTimeout(2000);
                    sock.on('connect', () => { sock.destroy(); resolve(); });
                    sock.on('error', () => { sock.destroy(); reject(); });
                    sock.on('timeout', () => { sock.destroy(); reject(); });
                    sock.connect(port, '127.0.0.1');
                });
                return true;
            } catch {
                await new Promise(r => setTimeout(r, 500));
            }
        }
        console.warn(`[Sidecar] Port ${port} not ready after ${timeout}ms`);
        return false;
    }

    stop(name) {
        const entry = this.processes.get(name);
        if (!entry || !entry.process) return false;

        const pid = entry.process.pid;
        console.log(`[Sidecar] Stopping ${name} (pid=${pid})`);

        if (process.platform === 'win32') {
            spawn('taskkill', ['/PID', String(pid), '/F', '/T']);
        } else {
            process.kill(-pid, 'SIGTERM');
            setTimeout(() => {
                try { process.kill(-pid, 'SIGKILL'); } catch {}
            }, 3000);
        }

        this.processes.delete(name);
        return true;
    }

    stopAll() {
        for (const name of this.processes.keys()) {
            this.stop(name);
        }
    }

    getStatus() {
        const status = {};
        for (const [name, entry] of this.processes) {
            status[name] = {
                running: entry.process && !entry.process.killed,
                script: entry.script,
                port: entry.port,
                restarts: entry.restarts,
                pid: entry.process?.pid || null,
            };
        }
        return status;
    }

    async healthCheck(name) {
        const entry = this.processes.get(name);
        if (!entry || !entry.process || entry.process.killed) return false;
        if (!entry.port) return !entry.process.killed;

        try {
            await new Promise((resolve, reject) => {
                const sock = new net.Socket();
                sock.setTimeout(2000);
                sock.on('connect', () => { sock.destroy(); resolve(); });
                sock.on('error', () => { sock.destroy(); reject(); });
                sock.on('timeout', () => { sock.destroy(); reject(); });
                sock.connect(entry.port, '127.0.0.1');
            });
            return true;
        } catch {
            return false;
        }
    }

    findFreePort(preferred = 5000) {
        return new Promise((resolve, reject) => {
            const server = require('net').createServer();
            server.listen(preferred, '127.0.0.1', () => {
                const port = server.address().port;
                server.close(() => resolve(port));
            });
            server.on('error', () => {
                const server2 = require('net').createServer();
                server2.listen(0, '127.0.0.1', () => {
                    const port = server2.address().port;
                    server2.close(() => resolve(port));
                });
            });
        });
    }

    async runOnce(name, script, { args = [], cwd } = {}) {
        const procCwd = cwd || this.getBackendDir();
        const scriptPath = path.join(this.getBackendDir(), script);
        const python = this.getPythonPath();

        console.log(`[Sidecar] RunOnce ${name}: ${python} ${script}`);

        return new Promise((resolve, reject) => {
            const child = spawn(python, [scriptPath, ...args], {
                cwd: procCwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('error', (err) => {
                reject(err);
            });

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(stderr.trim() || `Exit code ${code}`));
                }
            });
        });
    }
}

module.exports = SidecarManager;
