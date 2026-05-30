"""
Brightdata SERP connector — fetches live compliance data from the web.
"""

import logging
import requests

logger = logging.getLogger("brightdata")

BRIGHTDATA_TOKEN = "82402e6b-68c8-421e-9efc-78b677ebbe49"
BRIGHTDATA_URL = "https://api.brightdata.com/request"


def fetch_web_results(query: str) -> str:
    """
    Search the web via Brightdata SERP API.
    Uses hardcoded working URL for compliance updates in social media privacy in California.
    """
    payload = {
        "zone": "serp_compliance_data",
        "url": "https://www.google.com/search?q=Give%20me%20all%20the%20compliance%20updates%20in%20social%20media%20privacy%20in%20California&brd_json=1",
        "format": "json",
        "data_format": "parsed",
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BRIGHTDATA_TOKEN}",
    }

    try:
        logger.info("🌐 Calling Brightdata SERP API...")
        response = requests.post(BRIGHTDATA_URL, json=payload, headers=headers, timeout=30)
        logger.info(f"   Status: {response.status_code} | Size: {len(response.content)} bytes")
        response.raise_for_status()

        data = response.json()
        import json
        raw_text = json.dumps(data, indent=2)
        logger.info(f"   📦 Response top-level keys: {list(data.keys())}")
        logger.info(f"   🔍 Raw response (first 500 chars): {raw_text[:500]}")
        return raw_text

    except Exception as e:
        logger.error(f"   ❌ Brightdata API error: {str(e)}")
        return f"Brightdata API error: {str(e)}"

