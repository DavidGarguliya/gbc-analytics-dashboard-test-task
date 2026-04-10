"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  buildDashboardAnalytics,
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardOrder,
  type DashboardPeriodKey,
  type DashboardReadModel,
  type DashboardSummary,
} from "@/lib/dashboard";
import {
  formatOperationalOrderLabel,
  splitOperationalItems,
} from "@/lib/order-operational";

import styles from "./page.module.css";

type DashboardViewProps = {
  dashboard: DashboardReadModel;
  renderedAt: string;
};

type DeltaTone = "down" | "flat" | "muted" | "up";

function formatNumberValue(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCountValue(value: number | null): string {
  if (value === null) {
    return "н/д";
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatPercentValue(value: number | null): string {
  if (value === null) {
    return "Н/Д";
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: value * 100 >= 10 ? 0 : 1,
  }).format(value * 100)}%`;
}

function formatMoneyValue(input: {
  amount: number | null;
  currencyCode: string | null;
}): string {
  if (input.amount === null || input.currencyCode === null) {
    return "Смешанные валюты";
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(input.amount)} ${input.currencyCode}`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateRangeLabel(input: {
  end: string | null;
  start: string | null;
}): string {
  const { end, start } = input;

  if (start === null || end === null) {
    return "Нет данных";
  }

  return `${formatDateLabel(start)} — ${formatDateLabel(end)}`;
}

function formatPeriodAnchorLabel(value: string | null): string {
  if (value === null) {
    return "нет данных";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDeltaValue(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 0 : 1,
    signDisplay: "always",
  }).format(value);
}

function buildDelta(input: {
  current: number | null;
  previous: number | null;
}): { label: string; tone: DeltaTone } | null {
  const { current, previous } = input;

  if (current === null || previous === null) {
    return null;
  }

  if (previous === 0 && current === 0) {
    return {
      label: "без изменений",
      tone: "flat",
    };
  }

  if (previous === 0) {
    return {
      label: "нет базы",
      tone: "muted",
    };
  }

  const deltaPercent = ((current - previous) / previous) * 100;

  if (Math.abs(deltaPercent) < 0.05) {
    return {
      label: "без изменений",
      tone: "flat",
    };
  }

  return {
    label: `${formatDeltaValue(deltaPercent)}% к предыдущему периоду`,
    tone: deltaPercent > 0 ? "up" : "down",
  };
}

function isSelectedPeriod(value: DashboardPeriodKey, current: DashboardPeriodKey): boolean {
  return value === current;
}


function SortButton(props: {
  activeKey: "createdAt" | "totalSum";
  direction: "asc" | "desc";
  label: string;
  onToggle: (key: "createdAt" | "totalSum") => void;
  sortKey: "createdAt" | "totalSum";
}) {
  const isActive = props.activeKey === props.sortKey;
  const icon = !isActive ? "↕" : props.direction === "desc" ? "↓" : "↑";

  return (
    <button
      className={`${styles.sortButton} ${isActive ? styles.sortButtonActive : ""}`}
      onClick={() => props.onToggle(props.sortKey)}
      type="button"
    >
      <span>{props.label}</span>
      <span className={styles.sortIcon}>{icon}</span>
    </button>
  );
}

function MetricCard(props: {
  delta: { label: string; tone: DeltaTone } | null;
  subtitle: string;
  title: string;
  value: string;
}) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricLabel}>{props.title}</p>
      <div className={styles.metricValueRow}>
        <p className={styles.metricValue}>{props.value}</p>
        {props.delta ? (
          <p
            className={`${styles.metricDelta} ${
              props.delta.tone === "up"
                ? styles.metricDeltaUp
                : props.delta.tone === "down"
                  ? styles.metricDeltaDown
                  : props.delta.tone === "flat"
                    ? styles.metricDeltaFlat
                    : styles.metricDeltaMuted
            }`}
          >
            {props.delta.label}
          </p>
        ) : null}
      </div>
      <p className={styles.metricSupport}>{props.subtitle}</p>
    </article>
  );
}

