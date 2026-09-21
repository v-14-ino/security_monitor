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

    Args:
        target (str): The IP address or domain name to scan.
        scan_mode (str): 'full' (top 1000 ports) or 'quick' (top 100 ports).

    Returns:
        dict: A dictionary with 'target' and 'ports' keys on success,
              or 'error' key on failure.
    """
    try:
        scanner = get_scanner()
    except (FileNotFoundError, RuntimeError) as e:
        return {"error": f"Nmap execution failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Nmap execution failed: {str(e)}"}

    try:
        # -sT: TCP connect scan (works without root/admin privileges)
        # -sV: probe open ports to determine service/version info
        # -Pn: skip ICMP/host-discovery probes; useful on cloud hosts where
        # ICMP discovery may be filtered even when TCP ports are reachable.
        # -T4: aggressive timing for faster results
        args = (
            "-Pn -sT -sV --top-ports 100 -T4"
            if scan_mode == "quick"
            else "-Pn -sT -sV --top-ports 1000 -T4"
        )
        scanner.scan(hosts=target, arguments=args)
    except nmap.PortScannerError as e:
        return {"error": f"Nmap execution failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Nmap execution failed: An unexpected error occurred: {str(e)}"}

    # Check if any hosts were found
    hosts = scanner.all_hosts()
    if not hosts:
        return {
            "error": f"Host '{target}' is unreachable or could not be resolved. "
                     "Please check the IP address or domain name."
        }

    host = hosts[0]
    ports = []

    # Extract TCP port data with service version details
    if "tcp" in scanner[host]:
        for port_number, port_data in sorted(scanner[host]["tcp"].items()):
            ports.append({
                "port": port_number,
                "state": port_data.get("state", "unknown"),
                "service": port_data.get("name", "unknown"),
                "product": port_data.get("product", "") or "Unknown",
                "version": port_data.get("version", "") or "Unknown",
                "extra_info": port_data.get("extrainfo", "") or "Unknown",
            })

    # Filter to only open ports for a cleaner result
    open_ports = [p for p in ports if p["state"] == "open"]

    return {
        "target": target,
        "ports": open_ports,
    }
