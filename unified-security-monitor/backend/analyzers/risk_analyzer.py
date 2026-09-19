def calculate_risk(json_data, port_analysis, threat_analysis_data):
    """
    Calculates overall security risk, attack surface, priority findings, and recommendations.
    """
    score = 0
    score_breakdown = []
    
    cve_data = json_data.get('cve_analysis', {})
    cve_findings = cve_data.get('findings', []) if isinstance(cve_data, dict) else []
    
    version_data = json_data.get('version_assessment', {})
    version_findings = version_data.get('outdated_software', []) if isinstance(version_data, dict) else []
    
    web_security = json_data.get('web_security', {})

    # 1. Evaluate Threats
    threat_dedup = set()
    critical_count, high_count, medium_count, low_count, info_count = 0, 0, 0, 0, 0
    
    for threat in threat_analysis_data.get('threats', []):
        # Count for distribution
        sev = threat['severity'].lower()
        if sev == 'critical': critical_count += 1
        elif sev == 'high': high_count += 1
        elif sev == 'medium': medium_count += 1
        elif sev == 'low': low_count += 1
        elif sev == 'informational': info_count += 1
        
        # Scoring
        dedup_key = f"threat_{threat['port']}_{threat['threat_type']}"
        if dedup_key not in threat_dedup:
            threat_dedup.add(dedup_key)
            if sev == 'critical':
                score += 25
                score_breakdown.append({'category': 'Threat', 'points': 25, 'reason': f"Critical threat on port {threat['port']}: {threat['title']}"})
            elif sev == 'high':
                score += 15
                score_breakdown.append({'category': 'Threat', 'points': 15, 'reason': f"High threat on port {threat['port']}: {threat['title']}"})
            elif sev == 'medium':
                score += 8
                score_breakdown.append({'category': 'Threat', 'points': 8, 'reason': f"Medium threat on port {threat['port']}: {threat['title']}"})
            elif sev == 'low':
                score += 3
                score_breakdown.append({'category': 'Threat', 'points': 3, 'reason': f"Low threat on port {threat['port']}: {threat['title']}"})
            elif sev == 'informational':
                score += 1
                score_breakdown.append({'category': 'Threat', 'points': 1, 'reason': f"Informational finding on port {threat['port']}"})

    # 2. Evaluate CVEs
    cve_dedup = set()
    for cve in cve_findings:
        cve_id = cve.get('cve_id', 'Unknown')
        if cve_id in cve_dedup: continue
        cve_dedup.add(cve_id)
        
        sev = cve.get('severity', '').lower()
        if sev == 'critical':
            score += 20
            score_breakdown.append({'category': 'CVE', 'points': 20, 'reason': f"Critical CVE identified: {cve_id}"})
        elif sev == 'high':
            score += 12
            score_breakdown.append({'category': 'CVE', 'points': 12, 'reason': f"High CVE identified: {cve_id}"})
        elif sev == 'medium':
            score += 6
            score_breakdown.append({'category': 'CVE', 'points': 6, 'reason': f"Medium CVE identified: {cve_id}"})
        elif sev in ['low', 'informational']:
            score += 2
            score_breakdown.append({'category': 'CVE', 'points': 2, 'reason': f"Low CVE identified: {cve_id}"})

    # 3. Evaluate Outdated Software
    for soft in version_findings:
        soft_name = soft.get('software', 'Unknown')
        risk = soft.get('risk_level', '').lower()
        if risk == 'high':
            score += 10
            score_breakdown.append({'category': 'Outdated Software', 'points': 10, 'reason': f"High-risk outdated software: {soft_name}"})
        elif risk == 'medium':
            score += 5
            score_breakdown.append({'category': 'Outdated Software', 'points': 5, 'reason': f"Medium-risk outdated software: {soft_name}"})
            
    # 4. Evaluate Exposed Services
    ports = port_analysis.get('ports', [])
    for p in ports:
        score += 1
        score_breakdown.append({'category': 'Service Exposure', 'points': 1, 'reason': f"Exposed service on port {p.get('port')}"})

    # Final Score Cap
    if score > 100:
        score = 100

    if score < 20:
        overall_risk = "Low"
    elif score < 40:
        overall_risk = "Moderate"
    elif score < 70:
        overall_risk = "High"
    else:
        overall_risk = "Critical"

    # Attack Surface
    remote_access_count, web_count, mail_count, db_count, other_count = 0, 0, 0, 0, 0
    unique_services = set()
    unique_products = set()

    for p in ports:
        srv = p.get('service', '').lower()
        prod = p.get('product', '').lower()
        
        if srv and srv != 'unknown':
            unique_services.add(srv)
        if prod and prod != 'unknown':
            unique_products.add(prod)
            
        if srv in ['ssh', 'telnet', 'rdp', 'vnc'] or 'remote' in srv:
            remote_access_count += 1
        elif srv in ['http', 'https', 'ssl/http', 'www'] or 'web' in srv:
            web_count += 1
        elif srv in ['smtp', 'pop3', 'imap', 'imaps', 'pop3s', 'smtps'] or 'mail' in srv:
            mail_count += 1
        elif srv in ['mysql', 'mariadb', 'postgresql', 'mongodb', 'redis', 'mssql', 'oracle'] or 'sql' in srv:
            db_count += 1
        else:
            other_count += 1

    attack_surface = {
        'total_open_ports': len(ports),
        'unique_services': len(unique_services),
        'unique_products': len(unique_products),
        'web_services': web_count,
        'remote_access_services': remote_access_count,
        'mail_services': mail_count,
        'database_services': db_count,
        'other_services': other_count
    }

    # Priority Findings
    priority_candidates = []
    
    # 1. Add CVEs
    sev_map = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'informational': 0}
    for cve in cve_findings:
        priority_candidates.append({
            'rank_score': sev_map.get(cve.get('severity', '').lower(), 0) * 10 + 9, # CVEs rank highest
            'port': '-',
            'service': cve.get('component', 'Unknown'),
            'product': cve.get('component', 'Unknown'),
            'severity': cve.get('severity', 'High'),
            'title': f"CVE Identified: {cve.get('cve_id', 'Unknown')}",
            'reason': 'A known vulnerability was detected for this component.'
        })

    # 2. Add Threats
    for threat in threat_analysis_data.get('threats', []):
        priority_candidates.append({
            'rank_score': sev_map.get(threat['severity'].lower(), 0) * 10 + 5,
            'port': threat['port'],
            'service': threat['service'],
            'product': threat['product'],
            'severity': threat['severity'],
            'title': threat['title'],
            'reason': 'The service is externally exposed according to the uploaded report.'
        })

    # Sort candidates
    priority_candidates.sort(key=lambda x: x['rank_score'], reverse=True)
    priority_findings = []
    
    # Take top 5 and add rank
    for idx, candidate in enumerate(priority_candidates[:5]):
        candidate['rank'] = idx + 1
        del candidate['rank_score']
        priority_findings.append(candidate)

    # Recommendations
    rec_candidates = {}
    for threat in threat_analysis_data.get('threats', []):
        rec_text = threat['recommendation']
        if rec_text not in rec_candidates:
            rec_candidates[rec_text] = {
                'severity': threat['severity'],
                'title': threat['threat_type'],
                'recommendation': rec_text,
                'related_ports': set([threat['port']]),
                'sev_score': sev_map.get(threat['severity'].lower(), 0)
            }
        else:
            rec_candidates[rec_text]['related_ports'].add(threat['port'])
            # Upgrade severity if higher
            curr_score = sev_map.get(rec_candidates[rec_text]['severity'].lower(), 0)
            new_score = sev_map.get(threat['severity'].lower(), 0)
            if new_score > curr_score:
                rec_candidates[rec_text]['severity'] = threat['severity']
                rec_candidates[rec_text]['sev_score'] = new_score

    rec_list = list(rec_candidates.values())
    rec_list.sort(key=lambda x: x['sev_score'], reverse=True)
    
    recommendations = []
    for idx, rec in enumerate(rec_list[:8]):
        recommendations.append({
            'priority': idx + 1,
            'severity': rec['severity'],
            'title': rec['title'],
            'recommendation': rec['recommendation'],
            'related_ports': list(rec['related_ports'])
        })

    risk_summary = {
        'overall_risk': overall_risk,
        'risk_score': score,
        'score_basis': 'Calculated from exposed services, threats, and CVEs',
        'exposed_ports': len(ports),
        'services_count': len(unique_services),
        'threat_count': len(threat_analysis_data.get('threats', [])),
        'critical_count': critical_count,
        'high_count': high_count,
        'medium_count': medium_count,
        'low_count': low_count,
        'informational_count': info_count,
        'cve_count': len(cve_findings),
        'outdated_software_count': len(version_findings),
        'affected_services': len(set([p.get('service') for p in ports if p.get('service')]))
    }

    return {
        'risk_summary': risk_summary,
        'score_breakdown': score_breakdown,
        'attack_surface': attack_surface,
        'priority_findings': priority_findings,
        'recommendations': recommendations
    }

