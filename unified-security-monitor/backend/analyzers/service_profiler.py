# service_profiler.py

SERVICE_PROFILES = {
    'ssh': {
        'offense_scenario': {
            'title': 'Remote Access Abuse Scenario',
            'steps': [
                'Service discovery',
                'Remote-access surface identified',
                'Authentication targeted',
                'Repeated/abnormal authentication activity',
                'Potential unauthorized access',
                'Potential account/system compromise'
            ],
            'impacts': [
                'Unauthorized remote access',
                'Account compromise',
                'System exposure'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'SSH authentication logs',
                'Failed login attempts',
                'Successful login events',
                'Unexpected source addresses',
                'Unusual login times',
                'Privileged account activity'
            ],
            'detect': [
                'Repeated failed authentication',
                'Unexpected successful authentication',
                'New/unusual source',
                'Abnormal login pattern'
            ],
            'prevent': [
                'Restrict SSH network exposure',
                'Use strong authentication',
                'Use key-based authentication where appropriate',
                'Keep SSH software updated'
            ],
            'respond': [
                'Review authentication logs',
                'Identify affected account/source',
                'Restrict suspicious access',
                'Investigate the event'
            ]
        }
    },
    'http': {
        'offense_scenario': {
            'title': 'Web Application Abuse Scenario',
            'steps': [
                'Web service discovered',
                'Web application attack surface identified',
                'Application/request behavior becomes relevant',
                'Potential application-layer abuse',
                'Potential information disclosure or application compromise'
            ],
            'impacts': [
                'Application exposure',
                'Information disclosure',
                'Unauthorized application activity'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'Web access logs',
                'Request patterns',
                'HTTP status codes',
                'Unusual request rates',
                'Administrative endpoints',
                'Server errors'
            ],
            'detect': [
                'Abnormal request patterns',
                'Unexpected request spikes',
                'Repeated suspicious requests',
                'Unusual source behavior'
            ],
            'prevent': [
                'Use HTTPS where appropriate',
                'Harden web server',
                'Apply application security controls',
                'Keep web server software updated'
            ],
            'respond': [
                'Review web logs',
                'Identify affected endpoint',
                'Investigate abnormal traffic',
                'Apply remediation'
            ]
        }
    },
    'https': {
        'offense_scenario': {
            'title': 'Secure Web Application Abuse Scenario',
            'steps': [
                'HTTPS service discovered',
                'Web application attack surface identified',
                'TLS/application configuration becomes relevant',
                'Potential application-layer abuse',
                'Potential data/application exposure'
            ],
            'impacts': [
                'Application compromise',
                'Information disclosure',
                'TLS/configuration exposure'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'HTTPS requests',
                'TLS certificate status',
                'TLS configuration',
                'Web application logs',
                'Abnormal request patterns'
            ],
            'detect': [
                'Certificate problems',
                'Unexpected TLS configuration',
                'Abnormal application activity',
                'Unusual request patterns'
            ],
            'prevent': [
                'Maintain valid certificates',
                'Use secure TLS configuration',
                'Harden web services',
                'Keep software updated'
            ],
            'respond': [
                'Review application/TLS logs',
                'Investigate abnormal traffic',
                'Correct configuration issues'
            ]
        }
    },
    'ftp': {
        'offense_scenario': {
            'title': 'File Transfer Abuse Scenario',
            'steps': [
                'FTP service discovered',
                'File-transfer surface identified',
                'Authentication/file access becomes relevant',
                'Potential unauthorized file access',
                'Potential data exposure'
            ],
            'impacts': [
                'File exposure',
                'Credential exposure',
                'Unauthorized file access'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'FTP authentication',
                'File-transfer activity',
                'Anonymous access attempts',
                'Large/unusual transfers'
            ],
            'detect': [
                'Repeated failed logins',
                'Unexpected file transfers',
                'Anonymous access',
                'Unusual transfer patterns'
            ],
            'prevent': [
                'Disable unnecessary FTP',
                'Restrict network access',
                'Use secure alternatives where appropriate',
                'Monitor file access'
            ],
            'respond': [
                'Review transfer logs',
                'Restrict suspicious access',
                'Investigate affected accounts/files'
            ]
        }
    },
    'database': {
        'offense_scenario': {
            'title': 'Database Exposure Scenario',
            'steps': [
                'Database service discovered',
                'Database network exposure identified',
                'Authentication/access controls become relevant',
                'Potential unauthorized database access',
                'Potential sensitive-data exposure'
            ],
            'impacts': [
                'Sensitive data exposure',
                'Unauthorized database access',
                'Database compromise'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'Database authentication',
                'Database connections',
                'Query activity',
                'Failed authentication',
                'Administrative activity'
            ],
            'detect': [
                'Repeated failed logins',
                'Unexpected source systems',
                'Unusual connection patterns',
                'Unexpected administrative activity'
            ],
            'prevent': [
                'Restrict database network exposure',
                'Use strong authentication',
                'Patch database software',
                'Limit privileges'
            ],
            'respond': [
                'Review database logs',
                'Identify source',
                'Restrict suspicious access',
                'Investigate affected account'
            ]
        }
    },
    'dns': {
        'offense_scenario': {
            'title': 'DNS Abuse Scenario',
            'steps': [
                'DNS service discovered',
                'DNS service becomes an information/exposure surface',
                'Configuration/query behavior becomes relevant',
                'Potential information disclosure or service abuse'
            ],
            'impacts': [
                'Information disclosure',
                'DNS service exposure'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'DNS queries',
                'Zone transfer requests',
                'Unusual query volumes',
                'Source IP patterns'
            ],
            'detect': [
                'Unauthorized zone transfer attempts',
                'Query flooding',
                'Unexpected internal record requests'
            ],
            'prevent': [
                'Restrict Zone Transfers',
                'Rate limit queries',
                'Separate internal/external DNS'
            ],
            'respond': [
                'Review DNS query logs',
                'Block abusive source IPs',
                'Correct misconfigurations'
            ]
        }
    },
    'rdp': {
        'offense_scenario': {
            'title': 'Remote Desktop Abuse Scenario',
            'steps': [
                'Remote Desktop service discovered',
                'Remote-access surface identified',
                'Authentication becomes relevant',
                'Potential unauthorized remote access',
                'Potential system exposure'
            ],
            'impacts': [
                'Unauthorized remote access',
                'Account compromise',
                'System exposure'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'RDP logins',
                'Outside of business hours access',
                'Source IP addresses',
                'Failed authentication attempts'
            ],
            'detect': [
                'Brute force login attempts',
                'Unexpected successful logins',
                'Unusual geographical sources'
            ],
            'prevent': [
                'Require VPN access',
                'Enable Network Level Authentication (NLA)',
                'Enforce strong passwords/MFA'
            ],
            'respond': [
                'Investigate unauthorized logins immediately',
                'Terminate suspicious sessions',
                'Review system logs for post-exploitation'
            ]
        }
    },
    'smb': {
        'offense_scenario': {
            'title': 'SMB / Network Share Abuse Scenario',
            'steps': [
                'SMB service discovered',
                'Windows file/network service exposure identified',
                'Authentication and access controls become relevant',
                'Potential unauthorized resource access',
                'Potential lateral-movement opportunity'
            ],
            'impacts': [
                'Unauthorized resource access',
                'Sensitive file exposure',
                'Potential lateral movement'
            ]
        },
        'defense_playbook': {
            'monitor': [
                'Windows authentication events',
                'SMB connection activity',
                'File-share access',
                'Privileged account activity'
            ],
            'detect': [
                'Unusual SMB connections',
                'Unexpected source systems',
                'Repeated authentication failures',
                'Abnormal file-share activity'
            ],
            'prevent': [
                'Restrict SMB exposure',
                'Use network segmentation',
                'Limit unnecessary file sharing',
                'Keep Windows/services updated'
            ],
            'respond': [
                'Investigate source host',
                'Review authentication/file-share logs',
                'Restrict suspicious connections',
                'Assess affected systems'
            ]
        }
    }
}

