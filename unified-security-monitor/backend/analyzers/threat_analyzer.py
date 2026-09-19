def analyze_threats(port_analysis_data, cve_analysis_data):
    """
    Analyzes open ports and returns potential generic security threats based on services.
    """
    threats = []
    
    if not port_analysis_data.get('available', False):
        return {
            'total_threats': 0,
            'highest_severity': 'Informational',
            'services_analyzed': 0,
            'threats': []
        }

    ports = port_analysis_data.get('ports', [])
    services_analyzed = len(ports)
    
    severity_order = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Informational': 0}
    highest_severity_val = -1
    highest_severity_str = 'Informational'

    cve_findings = []
    if cve_analysis_data and isinstance(cve_analysis_data, dict):
        cve_findings = cve_analysis_data.get('findings', [])
    
    def add_threat(port, service, product, version, severity, threat_type, title, description, recommendation, source="Service Profiler"):
        nonlocal highest_severity_val, highest_severity_str
        
        threats.append({
            'port': port,
            'service': service,
            'product': product,
            'version': version,
            'severity': severity,
            'threat_type': threat_type,
            'title': title,
            'description': description,
            'recommendation': recommendation,
            'source': source
        })
        
        if severity_order.get(severity, 0) > highest_severity_val:
            highest_severity_val = severity_order.get(severity, 0)
            highest_severity_str = severity

    for entry in ports:
        port = entry.get('port', 0)
        service = str(entry.get('service', '')).lower()
        product = entry.get('product', 'Unknown')
        version = entry.get('version', 'Unknown')
        
        # Check for CVEs for this component
        has_cves = len(cve_findings) > 0 # Simplistic mapping; just flags if report has CVEs

        if service in ['ftp'] or port == 21:
            add_threat(port, service, product, version, 'High', 'Authentication', 'Potential Credential Exposure', 
                       'FTP transmits data and credentials in cleartext, exposing it to interception.', 
                       'Migrate to secure protocols like SFTP or FTPS.')
        elif service in ['ssh'] or port == 22:
            add_threat(port, service, product, version, 'Medium', 'Access Control', 'Potential Brute-Force Authentication', 
                       'Repeated authentication attempts may target exposed SSH services, particularly where weak credentials are used.', 
                       'Use strong authentication, disable unnecessary remote access, and apply appropriate access controls.')
        elif service in ['smtp'] or port in [25, 465, 587]:
            add_threat(port, service, product, version, 'Medium', 'Email Service', 'Potential Email Abuse', 
                       'Exposed SMTP services can be targeted for spam relay, service enumeration, or authentication attacks.', 
                       'Ensure open relay is disabled and apply strict authentication and rate limiting.')
        elif service in ['domain', 'dns'] or port == 53:
            add_threat(port, service, product, version, 'Low', 'Service Abuse', 'Potential DNS Service Abuse', 
                       'DNS services can be targeted for cache poisoning, zone transfers, or used in amplification attacks if misconfigured.', 
                       'Restrict zone transfers, disable recursive queries for untrusted networks, and apply rate limiting.')
        elif service in ['http', 'www'] or port == 80:
            add_threat(port, service, product, version, 'Medium', 'Web Application', 'Unencrypted Web Attack Surface', 
                       'HTTP communication is unencrypted, exposing data to interception. Web services present a broad attack surface.', 
                       'Force HTTPS redirection and deploy web application firewalls (WAF).')
        elif service in ['https', 'ssl/http'] or port == 443:
            add_threat(port, service, product, version, 'Low', 'Web Application', 'Encrypted Web Attack Surface', 
                       'Even with TLS, web applications present a significant attack surface for application-level vulnerabilities.', 
                       'Ensure robust application security practices, patch frameworks, and deploy a WAF.')
        elif service in ['pop3', 'pop3s'] or port in [110, 995]:
            add_threat(port, service, product, version, 'Medium', 'Mail Service', 'Potential POP3 Credential Exposure', 
                       'POP3 services can be targeted for brute-force attacks and credential exposure if TLS is not enforced.', 
                       'Enforce TLS connections, use strong authentication policies, and limit exposure.')
        elif service in ['imap', 'imaps'] or port in [143, 993]:
            add_threat(port, service, product, version, 'Medium', 'Mail Service', 'Potential IMAP Credential Exposure', 
                       'IMAP services face similar brute-force and credential exposure risks as POP3.', 
                       'Enforce TLS connections, use strong authentication policies, and limit exposure.')
        elif service in ['mysql', 'postgresql', 'mongodb', 'redis'] or port in [3306, 5432, 27017, 6379]:
            add_threat(port, service, product, version, 'High', 'Database', 'Direct Database Exposure', 
                       'Exposing database services directly to untrusted networks increases the risk of unauthorized access and data breaches.', 
                       'Restrict access to trusted internal networks or specific IP addresses using firewalls.')
        else:
            add_threat(port, service, product, version, 'Informational', 'Generic Service', 'Service Identified', 
                       'Service identified, but no service-specific threat profile is available.', 
                       'Review the necessity of exposing this service and ensure it is updated and securely configured.')
                       
        if version != 'Unknown':
            if has_cves:
                version_desc = 'Software version is visible. Please reference the CVE findings in this report for specific vulnerabilities associated with this component.'
            else:
                version_desc = 'Software version is visible. No CVEs were identified in the uploaded scanner report for this component.'
                
            add_threat(port, service, product, version, 'Informational', 'Software Version', 'Version / Software Risk', 
                       version_desc, 
                       'Ensure the software is patched to the latest stable release. Monitor for newly discovered vulnerabilities.')

    return {
        'total_threats': len(threats),
        'highest_severity': highest_severity_str if threats else 'Informational',
        'services_analyzed': services_analyzed,
        'threats': threats
    }
