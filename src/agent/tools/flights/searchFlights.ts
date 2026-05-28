import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getEnv } from "../../../config/env.js";
import { getJson } from "../../http/client.js";
import { formatFlightOffers } from "./formatFlightOffers.js";

const searchFlightsSchema = z.object({
  departure_id: z
    .string()
    .min(1)
    .describe("Código IATA (3 letras) o kgmid del lugar de salida. Ej: BOG, JFK o /m/02_286."),
  arrival_id: z
    .string()
    .min(1)
    .default("NRT")
    .describe("Código IATA (3 letras) o kgmid del lugar de llegada. Ej: NRT, HND, KIX o /m/07dfk."),
  outbound_date: z
    .string()
    .describe("Fecha de salida (YYYY-MM-DD)."),
  return_date: z
    .string()
    .describe("Fecha de regreso (YYYY-MM-DD)."),
  currency: z.string().default("USD").describe("Moneda para precios (default USD)."),
  flight_type: z
    .enum(["round_trip", "one_way"])
    .default("round_trip")
    .describe("Tipo de vuelo. Usa round_trip si quieres ida y vuelta."),
  sort_by: z
    .enum(["top_flights", "price", "departure_time", "arrival_time", "duration", "emissions"])
    .default("price")
    .describe("Orden de resultados (recomendado: price)."),
  adults: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Número de adultos (1-9)."),
  max_offers: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("Máximo de ofertas a resumir (1-10)."),
  gl: z
    .string()
    .default("us")
    .describe("País para la búsqueda (gl). Default us."),
  hl: z
    .string()
    .default("en")
    .describe("Idioma de la interfaz (hl). Default en."),
  max_price: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Precio máximo del ticket (opcional)."),
});

export const searchFlightsTool = tool(
  async (args) => {
    const { SEARCHAPI_API_KEY, SEARCHAPI_BASE_URL } = getEnv();

    const params = new URLSearchParams();
    params.set("engine", "google_flights");
    params.set("flight_type", args.flight_type);
    params.set("departure_id", args.departure_id);
    params.set("arrival_id", args.arrival_id);
    params.set("outbound_date", args.outbound_date);
    if (args.flight_type === "round_trip") params.set("return_date", args.return_date);
    params.set("currency", args.currency);
    params.set("sort_by", args.sort_by);
    params.set("adults", String(args.adults));
    params.set("gl", args.gl);
    params.set("hl", args.hl);
    if (typeof args.max_price === "number") params.set("max_price", String(args.max_price));
    params.set("api_key", SEARCHAPI_API_KEY);

    const url = `${SEARCHAPI_BASE_URL}?${params.toString()}`;

    const result = await getJson(url);
    if (!result.ok) {
      return `No pude consultar vuelos en tiempo real (SearchAPI). Motivo: ${result.error}.`;
    }

    const querySummary = `${args.departure_id} → ${args.arrival_id} (${args.outbound_date}${
      args.flight_type === "round_trip" ? ` a ${args.return_date}` : ""
    })`;

    const formatted = formatFlightOffers({
      data: result.json,
      currency: args.currency,
      maxOffers: args.max_offers,
      querySummary,
    });

    // Add a small instruction hint for chaining with calculator.
    return (
      `${formatted.text}\n\n` +
      `Sugerencia: si necesitas estimar impuestos o total (por ejemplo, +16%), usa calculator con una expresión como (${formatted.prices[0] ?? 0} * 1.16).`
    );
  },
  {
    name: "search_flights",
    description:
      "Busca vuelos en tiempo real con Google Flights (vía SearchAPI) y devuelve un resumen en texto plano con precios. Úsala cuando necesites precios actuales para comparar contra un presupuesto o hacer cálculos posteriores.",
    schema: searchFlightsSchema,
  },
);

