"""Hardware Check — GPU/VRAM detection for SmartDoc AI.

Returns JSON with GPU info, VRAM, and recommended mode.
Sidecar process spawned by Electron main process.

Wing: smartdoc_backend
Topic: hardware_detection
Updated: 2026-05-06
"""

import json
import sys
import platform


def check_gpu():
    """Detect GPU and VRAM. Returns dict with GPU info."""
    result = {
        "gpu_detected": False,
        "gpu_name": None,
        "vram_total_mb": 0,
        "vram_free_mb": 0,
        "recommended_mode": "hybrid",
        "error": None,
    }

    # Try GPUtil (NVIDIA GPUs)
    try:
        import GPUtil

        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]
            result["gpu_detected"] = True
            result["gpu_name"] = gpu.name
            result["vram_total_mb"] = int(gpu.memoryTotal)
            result["vram_free_mb"] = int(gpu.memoryFree)

            if gpu.memoryTotal >= 6144:  # 6GB+
                result["recommended_mode"] = "local"
            else:
                result["recommended_mode"] = "hybrid"

            return result
    except ImportError:
        result["error"] = "GPUtil not installed"
    except Exception as e:
        result["error"] = str(e)

    # Try WMI (Windows)
    if platform.system() == "Windows":
        try:
            import wmi

            c = wmi.WMI()
            gpus = c.Win32_VideoController()
            for gpu in gpus:
                if gpu.Name and "microsoft" not in gpu.Name.lower():
                    result["gpu_detected"] = True
                    result["gpu_name"] = gpu.Name
                    vram = getattr(gpu, "AdapterRAM", None)
                    if vram:
                        result["vram_total_mb"] = int(vram) // (1024 * 1024)
                        if result["vram_total_mb"] >= 6144:
                            result["recommended_mode"] = "local"
                    return result
        except ImportError:
            pass
        except Exception as e:
            result["error"] = str(e)

    # Try nvidia-smi
    try:
        import subprocess

        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free",
             "--format=csv,noheader,nounits"],
            encoding="utf-8",
            timeout=5,
        )
        parts = output.strip().split(", ")
        if len(parts) >= 2:
            result["gpu_detected"] = True
            result["gpu_name"] = parts[0]
            result["vram_total_mb"] = int(float(parts[1]))
            if len(parts) >= 3:
                result["vram_free_mb"] = int(float(parts[2]))
            if result["vram_total_mb"] >= 6144:
                result["recommended_mode"] = "local"
            return result
    except Exception:
        pass

    return result


def check_system():
    """Get basic system info."""
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "cpu_count": int(platform.processor() or 0) or None,
        "ram_total_gb": None,
    }


def main():
    """Run hardware check and print JSON result."""
    result = {
        "status": "ok",
        "system": check_system(),
        "gpu": check_gpu(),
    }

    print(json.dumps(result, indent=2))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
