// Deep links only -- never an embedded Google Maps API, per the project's
// constraint. Prefers coordinates when available (more precise for
// informal/rural addresses) and falls back to the raw address text.
export function buildMapLinks(params: { address: string; lat?: number | null; lng?: number | null }) {
  const query = params.lat != null && params.lng != null ? `${params.lat},${params.lng}` : params.address;
  const encoded = encodeURIComponent(query);

  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
  };
}

// Directions deep link for the "open the full route" button next to the
// inline route map -- same coordinate-first, address-fallback rule as
// buildMapLinks above.
export function buildRouteLink(params: {
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  deliveryAddress: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}) {
  const origin =
    params.pickupLat != null && params.pickupLng != null
      ? `${params.pickupLat},${params.pickupLng}`
      : params.pickupAddress;
  const destination =
    params.deliveryLat != null && params.deliveryLng != null
      ? `${params.deliveryLat},${params.deliveryLng}`
      : params.deliveryAddress;

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
}
