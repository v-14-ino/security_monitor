def analyze_attacks(port_analysis_data, cve_analysis_data, version_assessment_data, web_security_data):
    """
    Dynamically determine potential security threats and attack categories 
    associated with each exposed service.
    """
    if not port_analysis_data.get('available', False):
        return {
            'summary': {
                'total_ports': 0,
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0,
                'informational': 0
            },
            'services': []
        }

    ports = port_analysis_data.get('ports', [])
    cve_findings = []
    if cve_analysis_data and isinstance(cve_analysis_data, dict):
        cve_findings = cve_analysis_data.get('findings', [])

    summary = {
        'total_ports': len(ports),
        'critical': 0,
        'high': 0,
        'medium': 0,
        'low': 0,
        'informational': 0
    }
    
    services_analysis = []
    
    sev_rank = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'informational': 0}

    for entry in ports:
        port = entry.get('port', 0)
        service = str(entry.get('service', '')).lower()
        product = str(entry.get('product', 'Unknown'))
        version = str(entry.get('version', 'Unknown'))
        
        # Match CVEs for this port/service
        matched_cves = []
        for cve in cve_findings:
            # Simplistic matching: if cve component name is in product or service
            cve_comp = str(cve.get('component', '')).lower()
            if cve_comp and (cve_comp in product.lower() or cve_comp in service.lower()):
                matched_cves.append(cve)
                
        threats = []
        recommendations = []
        base_risk_level = 'Informational'
        
        def add_threat(name, severity, description, reason):
            threats.append({
                'name': name,
                'severity': severity,
                'description': description,
                'reason': reason
            })
            
        def update_risk(severity):
            nonlocal base_risk_level
            if sev_rank.get(severity.lower(), 0) > sev_rank.get(base_risk_level.lower(), 0):
                base_risk_level = severity.capitalize()

        if service == 'unknown' and product.lower() == 'unknown':
            base_risk_level = 'Informational'
            add_threat('Unknown Service Exposure', 'Informational', 'Service identification is unavailable. The report does not contain enough information to determine service-specific threats.', 'Unknown exposed service should be investigated and identified.')
            recommendations.append('Investigate and identify the unknown service running on this port.')
        elif service in ['ftp'] or port == 21:
            update_risk('High')
            add_threat('Credential Attacks', 'High', 'Brute-force and credential stuffing attacks.', 'Service allows authentication.')
            add_threat('Cleartext Credential Exposure', 'High', 'Data transmitted in cleartext can be intercepted.', 'FTP protocol lacks native encryption.')
            add_threat('Anonymous Access Risk', 'Medium', 'Potential unauthorized file access.', 'FTP often allows anonymous logins.')
            recommendations.append('Migrate to SFTP or FTPS. Disable anonymous access.')
        elif service in ['ssh'] or port == 22:
            update_risk('Medium')
            add_threat('Credential Attacks', 'High', 'Brute-force authentication attempts.', 'SSH is a remote administration protocol.')
            add_threat('SSH Misconfiguration', 'Medium', 'Weak ciphers or root login exposure.', 'Default configurations may be insecure.')
            recommendations.append('Enforce key-based authentication, disable root login, and restrict access.')
        elif service in ['telnet'] or port == 23:
            update_risk('Critical')
            add_threat('Cleartext Credential Exposure', 'Critical', 'Full compromise of credentials over network.', 'Telnet transmits all data in cleartext.')
            recommendations.append('Disable Telnet entirely and replace with SSH.')
        elif service in ['smtp'] or port in [25, 465, 587]:
            update_risk('Medium')
            add_threat('Email Spoofing', 'Medium', 'Unauthorized sending of emails.', 'SMTP can be abused for spam if misconfigured.')
            add_threat('Open Relay Misconfiguration', 'High', 'Spam relay abuse.', 'Service might allow unauthorized mail relay.')
            recommendations.append('Ensure open relay is disabled and apply strict authentication.')
        elif service in ['domain', 'dns'] or port == 53:
            update_risk('Low')
            add_threat('DNS Amplification', 'Medium', 'Use of the server in DDoS attacks.', 'UDP-based DNS can be spoofed.')
            add_threat('Zone Transfer', 'Medium', 'Information disclosure of domain records.', 'Misconfigured zone transfers allow full record dumps.')
            recommendations.append('Disable recursive queries for untrusted networks and restrict zone transfers.')
        elif service in ['http', 'www'] or port == 80:
            update_risk('High')
            add_threat('Web Application Attacks', 'High', 'SQLi, XSS, and other OWASP Top 10 risks.', 'Web applications present a broad attack surface.')
            add_threat('Cleartext Communication', 'Medium', 'Data interception.', 'HTTP traffic is unencrypted.')
            recommendations.append('Force HTTPS redirection and deploy a Web Application Firewall (WAF).')
        elif service in ['https', 'ssl/http'] or port == 443:
            update_risk('Medium')
            add_threat('Web Application Attacks', 'High', 'SQLi, XSS, and other OWASP Top 10 risks.', 'TLS encrypts transport but not the application payload.')
            add_threat('TLS Configuration Issues', 'Low', 'Weak protocol or cipher configuration.', 'Insecure TLS settings can lead to decryption.')
            recommendations.append('Deploy a WAF and ensure strong TLS configurations (TLS 1.2+).')
        elif service in ['pop3', 'pop3s', 'imap', 'imaps'] or port in [110, 995, 143, 993]:
            update_risk('Medium')
            add_threat('Credential Attacks', 'Medium', 'Authentication attacks and exposure.', 'Mail protocols are frequent targets for credential stuffing.')
            recommendations.append('Enforce TLS and strict authentication policies.')
        elif service in ['smb', 'microsoft-ds'] or port in [139, 445]:
            update_risk('Critical')
            add_threat('Remote Code Execution', 'Critical', 'SMB is historically vulnerable to critical exploits (e.g., EternalBlue).', 'SMB exposes internal file sharing mechanisms.')
            add_threat('Information Disclosure', 'High', 'Null session enumeration.', 'Unauthenticated access can reveal shares and users.')
            recommendations.append('Block SMB at the network perimeter. Disable SMBv1.')
        elif service in ['rdp'] or port == 3389:
            update_risk('Critical')
            add_threat('Credential Attacks', 'Critical', 'High-volume brute-force and ransomware entry.', 'RDP is a primary vector for ransomware.')
            recommendations.append('Place RDP behind a VPN, enforce MFA, and restrict IP access.')
        elif service in ['mysql', 'mariadb', 'postgresql', 'mongodb', 'redis'] or port in [3306, 5432, 27017, 6379]:
            update_risk('High')
            add_threat('Unauthorized Database Access', 'Critical', 'Direct exposure of sensitive data.', 'Databases should not be exposed to untrusted networks.')
            add_threat('Authentication Attacks', 'High', 'Brute-force credential guessing.', 'Exposed authentication interfaces.')
            recommendations.append('Restrict database access to trusted internal networks only.')
        else:
            update_risk('Low')
            add_threat('Generic Service Exposure', 'Low', 'Potential attack surface for an identified service.', 'Any exposed service carries some inherent risk.')
            recommendations.append('Review the necessity of exposing this service.')
            
        if version != 'Unknown':
            if matched_cves:
                update_risk('Critical')
                add_threat('Known Vulnerability Exposure', 'Critical', 'The detected version matches known CVEs.', 'Software has documented security flaws.')
                recommendations.append('Upgrade the software to a patched version immediately.')
            else:
                add_threat('Outdated Software Risk', 'Informational', 'The detected version may contain undocumented security weaknesses.', 'Software versions age over time.')
                recommendations.append('Ensure the software is actively supported and updated.')

        # Factor in highest CVE severity for risk level
        for cve in matched_cves:
            cve_sev = cve.get('severity', 'High')
            update_risk(cve_sev)
            
        # Tally summary
        summary[base_risk_level.lower()] += 1
        
        services_analysis.append({
            'port': port,
            'service': entry.get('service', 'Unknown'),
            'product': product,
            'version': version,
            'risk_level': base_risk_level,
            'threats': threats,
            'cves': matched_cves,
            'recommendations': recommendations
        })
        
    return {
        'summary': summary,
        'services': services_analysis
    }