# Alias mapping
SERVICE_ALIASES = {
    'mysql': 'database',
    'postgresql': 'database',
    'mssql': 'database',
    'redis': 'database',
    'mongodb': 'database',
    'domain': 'dns',
    'www': 'http',
    'ssl/http': 'https',
    'ms-wbt-server': 'rdp',
    'microsoft-ds': 'smb',
    'netbios-ssn': 'smb',
    'msrpc': 'smb'
}

def determine_risk(port_data):
    service = str(port_data.get('service', '')).lower()
    port = port_data.get('port', 0)
    
    if service in ['ssh', 'ftp', 'rdp', 'ms-wbt-server'] or port in [21, 22, 3389]:
        return 'High'
    if service in ['mysql', 'postgresql', 'mssql', 'redis', 'mongodb', 'microsoft-ds', 'netbios-ssn', 'msrpc'] or port in [3306, 5432, 1433, 6379, 27017, 135, 139, 445]:
        return 'Critical'
    if service in ['http', 'https', 'www', 'ssl/http'] or port in [80, 443, 8080, 8443]:
        return 'Medium'
    return 'Low'

def generate_offense_defense(ports, cves):
    """
    Generates intelligent dynamic OFFENSE and DEFENSE mappings based on ACTUAL open ports,
    structured as Simulated Attack Scenarios and Defensive Playbooks.
    """
    offense = {
        'exposed_services': [],
        'scenarios': [],
        'key_findings': []
    }
    
    defense = {
        'monitoring_priority': [],
        'control_coverage': 100,
        'playbooks': [],
        'response': [] # Optional, maybe kept for metrics
    }
    
    if not ports:
        return offense, defense

    identified_services = set()
    total_applicable_controls = 0
    identified_controls_count = 0
    
    seen_services = set()

    for p in ports:
        port_num = p.get('port', 0)
        protocol = 'TCP' # Assume TCP for now
        raw_service = str(p.get('service', 'unknown')).lower()
        version = p.get('version', 'Unknown')
        
        if raw_service == 'unknown':
            continue
            
        mapped_service = SERVICE_ALIASES.get(raw_service, raw_service)
        risk = determine_risk(p)
        
        identified_services.add(mapped_service)
        uniq_id = f"{port_num}-{mapped_service}"
        
        # Build exposed service entry (kept for the top table if needed)
        offense['exposed_services'].append({
            'port': port_num,
            'protocol': protocol,
            'service': raw_service.upper(),
            'version': version,
            'risk': risk
        })
        
        # Map Vulnerabilities (CVEs)
        service_cves = [c for c in cves if str(c.get('port', '')) == str(port_num) or c.get('service', '').lower() == raw_service]
        exposure_type = "Vulnerability Exposure" if service_cves else "Attack Surface Exposure"
        impact = f"{raw_service.upper()} compromise"
        
        offense['key_findings'].append({
            'port': port_num,
            'service': raw_service.upper(),
            'version': version,
            'exposure': exposure_type,
            'risk': risk,
            'impact': impact,
            'cves': len(service_cves)
        })

        if uniq_id not in seen_services:
            seen_services.add(uniq_id)
            profile = SERVICE_PROFILES.get(mapped_service, None)
            
            if profile:
                # Add scenario
                scenario = dict(profile['offense_scenario'])
                scenario['port'] = port_num
                scenario['service'] = raw_service.upper()
                scenario['risk'] = risk
                offense['scenarios'].append(scenario)
                
                # Add playbook
                playbook = dict(profile['defense_playbook'])
                playbook['port'] = port_num
                playbook['service'] = raw_service.upper()
                playbook['risk'] = risk
                defense['playbooks'].append(playbook)
                
                total_applicable_controls += len(playbook['prevent']) + len(playbook['monitor'])
                identified_controls_count += len(playbook['prevent']) + len(playbook['monitor'])
            else:
                # Generic fallback for unknown services
                offense['scenarios'].append({
                    'title': 'Unknown Service Exposure Scenario',
                    'port': port_num,
                    'service': raw_service.upper(),
                    'risk': risk,
                    'steps': [
                        'Unknown service discovered',
                        'Service network exposure identified',
                        'Potential unknown attack surface',
                        'Service-specific analysis unavailable'
                    ],
                    'impacts': [
                        'Unknown service exposure',
                        'Potential unauthorized access'
                    ]
                })
                defense['playbooks'].append({
                    'port': port_num,
                    'service': raw_service.upper(),
                    'risk': risk,
                    'monitor': ['Service network activity', 'Connection attempts'],
                    'detect': ['Unexpected connection spikes', 'Abnormal source addresses'],
                    'prevent': ['Restrict network exposure', 'Monitor traffic'],
                    'respond': ['Investigate source host', 'Block suspicious traffic']
                })
                total_applicable_controls += 2
                identified_controls_count += 2

    # Deterministic control coverage
    critical_high_cves = len([c for c in cves if c.get('severity', '').upper() in ['CRITICAL', 'HIGH']])
    coverage = 100
    if total_applicable_controls > 0:
        coverage = int((identified_controls_count / total_applicable_controls) * 100)
    
    coverage = max(0, coverage - (critical_high_cves * 5))
    defense['control_coverage'] = coverage

    # Populate Monitoring Priority
    for srv in identified_services:
        defense['monitoring_priority'].append({
            'name': f"{srv.upper()} Monitoring"
        })

    return offense, defense
