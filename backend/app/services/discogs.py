from typing import Any, Dict
import httpx

BASE_URL = "https://api.discogs.com"

async def fetch_release(discogs_id: str, api_key: str) -> Dict[str, Any]:
    # Simplifié: Discogs utilise OAuth/app tokens. Placeholder pour clés.
    url = f"{BASE_URL}/releases/{discogs_id}"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers={"Authorization": f"Discogs token={api_key}"})
        resp.raise_for_status()
        data = resp.json()
        return {
            "discogs_id": discogs_id,
            "titre": data.get("title"),
            "artistes": [a.get("name") for a in data.get("artists", [])],
            "annee": data.get("year") or 0,
            "genres": data.get("genres", []),
            "cover_url": data.get("images", [{}])[0].get("uri")
        }
