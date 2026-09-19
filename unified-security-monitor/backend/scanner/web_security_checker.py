import requests
from urllib.parse import urlparse

SECURITY_HEADERS = [
    "X-Frame-Options",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy"
]

def check_web_security(target):
    """
    Analyzes web security configurations for a given target.
    Checks HTTP to HTTPS redirect, HTTPS availability, and security headers.
    """
    results = {
        "https_available": False,
        "redirects_to_https": False,
        "server": "Unknown",
        "server_version_exposed": False,
        "headers": {},
        "risk_level": "Low"
    }

    # Helper to check a specific URL
    def check_url(url, allow_redirects=False):
        try:
            return requests.get(url, timeout=5, allow_redirects=allow_redirects, verify=False)
        except requests.RequestException:
            return None

    # Check HTTP
    http_url = f"http://{target}"
    http_response = check_url(http_url, allow_redirects=False)

    # Check HTTP to HTTPS redirect
    if http_response and http_response.status_code in [301, 302, 307, 308]:
        location = http_response.headers.get('Location', '')
        if location.startswith('https://'):
            results["redirects_to_https"] = True

    # Check HTTPS
    https_url = f"https://{target}"
    https_response = check_url(https_url, allow_redirects=True)
    
    if https_response:
        results["https_available"] = True
        response_to_analyze = https_response
    elif http_response:
        # Fallback to HTTP if HTTPS is not available
        response_to_analyze = check_url(http_url, allow_redirects=True) or http_response
    else:
        # Neither responded
        return None

    # Analyze headers
    headers = response_to_analyze.headers
    
    # Server header
    server_header = headers.get("Server", "Missing")
    results["server"] = server_header
    if server_header != "Missing" and any(char.isdigit() for char in server_header):
        results["server_version_exposed"] = True
        
    # Security headers
    missing_count = 0
    for header in SECURITY_HEADERS:
        val = headers.get(header)
        if val:
            results["headers"][header] = val
        else:
            results["headers"][header] = "Missing"
            missing_count += 1
            
    # Simple risk scoring based on missing headers and HTTPS
    risk_score = 0
    if not results["https_available"]:
        risk_score += 3
    if not results["redirects_to_https"] and results["https_available"]:
        risk_score += 1
    if results["server_version_exposed"]:
        risk_score += 1
    risk_score += missing_count

    if risk_score >= 5:
        results["risk_level"] = "High"
    elif risk_score >= 3:
        results["risk_level"] = "Medium"
    else:
        results["risk_level"] = "Low"

    return results
