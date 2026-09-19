"""
Outdated software detection module.

Compares detected software versions against a local offline database
(database/software_versions.json) to determine whether each product
is Secure, Outdated, or Unknown.

Version comparison is done numerically (not as strings) so that
2.4.7 < 2.4.60 is correctly evaluated.
"""

import json
import os


# ── Load the local version database once at import time ────────────
_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "database",
    "software_versions.json",
)

try:
    with open(_DB_PATH, "r", encoding="utf-8") as f:
        VERSION_DB = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    VERSION_DB = {}


# ── Version comparison helpers ─────────────────────────────────────

def parse_version(version_string):
    """
    Convert a version string like '2.4.7' into a tuple of integers
    for proper numeric comparison.

    Non-numeric segments (e.g. 'p1', 'beta') are stripped so that
    '9.6p1' becomes (9, 6, 1) and '1.3.8b' becomes (1, 3, 8).

    Returns None if the version cannot be parsed.
    """
    if not version_string or version_string.lower() in ("unknown", ""):
        return None

    import re
    # Extract all numeric groups from the string
    parts = re.findall(r"\d+", version_string)
    if not parts:
        return None
    return tuple(int(p) for p in parts)


def compare_versions(detected, minimum_secure):
    """
    Compare two version strings numerically.

    Returns:
         1  if detected > minimum_secure
         0  if detected == minimum_secure
        -1  if detected < minimum_secure
        None if either version cannot be parsed
    """
    v_detected = parse_version(detected)
    v_minimum = parse_version(minimum_secure)

    if v_detected is None or v_minimum is None:
        return None

    # Pad to equal length for fair comparison
    max_len = max(len(v_detected), len(v_minimum))
    v_detected = v_detected + (0,) * (max_len - len(v_detected))
    v_minimum = v_minimum + (0,) * (max_len - len(v_minimum))

    if v_detected > v_minimum:
        return 1
    elif v_detected == v_minimum:
        return 0
    else:
        return -1


# ── Main assessment function ───────────────────────────────────────

def check_versions(ports):
    """
    Assess each detected product/version against the local database.

    Args:
        ports (list[dict]): List of port dicts from the network scanner,
                            each containing at least 'product' and 'version'.

    Returns:
        dict: {
            "assessments": [ ... ],   # one entry per port with a known product
            "summary": {
                "total": int,
                "secure": int,
                "outdated": int,
                "unknown": int,
            },
            "overall_risk": "Low" | "Medium" | "High" | "Unknown",
            "recommendations": [ str, ... ],
        }
    """
    assessments = []
    recommendations = []
    risk_levels_found = set()

    for port_info in ports:
        product = port_info.get("product", "Unknown")
        detected_version = port_info.get("version", "Unknown")

        # Skip ports with no identifiable product
        if product in ("Unknown", "", None):
            continue

        db_entry = VERSION_DB.get(product)

        if db_entry is None:
            # Product not in our local database
            assessments.append({
                "product": product,
                "detected_version": detected_version,
                "latest_version": "Unknown",
                "minimum_secure": "Unknown",
                "status": "Unknown",
                "risk": "Unknown",
                "recommendation": "Product not in local database.",
            })
            risk_levels_found.add("Unknown")
            continue

        latest = db_entry.get("latest_version", "Unknown")
        minimum_secure = db_entry.get("minimum_secure", "Unknown")
        risk = db_entry.get("risk", "Unknown")
        recommendation = db_entry.get("recommendation", "")

        # Attempt numeric comparison
        cmp_result = compare_versions(detected_version, minimum_secure)

        if cmp_result is None:
            # Could not compare (one or both versions unparseable)
            status = "Unknown"
            entry_risk = "Unknown"
        elif cmp_result >= 0:
            # Detected version >= minimum secure
            status = "Secure"
            entry_risk = "Low"
        else:
            # Detected version < minimum secure → Outdated
            status = "Outdated"
            entry_risk = risk
            if recommendation and recommendation not in recommendations:
                recommendations.append(recommendation)

        risk_levels_found.add(entry_risk)

        assessments.append({
            "product": product,
            "detected_version": detected_version,
            "latest_version": latest,
            "minimum_secure": minimum_secure,
            "status": status,
            "risk": entry_risk,
            "recommendation": recommendation,
        })

    # ── Summary ────────────────────────────────────────────────────
    total = len(assessments)
    secure = sum(1 for a in assessments if a["status"] == "Secure")
    outdated = sum(1 for a in assessments if a["status"] == "Outdated")
    unknown = sum(1 for a in assessments if a["status"] == "Unknown")

    # Overall risk: any High → High, else any Medium → Medium, else Low
    if "High" in risk_levels_found:
        overall_risk = "High"
    elif "Medium" in risk_levels_found:
        overall_risk = "Medium"
    elif "Low" in risk_levels_found:
        overall_risk = "Low"
    else:
        overall_risk = "Unknown"

    return {
        "assessments": assessments,
        "summary": {
            "total": total,
            "secure": secure,
            "outdated": outdated,
            "unknown": unknown,
        },
        "overall_risk": overall_risk,
        "recommendations": recommendations,
    }