def analyze_risk(report_data):
    """
    Phase 5: Dynamic Security Risk Assessment Engine
    Derives risk completely dynamically from the JSON report without hardcoded service mappings.
    """
    score = 0
    cve_findings = report_data.get('cve_analysis', {}).get('findings', []) if isinstance(report_data.get('cve_analysis'), dict) else []
    version_data = report_data.get('version_assessment', {})
    if isinstance(version_data, dict):
        version_assessments = version_data.get('outdated_software', [])
    elif isinstance(version_data, list):
        version_assessments = version_data
    else:
        version_assessments = []
        
    web_security = report_data.get('web_security', {})
    port_scan = report_data.get('ports', [])
    
    priority_findings = []
    service_risk_map = {}
    recommendations_set = set()
    recommendations = []
    
    severity_weights = {'Critical': 25, 'High': 15, 'Medium': 8, 'Low': 3, 'Informational': 0}
    severity_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'Informational': 0}
    
    # 1. Process explicit CVE findings dynamically
    for cve in cve_findings:
        sev = str(cve.get('severity', 'Medium')).capitalize()
        if sev not in severity_counts: sev = 'Medium'
        
        cve_id = cve.get('cve_id', 'Unknown CVE')
        product = cve.get('component', cve.get('product', 'Unknown Component'))
        desc = cve.get('description', 'No description available.')
        rec = cve.get('recommendation', 'Apply vendor patches.')
        
        severity_counts[sev] += 1
        score += severity_weights.get(sev, 0)
        
        priority_findings.append({
            'title': f'Vulnerability: {cve_id}',
            'severity': sev,
            'priority': severity_weights.get(sev, 0),
            'source': 'cve_analysis',
            'affected_component': product,
            'port': 'Multiple/Unknown',
            'description': desc,
            'evidence': f'Found in CVE analysis for {product}',
            'recommendation': rec
        })
        
        if rec not in recommendations_set:
            recommendations_set.add(rec)
            recommendations.append({'severity': sev, 'priority': severity_weights.get(sev, 0), 'text': rec})
            
    # 2. Process Version Assessment dynamically
    for sw in version_assessments:
        status = str(sw.get('status', '')).lower()
        risk = str(sw.get('risk', '')).lower()
        
        if status == 'outdated' or risk in ['high', 'medium', 'critical']:
            sev = 'High' if risk in ['high', 'critical'] else 'Medium'
            severity_counts[sev] += 1
            score += severity_weights.get(sev, 0)
            
            product = sw.get('product', 'Unknown Software')
            ver = sw.get('detected_version', 'Unknown')
            rec = sw.get('recommendation', 'Update software to supported version.')
            
            priority_findings.append({
                'title': f'Outdated Component: {product}',
                'severity': sev,
                'priority': severity_weights.get(sev, 0),
                'source': 'version_assessment',
                'affected_component': f'{product} v{ver}',
                'port': 'Multiple/Unknown',
                'description': f'Running unsupported/outdated version of {product}.',
                'evidence': 'Explicitly flagged as outdated in version assessment.',
                'recommendation': rec
            })
            
            if rec not in recommendations_set:
                recommendations_set.add(rec)
                recommendations.append({'severity': sev, 'priority': severity_weights.get(sev, 0), 'text': rec})

    # 3. Process Web Security dynamically
    if isinstance(web_security, dict) and web_security:
        web_risk_str = str(web_security.get('risk_level', '')).capitalize()
        if web_risk_str in severity_counts:
            sev = web_risk_str
        else:
            sev = 'Medium' if web_security.get('vulnerabilities') else 'Informational'
            
        if sev != 'Informational':
            severity_counts[sev] += 1
            score += severity_weights.get(sev, 0)
            
            vulns = web_security.get('vulnerabilities', [])
            if vulns:
                for v in vulns:
                    desc = v.get('description', 'Web vulnerability')
                    rec = v.get('recommendation', 'Review web configuration.')
                    vsev = str(v.get('severity', sev)).capitalize()
                    
                    priority_findings.append({
                        'title': f'Web Security: {v.get("type", "Vulnerability")}',
                        'severity': vsev if vsev in severity_counts else sev,
                        'priority': severity_weights.get(vsev if vsev in severity_counts else sev, 0),
                        'source': 'web_security',
                        'affected_component': 'Web Server',
                        'port': '443/80',
                        'description': desc,
                        'evidence': 'Detected in web security scan.',
                        'recommendation': rec
                    })
                    
                    if rec not in recommendations_set:
                        recommendations_set.add(rec)
                        recommendations.append({'severity': vsev if vsev in severity_counts else sev, 'priority': severity_weights.get(vsev if vsev in severity_counts else sev, 0), 'text': rec})
    
    # 4. Process Port Scan & Service mapping
    for p in port_scan:
        if p.get('state') == 'open':
            port = p.get('port')
            service = p.get('service', 'unknown')
            product = p.get('product', 'unknown')
            version = p.get('version', 'unknown')
            
            # Map back priority findings port if possible
            for pf in priority_findings:
                if product.lower() != 'unknown' and product.lower() in pf['affected_component'].lower():
                    pf['port'] = str(port)
                elif service.lower() != 'unknown' and service.lower() in pf['affected_component'].lower():
                    pf['port'] = str(port)
                    
            # Build service risk dynamically
            s_risk = 'Informational'
            reasons = []
            sources = ['port_scan']
            
            # Check if this port is tied to findings
            for pf in priority_findings:
                if str(pf['port']) == str(port) or (product != 'unknown' and product.lower() in pf['affected_component'].lower()):
                    if severity_weights.get(pf['severity'], 0) > severity_weights.get(s_risk, 0):
                        s_risk = pf['severity']
                    reasons.append(pf['title'])
                    if pf['source'] not in sources:
                        sources.append(pf['source'])
                        
            if s_risk == 'Informational':
                s_risk = 'Low'
                reasons = ['Exposed service providing attack surface.']
                score += 1
                
            service_risk_map[str(port)] = {
                'port': port,
                'service': service,
                'product': product,
                'version': version,
                'risk_level': s_risk,
                'risk_reason': ', '.join(reasons[:2]) + ('...' if len(reasons) > 2 else ''),
                'evidence_sources': sources
            }
            
    # Calculate Final Risk & Explanations
    final_score = min(100, score)
    
    overall_risk = 'Low'
    if final_score >= 70: overall_risk = 'Critical'
    elif final_score >= 40: overall_risk = 'High'
    elif final_score >= 20: overall_risk = 'Medium'
    
    explanation_parts = []
    if len(cve_findings) > 0:
        explanation_parts.append(f"{len(cve_findings)} CVE findings")
    if len(version_assessments) > 0:
        explanation_parts.append(f"{len(version_assessments)} outdated software components")
    if isinstance(web_security, dict) and web_security.get('vulnerabilities'):
        explanation_parts.append(f"{len(web_security['vulnerabilities'])} web security issues")
        
    if explanation_parts:
        explanation = f"Risk is derived dynamically because the report explicitly contains {', '.join(explanation_parts)}."
    elif port_scan:
        explanation = f"The report contains no identified vulnerabilities, but identifies {len(port_scan)} exposed services contributing to the attack surface."
    else:
        explanation = "The report contains no actionable evidence or exposed services."

    # Sort priorities
    priority_findings.sort(key=lambda x: x['priority'], reverse=True)
    recommendations.sort(key=lambda x: x['priority'], reverse=True)
    
    # Cap findings at 10 for UI scale
    priority_findings = priority_findings[:10]
    recommendations = recommendations[:10]

    return {
        'overall_risk': overall_risk,
        'risk_score': final_score,
        'explanation': explanation,
        'severity_summary': severity_counts,
        'attack_surface_ports': sum(1 for p in port_scan if p.get('state') == 'open'),
        'priority_findings': priority_findings,
        'service_risk': list(service_risk_map.values()),
        'recommendations': recommendations
    }
