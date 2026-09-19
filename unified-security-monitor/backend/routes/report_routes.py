import json
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.json_validator import process_report
from services.threat_analyzer import analyze_threats
from services.risk_analyzer import calculate_risk, analyze_risk
from services.attack_analyzer import analyze_attacks

report_bp = Blueprint('report', __name__)

ALLOWED_EXTENSIONS = {'json'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@report_bp.route('/upload', methods=['POST'])
def upload_report():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only .json files are supported.'}), 400

    try:
        # Load and parse the JSON file safely
        file_content = file.read().decode('utf-8')
        json_data = json.loads(file_content)
        
        # Process report
        report_metadata = process_report(json_data)
        
        # Phase 3: Threat Analysis
        cve_analysis_data = json_data.get('cve_analysis', {})
        threat_analysis_data = analyze_threats(report_metadata['port_analysis'], cve_analysis_data)
        
        # Phase 4: Risk Assessment
        risk_data = calculate_risk(json_data, report_metadata['port_analysis'], threat_analysis_data)
        
        # New Phase 4: Attack & Threat Analysis Engine
        attack_data = analyze_attacks(report_metadata['port_analysis'], cve_analysis_data, json_data.get('version_assessment', {}), json_data.get('web_security', {}))
        
        # New Phase 5: Dynamic Risk Assessment Engine
        dynamic_risk_assessment = analyze_risk(json_data)
        
        return jsonify({
            'success': True,
            'message': 'Report uploaded and validated successfully',
            'metadata': report_metadata['metadata'],
            'availability': report_metadata['availability'],
            'port_analysis': report_metadata['port_analysis'],
            'threat_analysis': threat_analysis_data,
            'risk_summary': risk_data['risk_summary'],
            'score_breakdown': risk_data['score_breakdown'],
            'attack_surface': risk_data['attack_surface'],
            'priority_findings': risk_data['priority_findings'],
            'recommendations': risk_data['recommendations'],
            'attack_analysis': attack_data,
            'risk_assessment': dynamic_risk_assessment
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON report. Please upload a valid JSON file.'}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
