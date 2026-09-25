from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import datetime
import json
import time

# Import scanners from vulnerable_scan
from scanner.network_scanner import scan_target
from scanner.web_security_checker import check_web_security
from scanner.version_checker import check_versions
from scanner.cve_checker import check_cves
from scanner.report_generator import generate_pdf_report, generate_json_report

# Import analyzers from attack_check (they were moved to analyzers package)
from analyzers.attack_analyzer import analyze_attacks
from analyzers.risk_analyzer import analyze_risk
from analyzers.threat_analyzer import analyze_threats

app = Flask(__name__)
CORS(app)

HISTORY_FILE = os.path.join("reports", "history.json")

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history: {e}")
    return []

def save_history(history):
    os.makedirs("reports", exist_ok=True)
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f)
    except Exception as e:
        print(f"Error saving history: {e}")

scans_history = load_history()
scan_results_map = {s["scan_id"]: s for s in scans_history if "scan_id" in s}

@app.route("/api/dashboard/summary", methods=["GET"])
def dashboard_summary():
    if not scans_history:
        return jsonify({
            "has_data": False,
            "assets_count": 0,
            "open_ports": 0,
            "services_detected": 0,
            "vulnerabilities": 0,
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "risk_level": "None"
        })
    
    # Aggregate data from the latest scan or all scans
    latest_scan = scans_history[-1]
    
    total_ports = len(latest_scan.get("ports", []))
    total_services = sum(1 for p in latest_scan.get("ports", []) if p.get("service") and p.get("service") != "unknown")
    
    cves = latest_scan.get("cve_analysis", {}).get("findings", [])
    vulns = len(cves)
    
    # This is a simplified risk calculation, real implementation uses risk_analyzer
    return jsonify({
        "has_data": True,
        "assets_count": 1,
        "open_ports": total_ports,
        "services_detected": total_services,
        "vulnerabilities": vulns,
        "critical": sum(1 for c in cves if c.get("severity") == "CRITICAL"),
        "high": sum(1 for c in cves if c.get("severity") == "HIGH"),
        "medium": sum(1 for c in cves if c.get("severity") == "MEDIUM"),
        "low": sum(1 for c in cves if c.get("severity") == "LOW"),
        "risk_level": latest_scan.get("risk_analysis", {}).get("overall_risk", "None"),
        "target": latest_scan.get("target"),
        "status": "online" if total_ports > 0 else "offline",
        "last_scan": latest_scan.get("scan_time")
    })

@app.route("/api/scans", methods=["POST"])
def scan():
    data = request.get_json()
    target = data.get("target", "").strip()
    scan_mode = data.get("scan_mode", "full").strip().lower()

    if not target:
        return jsonify({"error": "No target provided."}), 400

    scan_id = str(uuid.uuid4())
    scan_time = datetime.datetime.now().isoformat()
    assessment_start = time.time()

    # 1. Vulnerability Scan
    result = scan_target(target, scan_mode=scan_mode)
    if "error" in result:
        return jsonify(result), 500

    result["available"] = True
    result["scan_mode"] = scan_mode
    result["scan_id"] = scan_id
    result["scan_time"] = scan_time

    # Backend-measured end-to-end assessment duration.
    result["scan_duration"] = round(
        time.time() - assessment_start, 2
    )

    # 2. Add offline versions and CVEs
    version_results = check_versions(result.get("ports", []))
    result["version_assessment"] = version_results
    
    cve_results = check_cves(result.get("ports", []))
    result["cve_analysis"] = cve_results
    
    # 3. Add web security check if needed
    if scan_mode == "full":
        web_ports_open = any(p["port"] in [80, 443] for p in result.get("ports", []))
        if web_ports_open:
            web_security = check_web_security(target)
            if web_security:
                result["web_security"] = web_security

    # 4. Integrate Attack Check (Analyzers)
    # The analyzers expect a specific input format, we can adapt the result
    analysis_input = {
        "target": target,
        "scan_data": result
    }
    
    try:
        attack_analysis = analyze_attacks(result, cve_results, version_results, result.get("web_security", {}))
        result["attack_analysis"] = attack_analysis
        
        threat_analysis = analyze_threats(result, cve_results)
        result["threat_analysis"] = threat_analysis
        
        risk_analysis = analyze_risk(result)
        result["risk_analysis"] = risk_analysis
        
        # 5. Generate dynamic Offense and Defense profiles
        from analyzers.service_profiler import generate_offense_defense
        offense_profile, defense_profile = generate_offense_defense(result.get("ports", []), cve_results.get("findings", []))
        result["offense"] = offense_profile
        result["defense"] = defense_profile
        
    except Exception as e:
        print(f"Analysis error: {e}")
        # Continue even if analyzers fail, to not lose scan data
        pass

    # Save to history
    scans_history.append(result)
    scan_results_map[scan_id] = result
    save_history(scans_history)

    return jsonify(result)

