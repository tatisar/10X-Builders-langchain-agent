import { describe, expect, it, vi } from "vitest";
import { searchFlightsTool } from "../src/agent/tools/flights/searchFlights.js";
import { getEnv } from "../src/config/env.js";

describe("searchFlightsTool", () => {
  it("devuelve un resumen con precios", async () => {
    const { SEARCHAPI_API_KEY } = getEnv();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        expect(url).toContain("engine=google_flights");
        expect(url).toContain(`api_key=${encodeURIComponent(SEARCHAPI_API_KEY)}`);
        return new Response(
          JSON.stringify({
            best_flights: [
              {
                price: 1500,
                flights: [
                  {
                    airline: "TestAir",
                    departure_airport: { id: "BOG", date: "2026-06-01", time: "10:00" },
                    arrival_airport: { id: "NRT", date: "2026-06-02", time: "12:00" },
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    const text = await searchFlightsTool.invoke({
      departure_id: "BOG",
      arrival_id: "NRT",
      outbound_date: "2026-06-01",
      return_date: "2026-06-08",
      currency: "USD",
      flight_type: "round_trip",
      sort_by: "price",
      adults: 1,
      max_offers: 2,
      gl: "us",
      hl: "en",
    });

    expect(text).toContain("Ofertas encontradas (USD)");
    expect(text).toContain("1500 USD");
    expect(text).toContain("Sugerencia");
  });

  it("maneja errores HTTP con un mensaje legible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response("Forbidden", { status: 403 });
      }),
    );

    const text = await searchFlightsTool.invoke({
      departure_id: "BOG",
      arrival_id: "NRT",
      outbound_date: "2026-06-01",
      return_date: "2026-06-08",
      currency: "USD",
      flight_type: "round_trip",
      sort_by: "price",
      adults: 1,
      max_offers: 2,
      gl: "us",
      hl: "en",
    });

    expect(text).toContain("No pude consultar vuelos");
    expect(text).toContain("HTTP 403");
  });
});

