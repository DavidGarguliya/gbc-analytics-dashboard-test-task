import { describe, expect, it } from "vitest";

import {
  buildRetailCrmOrder,
  buildRetailCrmUploadBody,
  parseMockOrdersFixture,
  selectRetailCrmSiteCode,
  type MockOrderRecord,
} from "@/lib/retailcrm";

const sampleOrder: MockOrderRecord = {
  firstName: "Айгуль",
  lastName: "Касымова",
  phone: "+77001234501",
  email: "aigul.kasymova@example.com",
  orderType: "eshop-individual",
  orderMethod: "shopping-cart",
  status: "new",
  items: [
    {
      productName: "Корректирующее бельё Nova Classic",
      quantity: 2,
      initialPrice: 15000,
    },
  ],
  delivery: {
    address: {
      city: "Алматы",
      text: "ул. Абая 150, кв 12",
    },
  },
  customFields: {
    utm_source: "instagram",
  },
};

describe("buildRetailCrmOrder", () => {
  it("maps a fixture order into a deterministic RetailCRM payload", () => {
    expect(buildRetailCrmOrder(sampleOrder, 0)).toEqual({
      createdAt: "2026-01-01 09:00:00",
      currency: "KZT",
      customFields: {
        utm_source: "instagram",
      },
      delivery: {
        address: {
          city: "Алматы",
          text: "ул. Абая 150, кв 12",
        },
      },
      email: "aigul.kasymova@example.com",
      externalId: "mock-order-0001",
      firstName: "Айгуль",
      items: [
        {
          initialPrice: 15000,
          productName: "Корректирующее бельё Nova Classic",
          quantity: 2,
        },
      ],
      lastName: "Касымова",
      number: "MOCK-0001",
      orderMethod: "shopping-cart",
      orderType: "eshop-individual",
      phone: "+77001234501",
      status: "new",
    });
  });
});

describe("parseMockOrdersFixture", () => {
  it("accepts a valid fixture array", () => {
    expect(parseMockOrdersFixture([sampleOrder])).toEqual([sampleOrder]);
  });

  it("rejects malformed fixture records with the failing index", () => {
    expect(() =>
      parseMockOrdersFixture([
        {
          ...sampleOrder,
          items: [{ productName: "Broken item", initialPrice: 15000 }],
        },
      ]),
    ).toThrow("mock_orders.json entry 1 has an invalid shape.");
  });
});

describe("buildRetailCrmUploadBody", () => {
  it("serializes apiKey, site, and order payloads as form-urlencoded fields", () => {
    const body = buildRetailCrmUploadBody({
      apiKey: "test-key",
      orders: [buildRetailCrmOrder(sampleOrder, 0)],
      site: "almaty-store",
    });

    expect(body.get("apiKey")).toBe("test-key");
    expect(body.get("site")).toBe("almaty-store");
    expect(JSON.parse(body.get("orders") ?? "[]")).toHaveLength(1);
  });
});

describe("selectRetailCrmSiteCode", () => {
  it("prefers the provided site code when it is available", () => {
    expect(
      selectRetailCrmSiteCode(
        [
          { code: "primary-store", defaultForCrm: true },
          { code: "secondary-store", defaultForCrm: false },
        ],
        "secondary-store",
      ),
    ).toBe("secondary-store");
  });

  it("falls back to the default site when no preference is provided", () => {
    expect(
      selectRetailCrmSiteCode([
        { code: "primary-store", defaultForCrm: true },
        { code: "secondary-store", defaultForCrm: false },
      ]),
    ).toBe("primary-store");
  });
});
