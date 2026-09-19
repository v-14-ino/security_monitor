"""
Offline CVE intelligence module.

Matches detected software products and their versions against a local
CVE database (database/cve_database.json) to identify known
vulnerabilities without requiring internet connectivity.

Matching strategy:
  1. Exact version match  – e.g. detected "2.4.7" matches DB key "2.4.7"
  2. Major.Minor match    – e.g. detected "6.6.1p1" is normalised to "6.6.1",
                            which matches DB key "6.6.1"
  3. Major match          – e.g. detected "5.7.42" tries key "5.7"

This layered approach maximises hits from a compact offline database.
"""

import json
import os
import re


# ── Load the local CVE database once at import time ────────────────
_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "database",
    "cve_database.json",
)

try:
    with open(_DB_PATH, "r", encoding="utf-8") as f:
        CVE_DB = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    CVE_DB = {}


def _normalise_version(version_string):
    """
    Extract candidate version keys for database lookup.

    Given "6.6.1p1 Ubuntu 2ubuntu2.13", returns:
      ["6.6.1p1 Ubuntu 2ubuntu2.13", "6.6.1", "6.6"]

    This allows progressively looser matching.
    """
    if not version_string or version_string.lower() == "unknown":
        return []

    candidates = [version_string]

    # Extract numeric parts
    parts = re.findall(r"\d+", version_string)
    if not parts:
        return candidates

    # Try first 3 parts (major.minor.patch)
    if len(parts) >= 3:
        candidates.append(".".join(parts[:3]))

    # Try first 2 parts (major.minor)
    if len(parts) >= 2:
        candidates.append(".".join(parts[:2]))

    # Try first part only (major)
    if len(parts) >= 1:
        candidates.append(parts[0])

    return candidates


def check_cves(ports):
    """
    Match detected products/versions against the offline CVE database.

    Args:
        ports (list[dict]): Port dicts from the network scanner,
                            each with 'product' and 'version' keys.

    Returns:
        dict: {
            "findings": [
                {
                    "product": str,
                    "version": str,
                    "cves": [
                        {
                            "id": str,
                            "severity": str,
                            "description": str,
                            "recommendation": str,
                        }
                    ]
                }
            ],
            "summary": {
                "total_cves": int,
                "critical": int,
                "high": int,
                "medium": int,
                "low": int,
            },
            "highest_severity": "Critical" | "High" | "Medium" | "Low" | "None",
        }
    """
    findings = []
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    seen_products = set()

    for port_info in ports:
        product = port_info.get("product", "Unknown")
        version = port_info.get("version", "Unknown")

        # Skip unknowns and duplicates
        if product in ("Unknown", "", None):
            continue
        if product in seen_products:
            continue
        seen_products.add(product)

        # Look up product in CVE database
        product_cves = CVE_DB.get(product)
        if not product_cves:
            continue

        # Try version candidates from most specific to least
        matched_cves = []
        version_candidates = _normalise_version(version)

        for candidate in version_candidates:
            if candidate in product_cves:
                matched_cves = product_cves[candidate]
                break

        if not matched_cves:
            continue

        # Format findings
        formatted = []
        for cve_entry in matched_cves:
            severity = cve_entry.get("severity", "Medium")
            cve_id = cve_entry.get("id", cve_entry.get("cve", "Unknown"))
            formatted.append({
                "id": cve_id,
                "severity": severity,
                "description": cve_entry.get("description", ""),
                "recommendation": cve_entry.get("recommendation", ""),
            })
            if severity in severity_counts:
                severity_counts[severity] += 1

        findings.append({
            "product": product,
            "version": version,
            "cves": formatted,
        })

    # Determine highest severity
    total = sum(severity_counts.values())
    if severity_counts["Critical"] > 0:
        highest = "Critical"
    elif severity_counts["High"] > 0:
        highest = "High"
    elif severity_counts["Medium"] > 0:
        highest = "Medium"
    elif severity_counts["Low"] > 0:
        highest = "Low"
    else:
        highest = "None"

    return {
        "findings": findings,
        "summary": {
            "total_cves": total,
            "critical": severity_counts["Critical"],
            "high": severity_counts["High"],
            "medium": severity_counts["Medium"],
            "low": severity_counts["Low"],
        },
        "highest_severity": highest,
    }