function RevenueTrendChart(props: {
  currencyCode: string | null;
  points: Array<{
    key: string;
    label: string;
    ordersCount: number;
    revenueAmount: number | null;
  }>;
}) {
  if (props.points.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartMeta}>
          <div>
            <p className={styles.chartLabel}>Выручка по дням</p>
            <h3 className={styles.chartTitle}>Нет данных</h3>
          </div>
          <p className={styles.chartHint}>
            После первой синхронизации график начнёт строиться из Supabase.
          </p>
        </div>
      </div>
    );
  }

  const values = props.points.map((point) => point.revenueAmount ?? 0);
  const totalRevenue = values.reduce((sum, value) => sum + value, 0);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartMeta}>
        <div>
          <p className={styles.chartLabel}>Выручка по дням</p>
          <h3 className={styles.chartTitle}>
            {formatMoneyValue({
              amount: totalRevenue,
              currencyCode: props.currencyCode,
            })}
          </h3>
        </div>
        <p className={styles.chartHint}>Динамика выручки за выбранный период</p>
      </div>

      <div className={styles.lineChartWrap} style={{ height: 280, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={props.points} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
              tickMargin={12} 
              minTickGap={30} 
            />
            <Tooltip
              contentStyle={{ borderRadius: '0.6rem', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
              itemStyle={{ color: 'var(--accent)', fontWeight: 500 }}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
              formatter={(value) => [
                formatMoneyValue({ amount: Number(value), currencyCode: props.currencyCode }),
                "Выручка"
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="revenueAmount" 
              stroke="var(--accent)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#revenueGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OrdersTrendChart(props: {
  points: Array<{
    key: string;
    label: string;
    ordersCount: number;
  }>;
}) {
  if (props.points.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartMeta}>
          <div>
            <p className={styles.chartLabel}>Заказы по дням</p>
            <h3 className={styles.chartTitle}>Нет данных</h3>
          </div>
          <p className={styles.chartHint}>График появится, когда в витрине будут доступные записи.</p>
        </div>
      </div>
    );
  }

  const values = props.points.map((point) => point.ordersCount);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartMeta}>
        <div>
          <p className={styles.chartLabel}>Заказы по дням</p>
          <h3 className={styles.chartTitle}>
            {formatNumberValue(values.reduce((sum, value) => sum + value, 0))}
          </h3>
        </div>
        <p className={styles.chartHint}>Количество заказов за выбранный период</p>
      </div>

      <div className={styles.barChartWrap} style={{ height: 280, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.points} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
              tickMargin={12} 
              minTickGap={30} 
            />
            <Tooltip
              cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
              contentStyle={{ borderRadius: '0.6rem', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
              itemStyle={{ color: 'var(--accent)', fontWeight: 500 }}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
              formatter={(value) => [formatNumberValue(Number(value)), "Заказы"]}
            />
            <Bar 
              dataKey="ordersCount" 
              fill="var(--accent)"
              fillOpacity={0.45}
              radius={[4, 4, 0, 0]} 
              maxBarSize={48} 
              activeBar={{ fill: 'var(--accent)', fillOpacity: 0.7 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderBreakdownValue(input: {
  row: {
    count: number;
    revenueAmount: number | null;
    share: number;
  };
  revenueCurrencyCode?: string | null;
  variant: "amount" | "source" | "status";
}) {
  if (input.variant === "source") {
    return (
      <div className={styles.sliceValueBlock}>
        <span className={styles.sliceValuePrimary}>
          {formatNumberValue(input.row.count)} заказа
        </span>
        <span className={styles.sliceValueSecondary}>
          {input.row.revenueAmount !== null
            ? formatMoneyValue({
                amount: input.row.revenueAmount,
                currencyCode: input.revenueCurrencyCode ?? null,
              })
            : "Выручка недоступна"}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.sliceValueBlock}>
      <span className={styles.sliceValuePrimary}>{formatNumberValue(input.row.count)}</span>
      <span className={styles.sliceValueSecondary}>{formatPercentValue(input.row.share)}</span>
    </div>
  );
}

function BreakdownRows(props: {
  rows: Array<{
    count: number;
    key: string;
    label: string;
    revenueAmount: number | null;
    share: number;
  }>;
  revenueCurrencyCode?: string | null;
  subtitle?: string;
  title: string;
  variant: "amount" | "source" | "status";
}) {
  return (
    <article className={styles.sliceCard}>
      <div className={styles.sliceHeader}>
        <h3 className={styles.sliceTitle}>{props.title}</h3>
        {props.subtitle ? <p className={styles.sliceHint}>{props.subtitle}</p> : null}
      </div>

      <div className={styles.sliceRows}>
        {props.rows.map((row) => (
          <div className={styles.sliceRow} key={row.key}>
            <div className={styles.sliceRowTop}>
              <span className={styles.sliceRowLabel}>{row.label}</span>
              {renderBreakdownValue({
                revenueCurrencyCode: props.revenueCurrencyCode,
                row,
                variant: props.variant,
              })}
            </div>
            <div className={styles.sliceTrack}>
              <div
                className={styles.sliceFill}
                style={{ width: `${Math.max(row.share * 100, row.count > 0 ? 8 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function DetailField(props: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.orderDetailField}>
      <span className={styles.orderDetailLabel}>{props.label}</span>
      <span className={styles.orderDetailValue}>{props.value}</span>
    </div>
  );
}

function formatItemPriceMeta(order: DashboardOrder, item: DashboardOrder["items"][number]): string | null {
  const unitPrice =
    item.unitPrice !== null
      ? formatMoneyValue({
          amount: item.unitPrice,
          currencyCode: order.currency,
        })
      : null;
  const lineTotal =
    item.lineTotal !== null
      ? formatMoneyValue({
          amount: item.lineTotal,
          currencyCode: order.currency,
        })
      : null;

  if (item.quantity !== null && item.quantity > 1 && unitPrice && lineTotal) {
    return `${unitPrice}/шт • ${lineTotal}`;
  }

  return lineTotal ?? unitPrice;
}

function OrderDetailsPanel(props: {
  onClose: () => void;
  order: DashboardOrder;
  sourceColumnLabel: string;
}) {
  const orderLabel = formatOperationalOrderLabel(props.order);
  const visibleItems = splitOperationalItems(props.order.items, 5);

  return (
    <aside className={styles.orderDetails}>
      <div className={styles.orderDetailsHeader}>
        <div>
          <p className={styles.panelLabel}>Детали заказа</p>
          <h3 className={styles.orderDetailsTitle}>{orderLabel}</h3>
        </div>
        <button className={styles.closeButton} onClick={props.onClose} type="button">
          Закрыть
        </button>
      </div>

      <div className={styles.orderDetailsAmountBlock}>
        <p className={styles.orderDetailsAmount}>
          {formatMoneyValue({
            amount: props.order.totalSum,
            currencyCode: props.order.currency,
          })}
        </p>
        <div className={styles.orderDetailsMetaRow}>
          {props.order.status ? (
            <span className={styles.subtleBadge}>{props.order.status}</span>
          ) : null}
          <span className={styles.subtleBadge}>{props.order.sourceLabel}</span>
        </div>
      </div>

      <div className={styles.orderDetailsGrid}>
        <DetailField label="Клиент" value={props.order.customerName ?? "Не указан"} />
        <DetailField label="Телефон" value={props.order.phone ?? "Не указан"} />
        <DetailField label="Город" value={props.order.city ?? "Не указан"} />
        <DetailField label={props.sourceColumnLabel} value={props.order.sourceLabel} />
        <DetailField label="Позиций" value={formatNumberValue(props.order.itemCount)} />
        <DetailField label="Единиц товара" value={formatCountValue(props.order.unitsCount)} />
        <DetailField label="Дата" value={formatDateTimeLabel(props.order.createdAt)} />
        {props.order.status ? <DetailField label="Статус" value={props.order.status} /> : null}
      </div>

      <div className={styles.orderItemsBlock}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>Состав заказа</h4>
          <span className={styles.sectionMeta}>
            {formatNumberValue(props.order.itemCount)} позиций
          </span>
        </div>

        {props.order.items.length === 0 ? (
          <p className={styles.orderItemsEmpty}>В сохранённой read-model состав заказа не передан.</p>
        ) : (
          <ul className={styles.orderItemsList}>
            {visibleItems.visibleItems.map((item, index) => (
              <li className={styles.orderItemsRow} key={`${item.productName}-${index}`}>
                <div className={styles.orderItemCopy}>
                  <span className={styles.orderItemName}>{item.productName}</span>
                  {formatItemPriceMeta(props.order, item) ? (
                    <span className={styles.orderItemMeta}>
                      {formatItemPriceMeta(props.order, item)}
                    </span>
                  ) : null}
                </div>
                <span className={styles.orderItemQty}>×{formatCountValue(item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        {visibleItems.hiddenCount > 0 ? (
          <p className={styles.orderItemsMore}>+ ещё {visibleItems.hiddenCount}</p>
        ) : null}
      </div>

      <div className={styles.orderTechnicalBlock}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>Технические идентификаторы</h4>
        </div>
        <div className={styles.orderTechnicalGrid}>
          <DetailField
            label="RetailCRM ID"
            value={String(props.order.retailcrmId)}
          />
          {props.order.externalId ? (
            <DetailField label="External ID" value={props.order.externalId} />
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function getSummaryDeltas(input: {
  current: DashboardSummary;
  previous: DashboardSummary | null;
}) {
  const { current, previous } = input;

  return {
    averageOrderValue: previous
      ? buildDelta({
          current: current.averageOrderValue.amount,
          previous: previous.averageOrderValue.amount,
        })
      : null,
    largeOrdersCount: previous
      ? buildDelta({
          current: current.largeOrdersCount,
          previous: previous.largeOrdersCount,
        })
      : null,
    largeOrdersRevenueShare: previous
      ? buildDelta({
          current: current.largeOrdersRevenueShare,
          previous: previous.largeOrdersRevenueShare,
        })
      : null,
    orderCount: previous
      ? buildDelta({
          current: current.orderCount,
          previous: previous.orderCount,
        })
      : null,
    revenue: previous
      ? buildDelta({
          current: current.revenue.amount,
          previous: previous.revenue.amount,
        })
      : null,
  };
}

export function DashboardView({ dashboard, renderedAt }: DashboardViewProps) {
  const [periodKey, setPeriodKey] = useState<DashboardPeriodKey>("all");
  const [showComparison, setShowComparison] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [onlyLargeOrders, setOnlyLargeOrders] = useState(false);
  const [search, setSearch] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortKey, setSortKey] = useState<"createdAt" | "totalSum">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const deferredSearch = useDeferredValue(search);

  const analytics = useMemo(
    () =>
      buildDashboardAnalytics({
        dashboard,
        filters: {
          customEnd,
          customStart,
          onlyLargeOrders,
          periodKey,
          search: deferredSearch,
          showComparison,
          sortDirection,
          sortKey,
          source,
          status,
        },
        renderedAt,
      }),
    [
      customEnd,
      customStart,
      dashboard,
      deferredSearch,
      onlyLargeOrders,
      periodKey,
      renderedAt,
      showComparison,
      sortDirection,
      sortKey,
      source,
      status,
    ],
  );

  const selectedOrder =
    analytics.filteredOrders.find((order) => order.retailcrmId === selectedOrderId) ?? null;
  const summaryDeltas = getSummaryDeltas({
    current: analytics.currentSummary,
    previous: analytics.previousSummary,
  });

  function resetFilters() {
    setPeriodKey("all");
    setShowComparison(false);
    setStatus("all");
    setSource("all");
    setOnlyLargeOrders(false);
    setSearch("");
    setCustomStart("");
    setCustomEnd("");
    setSortKey("createdAt");
    setSortDirection("desc");
    setCurrentPage(1);
  }

  function toggleSort(nextKey: "createdAt" | "totalSum") {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "createdAt" ? "desc" : "asc");
  }

  const totalItems = analytics.filteredOrders.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedOrders = analytics.filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  // Helper function to reset page to 1 when filter changes
  function updateFilterAndResetPage<T>(updater: (val: T) => void, val: T) {
    updater(val);
    setCurrentPage(1);
  }

  return (
    <section className={styles.dashboardShell}>
      <header className={styles.topbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Дашборд заказов</h1>
          <p className={styles.subtitleLine}>
            Данные из Supabase • Последняя синхронизация:{" "}
            {analytics.freshness.absoluteLabel ?? "нет данных"} • Валюта:{" "}
            {dashboard.currencyCode ?? "смешанная"}
          </p>
        </div>

        <div className={styles.topbarControls}>
          <div className={styles.periodTabs} role="tablist" aria-label="Период дашборда">
            {DASHBOARD_PERIOD_OPTIONS.map((option) => (
              <button
                aria-pressed={isSelectedPeriod(option.key, periodKey)}
                className={`${styles.periodTab} ${
                  isSelectedPeriod(option.key, periodKey) ? styles.periodTabActive : ""
                }`}
                key={option.key}
                onClick={() => setPeriodKey(option.key)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.controlRow}>
            <label className={styles.compareToggle}>
              <input
                checked={showComparison}
                onChange={(event) => setShowComparison(event.target.checked)}
                type="checkbox"
              />
              <span>Сравнить с предыдущим периодом</span>
            </label>

            <button
              aria-expanded={filtersOpen}
              className={`${styles.filterToggle} ${
                filtersOpen ? styles.filterToggleActive : ""
              }`}
              onClick={() => setFiltersOpen((current) => !current)}
              type="button"
            >
              Фильтры
            </button>
          </div>
        </div>
      </header>

      {filtersOpen ? (
        <section className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            <label className={styles.filterField}>
              <span>Статус</span>
              <select onChange={(event) => updateFilterAndResetPage(setStatus, event.target.value)} value={status}>
                <option value="all">Все статусы</option>
                {dashboard.availableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span>Источник / метод</span>
              <select onChange={(event) => updateFilterAndResetPage(setSource, event.target.value)} value={source}>
                <option value="all">Все значения</option>
                {dashboard.availableSources.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.filterField}>
              <span>Крупные заказы</span>
              <label className={styles.fieldToggle}>
                <input
                  checked={onlyLargeOrders}
                  onChange={(event) => updateFilterAndResetPage(setOnlyLargeOrders, event.target.checked)}
                  type="checkbox"
                />
                <span>Только крупные</span>
              </label>
            </div>

            <label className={`${styles.filterField} ${styles.searchField}`}>
              <span>Поиск заказа</span>
              <input
                onChange={(event) => updateFilterAndResetPage(setSearch, event.target.value)}
                placeholder="Номер заказа или external id"
                type="search"
                value={search}
              />
            </label>

            {periodKey === "custom" ? (
              <div className={styles.customRangeFields}>
                <label className={styles.filterField}>
                  <span>С</span>
                  <input
                    onChange={(event) => {
                      setPeriodKey("custom");
                      setCustomStart(event.target.value);
                    }}
                    type="date"
                    value={customStart}
                  />
                </label>
                <label className={styles.filterField}>
                  <span>По</span>
                  <input
                    onChange={(event) => {
                      setPeriodKey("custom");
                      setCustomEnd(event.target.value);
                    }}
                    type="date"
                    value={customEnd}
                  />
                </label>
              </div>
            ) : null}

            <div className={styles.filtersActions}>
              <button className={styles.resetButton} onClick={resetFilters} type="button">
                Сбросить фильтры
              </button>
            </div>
          </div>

          <p className={styles.filtersCaption}>
            Периоды привязаны к последней дате заказа в витрине:{" "}
            {formatPeriodAnchorLabel(analytics.anchorDate)}.
          </p>
        </section>
      ) : null}

      <section className={styles.metricsGrid} aria-label="Ключевые показатели">
        <MetricCard
          delta={summaryDeltas.orderCount}
          subtitle="за выбранный период"
          title="Заказы"
          value={formatNumberValue(analytics.currentSummary.orderCount)}
        />
        <MetricCard
          delta={summaryDeltas.revenue}
          subtitle="сумма по заказам"
          title="Выручка"
          value={formatMoneyValue(analytics.currentSummary.revenue)}
        />
        <MetricCard
          delta={summaryDeltas.averageOrderValue}
          subtitle="среднее по заказу"
          title="Средний чек"
          value={formatMoneyValue(analytics.currentSummary.averageOrderValue)}
        />
        <MetricCard
          delta={summaryDeltas.largeOrdersCount}
          subtitle={`свыше ${formatNumberValue(dashboard.largeOrderThreshold)} KZT`}
          title="Крупные заказы"
          value={formatNumberValue(analytics.currentSummary.largeOrdersCount)}
        />
        <MetricCard
          delta={summaryDeltas.largeOrdersRevenueShare}
          subtitle="от общей выручки"
          title="Доля крупных заказов в выручке"
          value={formatPercentValue(analytics.currentSummary.largeOrdersRevenueShare)}
        />
        <MetricCard
          delta={null}
          subtitle="по времени последней синхронизации"
          title="Актуальность данных"
          value={`обновлено ${analytics.freshness.label}`}
        />
      </section>

      <section className={styles.trendsGrid}>
        <RevenueTrendChart
          currencyCode={analytics.currentSummary.revenue.currencyCode ?? dashboard.currencyCode}
          points={analytics.trendSeries}
        />
        <OrdersTrendChart points={analytics.trendSeries} />
      </section>

      <section className={styles.slicesGrid}>
        <BreakdownRows
          rows={analytics.statusBreakdown}
          title="Заказы по статусам"
          variant="status"
        />
        <BreakdownRows
          revenueCurrencyCode={analytics.currentSummary.revenue.currencyCode ?? dashboard.currencyCode}
          rows={analytics.sourceBreakdown}
          subtitle="Источник берётся из utm_source, если он есть, иначе используется method заказа."
          title="Источник / метод заказа"
          variant="source"
        />
        <BreakdownRows
          rows={analytics.amountBreakdown}
          title="Распределение по сумме заказа"
          variant="amount"
        />
      </section>

      <section
        className={`${styles.tableSection} ${
          selectedOrder ? styles.tableSectionWithDetails : ""
        }`}
      >
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <div>
              <p className={styles.panelLabel}>Заказы</p>
              <h2 className={styles.panelTitle}>Последние или отфильтрованные записи</h2>
            </div>
            <div className={styles.tableMeta}>
              <span>{formatDateRangeLabel({ end: analytics.range.end, start: analytics.range.start })}</span>
              <span>Показано: {formatNumberValue(totalItems)}</span>
            </div>
          </div>

          {analytics.filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>По текущим фильтрам записи не найдены</p>
              <p className={styles.emptyDescription}>
                Измените период, снимите часть ограничений или очистите поисковый запрос.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Заказ</th>
                    <th>
                      <SortButton
                        activeKey={sortKey}
                        direction={sortDirection}
                        label="Дата"
                        onToggle={toggleSort}
                        sortKey="createdAt"
                      />
                    </th>
                    <th>Клиент</th>
                    <th>Товаров</th>
                    <th>Статус</th>
                    <th>
                      <SortButton
                        activeKey={sortKey}
                        direction={sortDirection}
                        label="Сумма"
                        onToggle={toggleSort}
                        sortKey="totalSum"
                      />
                    </th>
                    <th>{dashboard.sourceColumnLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      className={selectedOrderId === order.retailcrmId ? styles.selectedRow : ""}
                      key={order.retailcrmId}
                      onClick={() => setSelectedOrderId(order.retailcrmId)}
                    >
                      <td>
                        <div className={styles.orderIdentity}>
                          <span className={styles.orderNumber}>
                            {formatOperationalOrderLabel(order)}
                          </span>
                        </div>
                      </td>
                      <td>{formatDateLabel(order.createdAt)}</td>
                      <td>{order.customerName ?? "Не указан"}</td>
                      <td>{formatNumberValue(order.itemCount)}</td>
                      <td>{order.status ?? "Не указан"}</td>
                      <td>
                        <div className={styles.amountWrap}>
                          <span>
                            {formatMoneyValue({
                              amount: order.totalSum,
                              currencyCode: order.currency,
                            })}
                          </span>
                          {order.isLargeOrder ? (
                            <span className={styles.largeIcon} title="Крупный заказ">
                              ★
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{order.sourceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 || totalItems > 10 ? (
                <div className={styles.paginationControls}>
                  <p className={styles.paginationText}>
                    Страница {safeCurrentPage} из {totalPages}
                  </p>
                  
                  <div className={styles.paginationActions}>
                    <label className={styles.rowsPerPageSelect}>
                      Показывать по:
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </label>
                    <div className={styles.paginationButtons}>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        aria-label="Предыдущая страница"
                      >
                        Назад
                      </button>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Следующая страница"
                      >
                        Вперед
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {selectedOrder ? (
          <OrderDetailsPanel
            onClose={() => setSelectedOrderId(null)}
            order={selectedOrder}
            sourceColumnLabel={dashboard.sourceColumnLabel}
          />
        ) : null}
      </section>
    </section>
  );
}
