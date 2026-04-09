import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildRetailCrmUploadBody,
  listRetailCrmOrdersPage,
  listRetailCrmSites,
  selectRetailCrmSiteCode,
} from "@/lib/retailcrm";
import {
  buildRetailCrmOrder,
  parseMockOrdersFixture,
  resolveRetailCrmOrderTypeCode,
  type MockOrderRecord,
} from "@/lib/retailcrm-import";

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

  it("allows import-time order type overrides without changing the fixture source", () => {
    expect(buildRetailCrmOrder(sampleOrder, 0, { orderType: "main" }).orderType).toBe("main");
  });

  it("allows import-time currency overrides from the live RetailCRM site contract", () => {
    expect(buildRetailCrmOrder(sampleOrder, 0, { currency: "RUB" }).currency).toBe("RUB");
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

describe("listRetailCrmSites", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RETAILCRM_BASE_URL;
    delete process.env.RETAILCRM_API_KEY;
  });

  it("normalizes object-shaped sites payloads returned by RetailCRM", async () => {
    process.env.RETAILCRM_BASE_URL = "https://example.retailcrm.ru";
    process.env.RETAILCRM_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            sites: {
              garguliyadavid: {
                code: "garguliyadavid",
                currency: "RUB",
                defaultForCrm: true,
                id: 1,
                name: "Main store",
              },
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      ),
    );

    await expect(listRetailCrmSites()).resolves.toEqual([
      {
        code: "garguliyadavid",
        currency: "RUB",
        defaultForCrm: true,
      },
    ]);
  });
});

describe("listRetailCrmOrdersPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RETAILCRM_BASE_URL;
    delete process.env.RETAILCRM_API_KEY;
  });

  it("requests a paginated site-filtered orders page from RetailCRM", async () => {
    process.env.RETAILCRM_BASE_URL = "https://example.retailcrm.ru";
    process.env.RETAILCRM_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          orders: [
            {
              id: 90,
              externalId: "mock-order-0050",
              number: "MOCK-0050",
              createdAt: "2026-02-19 09:00:00",
              status: "offer-analog",
              totalSumm: 81000,
              currency: "RUB",
              orderType: "main",
              orderMethod: "shopping-cart",
              site: "garguliyadavid",
              firstName: "Феруза",
              lastName: "Юсупова",
              phone: "+77090123450",
            },
          ],
          pagination: {
            limit: 50,
            totalCount: 1,
            currentPage: 1,
            totalPageCount: 1,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listRetailCrmOrdersPage({
        limit: 50,
        page: 1,
        site: "garguliyadavid",
      }),
    ).resolves.toEqual({
      orders: [
        expect.objectContaining({
          id: 90,
          currency: "RUB",
          externalId: "mock-order-0050",
          orderType: "main",
          site: "garguliyadavid",
          totalSumm: 81000,
        }),
      ],
      pagination: {
        currentPage: 1,
        limit: 50,
        totalCount: 1,
        totalPageCount: 1,
      },
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);

    expect(requestUrl.pathname).toBe("/api/v5/orders");
    expect(requestUrl.searchParams.get("limit")).toBe("50");
    expect(requestUrl.searchParams.get("page")).toBe("1");
    expect(requestUrl.searchParams.get("filter[sites][]")).toBe("garguliyadavid");
  });
});

describe("resolveRetailCrmOrderTypeCode", () => {
  it("keeps the requested order type when it exists in the RetailCRM account", () => {
    expect(
      resolveRetailCrmOrderTypeCode(
        [
          { code: "main", defaultForCrm: true },
          { code: "eshop-individual", defaultForCrm: false },
        ],
        "eshop-individual",
      ),
    ).toBe("eshop-individual");
  });

  it("falls back to the only available order type when the fixture code is missing", () => {
    expect(
      resolveRetailCrmOrderTypeCode([{ code: "main", defaultForCrm: true }], "eshop-individual"),
    ).toBe("main");
  });
});
