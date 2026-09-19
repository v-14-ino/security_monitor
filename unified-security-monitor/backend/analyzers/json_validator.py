def process_report(json_data):
    """
    Safely parses JSON and extracts required metadata.
    """
    if not isinstance(json_data, dict):
        raise ValueError("JSON root must be an object")

    report_metadata = json_data.get('report_metadata', {})
    scan_info = json_data.get('scan_info', {})
    
    # Extract metadata safely
    target = report_metadata.get('target', scan_info.get('target', 'Unknown'))
    scan_mode = scan_info.get('scan_mode', 'Unknown')
    scan_duration = scan_info.get('scan_duration', 'Unknown')
    generated_at = report_metadata.get('generated_at', 'Unknown')
    generator = report_metadata.get('generator', 'Unknown')
    report_version = report_metadata.get('report_version', 'Unknown')
    
    # Check for sections
    port_scan_data = json_data.get('port_scan', None)
    has_port_scan = port_scan_data is not None
    port_scan_entries = len(port_scan_data) if isinstance(port_scan_data, (list, dict)) else 0
    
    web_security_data = json_data.get('web_security', None)
    has_web_security = web_security_data is not None and (len(web_security_data) > 0 if isinstance(web_security_data, (list, dict)) else True)
    
    cve_data = json_data.get('cve_analysis', None)
    if cve_data is None:
        cve_analysis_status = "Not Available"
    else:
        findings = cve_data.get('findings', [])
        total_cves = cve_data.get('total_cves', 0)
        
        if total_cves == 0 and len(findings) == 0:
            cve_analysis_status = "No CVEs Found"
        else:
            cve_analysis_status = "Available"

    # Phase 2: Dynamic Open Port & Service Analysis
    open_ports_list = []
    if isinstance(port_scan_data, list):
        for entry in port_scan_data:
            if isinstance(entry, dict) and str(entry.get('state', '')).lower() == 'open':
                def clean_val(v):
                    return "Unknown" if not v or str(v).strip().lower() == 'unknown' else str(v)
                
                port_val = entry.get('port', 0)
                try:
                    port_num = int(port_val)
                except (ValueError, TypeError):
                    port_num = port_val

                open_ports_list.append({
                    'port': port_num,
                    'service': clean_val(entry.get('service')),
                    'product': clean_val(entry.get('product')),
                    'version': clean_val(entry.get('version')),
                    'extra_info': clean_val(entry.get('extra_info'))
                })
        
        # Sort ports numerically ascending (put non-integers at end)
        open_ports_list.sort(key=lambda x: x['port'] if isinstance(x['port'], int) else float('inf'))

    port_analysis = {
        'available': len(open_ports_list) > 0,
        'open_port_count': len(open_ports_list),
        'ports': open_ports_list
    }

    return {
        'metadata': {
            'target': target,
            'scan_mode': scan_mode,
            'scan_duration': scan_duration,
            'generated_at': generated_at,
            'generator': generator,
            'report_version': report_version
        },
        'availability': {
            'port_scan': has_port_scan,
            'port_count': port_scan_entries,
            'web_security': has_web_security,
            'cve_analysis': cve_analysis_status
        },
        'port_analysis': port_analysis
    }
