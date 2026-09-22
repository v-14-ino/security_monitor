"""
Network port scanner module using python-nmap.
Scans a target for open TCP ports and returns port, state, service,
product, version, and extra information.
"""

import os
import shutil
import sys
import nmap


def find_nmap_executable():
    """
    Dynamically locate the nmap executable in PATH or standard system directories.
    Returns the absolute path to nmap executable, or None if not found.
    Portable across Windows, Linux, and macOS without machine-specific hardcoding.
    """
    # 1. Check standard PATH lookup
    nmap_path = shutil.which("nmap")
    if nmap_path and os.path.isfile(nmap_path):
        return os.path.abspath(nmap_path)

    if sys.platform.startswith("win"):
        candidates = []

        # Per-user local appdata programs (%LOCALAPPDATA%\Programs\Nmap\nmap.exe)
        local_app_data = os.environ.get("LOCALAPPDATA")
        if local_app_data:
            candidates.append(os.path.join(local_app_data, "Programs", "Nmap", "nmap.exe"))

        # ProgramData (%ProgramData%\Nmap\nmap.exe or %ALLUSERSPROFILE%\Nmap\nmap.exe)
        program_data = os.environ.get(
            "ProgramData", os.environ.get("ALLUSERSPROFILE", r"C:\ProgramData")
        )
        if program_data:
            candidates.append(os.path.join(program_data, "Nmap", "nmap.exe"))

        # Standard Program Files (%ProgramFiles%\Nmap\nmap.exe)
        prog_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        if prog_files:
            candidates.append(os.path.join(prog_files, "Nmap", "nmap.exe"))

        # 32-bit Program Files on 64-bit Windows (%ProgramFiles(x86)%\Nmap\nmap.exe)
        prog_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
        if prog_files_x86:
            candidates.append(os.path.join(prog_files_x86, "Nmap", "nmap.exe"))

        # SystemDrive root fallbacks (e.g. C:\ProgramData\Nmap\nmap.exe or C:\Nmap\nmap.exe)
        sys_drive = os.environ.get("SystemDrive", "C:")
        candidates.append(os.path.join(sys_drive, os.sep, "ProgramData", "Nmap", "nmap.exe"))
        candidates.append(os.path.join(sys_drive, os.sep, "Nmap", "nmap.exe"))

        for candidate in candidates:
            if candidate and os.path.isfile(candidate):
                return os.path.abspath(candidate)
    else:
        unix_candidates = [
            "/usr/bin/nmap",
            "/usr/local/bin/nmap",
            "/opt/local/bin/nmap",
            "/sw/bin/nmap",
            "/usr/pkg/bin/nmap",
        ]
        for candidate in unix_candidates:
            if os.path.isfile(candidate):
                return os.path.abspath(candidate)

    return None


def get_scanner():
    """
    Locate nmap and initialize PortScanner with verified search paths and environment.
    """
    nmap_exe = find_nmap_executable()
    if not nmap_exe:
        raise FileNotFoundError(
            "Nmap executable not found. Please install Nmap from https://nmap.org/download.html "
            "or ensure it is available in system directories."
        )

    # Ensure nmap's directory is present in PATH for child processes and dependent DLLs (e.g. wpcap.dll)
    nmap_dir = os.path.dirname(os.path.abspath(nmap_exe))
    current_path = os.environ.get("PATH", "")
    path_entries = [p.lower() for p in current_path.split(os.pathsep) if p]
    if nmap_dir.lower() not in path_entries:
        os.environ["PATH"] = nmap_dir + os.pathsep + current_path

    try:
        search_paths = [nmap_exe, "nmap"]
        return nmap.PortScanner(nmap_search_path=search_paths)
    except nmap.PortScannerError as e:
        raise RuntimeError(f"Failed to initialize Nmap PortScanner: {str(e)}")


def scan_target(target, scan_mode="full"):
    """
    Scan a target (IP or domain) for open TCP ports using Nmap.

    Quick:
        50 common TCP ports, then service detection only on open ports.

    Full:
        300 common TCP ports, then service detection only on open ports.
    """
    try:
        scanner = get_scanner()
    except (FileNotFoundError, RuntimeError) as e:
        return {"error": f"Nmap execution failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Nmap execution failed: {str(e)}"}

    try:
        # Stage 1: Fast TCP port discovery.
        # -Pn  = skip host discovery
        # -sT  = TCP connect scan
        # -T4  = faster timing
        # No -sV here; version detection is done only on discovered open ports.
        port_count = 50 if scan_mode == "quick" else 300

        discovery_args = f"-Pn -sT --top-ports {port_count} -T4"
        scanner.scan(hosts=target, arguments=discovery_args)

    except nmap.PortScannerError as e:
        return {"error": f"Nmap execution failed: {str(e)}"}
    except Exception as e:
        return {
            "error": f"Nmap execution failed: An unexpected error occurred: {str(e)}"
        }

    hosts = scanner.all_hosts()

    if not hosts:
        return {
            "error": f"Host '{target}' is unreachable or could not be resolved. "
                      "Please check the IP address or domain name."
        }

    host = hosts[0]

    # Extract only open TCP ports from discovery scan.
    open_port_numbers = []

    if "tcp" in scanner[host]:
        for port_number, port_data in scanner[host]["tcp"].items():
            if port_data.get("state") == "open":
                open_port_numbers.append(port_number)

    # No open ports found.
    if not open_port_numbers:
        return {
            "target": target,
            "ports": []
        }

    # Stage 2: Service/version detection only on discovered open ports.
    try:
        port_list = ",".join(str(p) for p in sorted(open_port_numbers))

        version_args = (
            f"-Pn -sT -sV --version-light -T4 -p {port_list}"
        )

        scanner.scan(hosts=target, arguments=version_args)

    except nmap.PortScannerError as e:
        # Keep the port discovery result even if version detection fails.
        version_error = str(e)
        print(f"Service detection warning: {version_error}")

    except Exception as e:
        print(f"Service detection warning: {str(e)}")

    ports = []

    if "tcp" in scanner[host]:
        for port_number, port_data in sorted(scanner[host]["tcp"].items()):
            if port_data.get("state") == "open":
                ports.append({
                    "port": port_number,
                    "state": port_data.get("state", "unknown"),
                    "service": port_data.get("name", "unknown"),
                    "product": port_data.get("product", "") or "Unknown",
                    "version": port_data.get("version", "") or "Unknown",
                    "extra_info": port_data.get("extrainfo", "") or "Unknown",
                })

    return {
        "target": target,
        "ports": ports,
    }
