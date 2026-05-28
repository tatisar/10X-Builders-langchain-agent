type FlightOffer = {
  price?: number;
  type?: string;
  total_duration?: number;
  flights?: Array<{
    airline?: string;
    flight_number?: string;
    departure_airport?: { id?: string; date?: string; time?: string };
    arrival_airport?: { id?: string; date?: string; time?: string };
  }>;
};

export type FormatFlightsArgs = {
  data: unknown;
  currency: string;
  maxOffers: number;
  querySummary: string;
};

export function formatFlightOffers({
  data,
  currency,
  maxOffers,
  querySummary,
}: FormatFlightsArgs): { text: string; prices: number[] } {
  const offers = extractOffers(data);

  if (offers.length === 0) {
    return {
      text: `No encontré ofertas en este momento para: ${querySummary}.`,
      prices: [],
    };
  }

  const pricedOffers = offers
    .map((o) => ({ offer: o, price: typeof o.price === "number" ? o.price : undefined }))
    .filter((x) => typeof x.price === "number") as Array<{ offer: FlightOffer; price: number }>;

  if (pricedOffers.length === 0) {
    return {
      text: `Encontré resultados para: ${querySummary}, pero no pude extraer precios numéricos.`,
      prices: [],
    };
  }

  pricedOffers.sort((a, b) => a.price - b.price);
  const selected = pricedOffers.slice(0, Math.max(1, maxOffers));

  const lines = selected.map((x, idx) => formatOneOffer(x.offer, x.price, currency, idx + 1));

  const cheapest = selected[0]?.price;
  const header =
    `Ofertas encontradas (${currency}) para ${querySummary}:\n` +
    lines.join("\n") +
    (typeof cheapest === "number"
      ? `\n\nPrecio más bajo detectado: ${cheapest} ${currency}.`
      : "");

  return { text: header, prices: selected.map((s) => s.price) };
}

function extractOffers(data: unknown): FlightOffer[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;

  const candidates: FlightOffer[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (!key.endsWith("_flights")) continue;
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (item && typeof item === "object") candidates.push(item as FlightOffer);
    }
  }

  // The docs examples use `best_flights`. This fallback keeps us resilient if the API changes.
  if (candidates.length > 0) return candidates;

  const best = record["best_flights"];
  if (Array.isArray(best)) {
    return best.filter((x) => x && typeof x === "object") as FlightOffer[];
  }

  return [];
}

function formatOneOffer(
  offer: FlightOffer,
  price: number,
  currency: string,
  index: number,
): string {
  const firstLeg = offer.flights?.[0];
  const lastLeg = offer.flights?.[offer.flights.length - 1];

  const from = firstLeg?.departure_airport?.id ?? "¿?";
  const to = lastLeg?.arrival_airport?.id ?? "¿?";
  const date = firstLeg?.departure_airport?.date;
  const airline = firstLeg?.airline;
  const durationMin = offer.total_duration;

  const parts: string[] = [];
  parts.push(`${index}. ${from} → ${to}`);
  if (date) parts.push(date);
  parts.push(`${price} ${currency}`);
  if (airline) parts.push(airline);
  if (typeof durationMin === "number") parts.push(`${durationMin} min`);

  return parts.join(" | ");
}

