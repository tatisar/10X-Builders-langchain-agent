import { describe, expect, it } from "vitest";
import { formatFlightOffers } from "../src/agent/tools/flights/formatFlightOffers.js";

describe("formatFlightOffers", () => {
  it("extrae precios y genera un resumen en texto plano", () => {
    const data = {
      best_flights: [
        {
          price: 1200,
          total_duration: 600,
          flights: [
            {
              airline: "TestAir",
              departure_airport: { id: "BOG", date: "2026-06-01", time: "10:00" },
              arrival_airport: { id: "NRT", date: "2026-06-02", time: "12:00" },
            },
          ],
        },
        {
          price: 980,
          flights: [
            {
              airline: "CheapAir",
              departure_airport: { id: "BOG", date: "2026-06-01", time: "08:00" },
              arrival_airport: { id: "NRT", date: "2026-06-02", time: "10:00" },
            },
          ],
        },
      ],
    };

    const result = formatFlightOffers({
      data,
      currency: "USD",
      maxOffers: 3,
      querySummary: "BOG → NRT (2026-06-01 a 2026-06-08)",
    });

    expect(result.prices).toEqual([980, 1200]);
    expect(result.text).toContain("Ofertas encontradas (USD)");
    expect(result.text).toContain("980 USD");
  });
});

