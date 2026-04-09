export type MockOrderItem = {
  initialPrice: number;
  productName: string;
  quantity: number;
};

export type MockOrderRecord = {
  customFields?: Record<string, unknown>;
  delivery: {
    address: {
      city: string;
      text: string;
    };
  };
  email?: string;
  firstName: string;
  items: MockOrderItem[];
  lastName: string;
  orderMethod: string;
  orderType: string;
  phone: string;
  status: string;
};

export type RetailCrmSerializedOrder = {
  createdAt: string;
  currency: string;
  customFields?: Record<string, unknown>;
  delivery: MockOrderRecord["delivery"];
  email?: string;
  externalId: string;
  firstName: string;
  items: MockOrderItem[];
  lastName: string;
  number: string;
  orderMethod: string;
  orderType: string;
  phone: string;
  status: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMockOrderItem(value: unknown): value is MockOrderItem {
  return (
    isObject(value) &&
    typeof value.productName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.initialPrice === "number"
  );
}

function isMockOrderRecord(value: unknown): value is MockOrderRecord {
  return (
    isObject(value) &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.phone === "string" &&
    (typeof value.email === "string" || typeof value.email === "undefined") &&
    typeof value.orderType === "string" &&
    typeof value.orderMethod === "string" &&
    typeof value.status === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isMockOrderItem) &&
    isObject(value.delivery) &&
    isObject(value.delivery.address) &&
    typeof value.delivery.address.city === "string" &&
    typeof value.delivery.address.text === "string" &&
    (typeof value.customFields === "undefined" || isObject(value.customFields))
  );
}

function formatImportTimestamp(index: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + index, 9, 0, 0));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function buildRetailCrmOrder(
  order: MockOrderRecord,
  index: number,
  overrides?: {
    currency?: string;
    orderType?: string;
  },
): RetailCrmSerializedOrder {
  const serial = String(index + 1).padStart(4, "0");

  return {
    createdAt: formatImportTimestamp(index),
    currency: overrides?.currency ?? "KZT",
    customFields: order.customFields,
    delivery: order.delivery,
    email: order.email,
    externalId: `mock-order-${serial}`,
    firstName: order.firstName,
    items: order.items.map((item) => ({
      initialPrice: item.initialPrice,
      productName: item.productName,
      quantity: item.quantity,
    })),
    lastName: order.lastName,
    number: `MOCK-${serial}`,
    orderMethod: order.orderMethod,
    orderType: overrides?.orderType ?? order.orderType,
    phone: order.phone,
    status: order.status,
  };
}

export function resolveRetailCrmOrderTypeCode(
  availableOrderTypes: Array<{
    code: string;
    defaultForCrm?: boolean;
  }>,
  requestedOrderType: string,
): string {
  const directMatch = availableOrderTypes.find(
    (orderType) => orderType.code === requestedOrderType,
  );

  if (directMatch) {
    return directMatch.code;
  }

  if (availableOrderTypes.length === 1) {
    return availableOrderTypes[0].code;
  }

  const defaultOrderType = availableOrderTypes.find((orderType) => orderType.defaultForCrm);

  if (defaultOrderType) {
    return defaultOrderType.code;
  }

  throw new Error(
    `RetailCRM order type "${requestedOrderType}" is not available and no deterministic fallback exists.`,
  );
}

export function parseMockOrdersFixture(input: unknown): MockOrderRecord[] {
  if (!Array.isArray(input)) {
    throw new Error("mock_orders.json must contain an array of orders.");
  }

  return input.map((entry, index) => {
    if (!isMockOrderRecord(entry)) {
      throw new Error(`mock_orders.json entry ${index + 1} has an invalid shape.`);
    }

    return entry;
  });
}
