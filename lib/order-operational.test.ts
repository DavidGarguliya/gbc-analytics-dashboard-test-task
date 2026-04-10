import { describe, expect, it } from "vitest";

import { buildOperationalOrderSummary, formatOrderMethod } from "@/lib/order-operational";

describe("buildOperationalOrderSummary", () => {
  it("reads marketing source and order method only from raw_json while deriving operational fields", () => {
    expect(
      buildOperationalOrderSummary({
        created_at: "2026-02-19T09:00:00.000Z",
        currency: "KZT",
        customer_name: "Феруза Юсупова",
        external_id: "mock-order-0050",
        number: "MOCK-0050",
        phone: "+77090123450",
        raw_json: {
          customFields: {
            utm_source: "instagram",
          },
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
          orderMethod: "shopping-cart",
        },
        retailcrm_id: 90,
        source: "legacy-mixed-value",
        status: "offer-analog",
        total_sum: 81000,
      }),
    ).toEqual(
      expect.objectContaining({
        city: "Алматы",
        email: "feruza.yusupova@example.com",
        itemCount: 3,
        marketingSource: "instagram",
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
        orderMethod: "shopping-cart",
        unitsCount: 3,
      }),
    );
  });

  it("does not fall back to the mixed persisted source column when raw_json.orderMethod is absent", () => {
    expect(
      buildOperationalOrderSummary({
        created_at: "2026-02-19T09:00:00.000Z",
        currency: "KZT",
        customer_name: "Феруза Юсупова",
        external_id: "mock-order-0050",
        number: "MOCK-0050",
        phone: "+77090123450",
        raw_json: {
          customFields: {
            utm_source: "instagram",
          },
          items: [],
        },
        retailcrm_id: 90,
        source: "shopping-cart",
        status: "offer-analog",
        total_sum: 81000,
      }).orderMethod,
    ).toBeNull();
  });
});

describe("formatOrderMethod", () => {
  it("formats known operational order methods into readable Russian labels", () => {
    expect(formatOrderMethod("shopping-cart")).toBe("Через корзину");
    expect(formatOrderMethod("offer-analog")).toBe("Предложить замену");
    expect(formatOrderMethod("offerr-analog")).toBe("Предложить замену");
    expect(formatOrderMethod(null)).toBe("Не указан");
  });
});
