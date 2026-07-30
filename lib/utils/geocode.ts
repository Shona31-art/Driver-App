import "server-only";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

// Uses OSM's free Nominatim API (Phase 2 decision: acceptable for MVP
// order volume; its fair-use policy caps at 1 req/sec and disallows heavy
// commercial use -- revisit a paid geocoder such as LocationIQ or Geoapify
// if order volume grows). Returns null on any failure rather than
// throwing, so a flaky external service never blocks creating an order --
// callers should treat missing lat/lng as "no map pin yet", not an error.
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        // Required by Nominatim's usage policy: identify the calling application.
        "User-Agent": "DriverTMS/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;

    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
