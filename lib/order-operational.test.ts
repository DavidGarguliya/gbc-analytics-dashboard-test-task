import { describe, expect, it } from "vitest";

import { buildOperationalOrderSummary } from "@/lib/order-operational";

describe("buildOperationalOrderSummary", () => {
  it("reads live RetailCRM item names from nested offer fields and derives email from raw_json", () => {
    expect(
      buildOperationalOrderSummary({
        created_at: "2026-02-19T09:00:00.000Z",
        currency: "KZT",
        customer_name: "Феруза Юсупова",
        external_id: "mock-order-0050",
        number: "MOCK-0050",
        phone: "+77090123450",
        raw_json: {
          delivery: {
            address: {
              city: "Алматы",
            },
          },
          email: "feruza.yusupova@example.com",
          items: [
            {
              initialPrice: 28000,
              offer: {
                displayName: "Утягивающий комбидресс Nova Slim",
              },
              quantity: 1,
            },
            {
              initialPrice: 35000,
              offer: {
                name: "Утягивающее боди Nova Body",
              },
              quantity: 1,
            },
            {
              initialPrice: 18000,
              productName: "Утягивающие леггинсы Nova Fit",
              quantity: 1,
            },
          ],
        },
        retailcrm_id: 90,
        source: "shopping-cart",
        status: "offer-analog",
        total_sum: 81000,
      }),
    ).toEqual(
      expect.objectContaining({
        city: "Алматы",
        email: "feruza.yusupova@example.com",
        itemCount: 3,
        items: [
          expect.objectContaining({
            productName: "Утягивающий комбидресс Nova Slim",
          }),
          expect.objectContaining({
            productName: "Утягивающее боди Nova Body",
          }),
          expect.objectContaining({
            productName: "Утягивающие леггинсы Nova Fit",
          }),
        ],
        unitsCount: 3,
      }),
    );
  });
});