@app.route("/api/scans/latest", methods=["GET"])
def get_latest_scan():
    if not scans_history:
        return jsonify({"error": "No assessments found"}), 404
    return jsonify(scans_history[-1])

@app.route("/api/scans/<scan_id>", methods=["GET"])
def get_scan(scan_id):
    if scan_id not in scan_results_map:
        return jsonify({"error": "Assessment not found"}), 404
    return jsonify(scan_results_map[scan_id])

@app.route("/api/scans", methods=["GET"])
def get_scans():
    # Return brief info for scan history list
    history_list = []
    for s in scans_history:
        history_list.append({
            "scan_id": s.get("scan_id"),
            "target": s.get("target"),
            "scan_mode": s.get("scan_mode"),
            "scan_time": s.get("scan_time"),
            "ports": len(s.get("ports", [])),
            "vulnerabilities": len(s.get("cve_analysis", {}).get("findings", [])),
            "risk_score": s.get("risk_analysis", {}).get("risk_score", 0)
        })
    return jsonify(history_list)

@app.route("/api/assets", methods=["GET"])
def get_assets():
    if not scans_history:
        return jsonify([])
        
    assets_map = {}
    
    # Process history chronologically so latest scan overwrites older ones for the same target
    for s in scans_history:
        target = s.get("target")
        ports = s.get("ports", [])
        total_ports = len(ports)
        services = set()
        for p in ports:
            if p.get("service") and p.get("service") != "unknown":
                services.add(p.get("service"))
                
        cves = s.get("cve_analysis", {}).get("findings", [])
        risk = s.get("risk_analysis", {}).get("overall_risk", "None")
        
        assets_map[target] = {
            "target": target,
            "status": "online" if total_ports > 0 else "offline",
            "open_ports": total_ports,
            "services": list(services),
            "vulnerabilities": len(cves),
            "risk_level": risk,
            "last_scan": s.get("scan_time")
        }
        
    return jsonify(list(assets_map.values()))

@app.route("/api/findings", methods=["GET"])
def get_findings():
    if not scans_history:
        return jsonify([])
        
    latest_scan = scans_history[-1]
    findings = []
    
    # Parse CVEs into findings table format
    cve_findings = latest_scan.get("cve_analysis", {}).get("findings", [])
    for cve in cve_findings:
        findings.append({
            "port": cve.get("port"),
            "service": cve.get("service"),
            "version": cve.get("version"),
            "severity": cve.get("severity"),
            "impact": "Potential vulnerability",
            "source": "CVE Checker",
            "cves": cve.get("cves", [])
        })
        
    # Attack surface findings
    attack_findings = latest_scan.get("attack_analysis", {}).get("findings", [])
    for f in attack_findings:
        findings.append({
            "port": "N/A",
            "service": "Platform",
            "version": "N/A",
            "severity": f.get("severity", "Medium"),
            "impact": f.get("impact", "Unknown"),
            "source": "Attack Analyzer",
            "cves": []
        })

    return jsonify(findings)

@app.route("/api/reports/pdf", methods=["POST"])
def report_pdf():
    data = request.get_json()
    scan_id = data.get("scan_id")
    
    if not scan_id or scan_id not in scan_results_map:
        return jsonify({"error": "Invalid or missing scan_id."}), 400
        
    scan_data = scan_results_map[scan_id]

    try:
        filepath = generate_pdf_report(scan_data, scan_data.get("scan_time"))
        return send_file(
            filepath,
            as_attachment=True,
            mimetype="application/pdf",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"PDF generation failed: {str(e)}")
        return jsonify({"error": "PDF generation failed. Please check the backend report service."}), 500

if __name__ == "__main__":
    # Ensure reports directory exists
    os.makedirs("reports", exist_ok=True)
    app.run(debug=True, port=8000)
