"use client";

import { useDeferredValue, useMemo, useState } from "react";

import {
  buildDashboardAnalytics,
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardOrder,
  type DashboardPeriodKey,
  type DashboardReadModel,
  type DashboardSummary,
} from "@/lib/dashboard";

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

function shouldRenderAxisLabel(index: number, total: number): boolean {
  if (total <= 7) {
    return true;
  }

  if (total <= 14) {
    return index % 2 === 0 || index === total - 1;
  }

  if (total <= 24) {
    return index % 4 === 0 || index === total - 1;
  }

  return index % 6 === 0 || index === total - 1;
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
      <p className={styles.metricValue}>{props.value}</p>
      <p className={styles.metricSupport}>{props.subtitle}</p>
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
          <p className={styles.chartHint}>После первой синхронизации график начнёт строиться из Supabase.</p>
        </div>
      </div>
    );
  }

  const values = props.points.map((point) => point.revenueAmount ?? 0);
  const maxValue = Math.max(...values, 1);
  const coordinates = props.points.map((point, index) => {
    const x = props.points.length === 1 ? 50 : (index / (props.points.length - 1)) * 100;
    const y = 92 - ((point.revenueAmount ?? 0) / maxValue) * 72;

    return { ...point, x, y };
  });
  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${coordinates.at(-1)?.x ?? 100} 92 L ${coordinates[0]?.x ?? 0} 92 Z`;
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

      <div className={styles.lineChartWrap}>
        <svg
          aria-hidden="true"
          className={styles.lineChart}
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(27, 102, 95, 0.32)" />
              <stop offset="100%" stopColor="rgba(27, 102, 95, 0)" />
            </linearGradient>
          </defs>
          <path className={styles.lineChartArea} d={areaPath} />
          <path className={styles.lineChartStroke} d={linePath} />
          {coordinates.map((point) => (
            <circle
              className={styles.lineChartPoint}
              cx={point.x}
              cy={point.y}
              key={point.key}
              r="1.8"
            />
          ))}
        </svg>

        <div className={styles.chartAxis}>
          {props.points.map((point, index) => (
            <span className={styles.chartAxisLabel} key={point.key}>
              {shouldRenderAxisLabel(index, props.points.length) ? point.label : ""}
            </span>
          ))}
        </div>
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
  const maxValue = Math.max(...values, 1);
  const isFlat = values.every((value) => value === values[0]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartMeta}>
        <div>
          <p className={styles.chartLabel}>Заказы по дням</p>
          <h3 className={styles.chartTitle}>{formatNumberValue(values.reduce((sum, value) => sum + value, 0))}</h3>
        </div>
        <p className={styles.chartHint}>Количество заказов за выбранный период</p>
      </div>

      <div className={styles.barChartWrap}>
        <div className={styles.barChart}>
          {props.points.map((point, index) => (
            <div className={styles.barChartColumnWrap} key={point.key}>
              <span className={styles.barChartValue}>{point.ordersCount}</span>
              <div
                className={styles.barChartColumn}
                style={{
                  height: `${Math.max((point.ordersCount / maxValue) * 100, point.ordersCount > 0 ? 12 : 0)}%`,
                }}
              />
              <span className={styles.barChartLabel}>
                {shouldRenderAxisLabel(index, props.points.length) ? point.label : ""}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.barChartFootnote}>
          {isFlat
            ? "Поток ровный, поэтому график работает как компактная контрольная линия, а не как крупная декоративная сетка."
            : "При длинном периоде данные автоматически собираются по неделям или месяцам."}
        </p>
      </div>
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
              <span className={styles.sliceRowValue}>
                {props.variant === "source" && row.revenueAmount !== null
                  ? `${formatNumberValue(row.count)} · ${formatMoneyValue({
                      amount: row.revenueAmount,
                      currencyCode: props.revenueCurrencyCode ?? null,
                    })}`
                  : `${formatNumberValue(row.count)} · ${formatPercentValue(row.share)}`}
              </span>
            </div>
            <div className={styles.sliceTrack}>
              <div
                className={styles.sliceFill}
                style={{ width: `${Math.max(row.share * 100, row.count > 0 ? 10 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function OrderDetailsPanel(props: {
  onClose: () => void;
  order: DashboardOrder;
  sourceColumnLabel: string;
}) {
  return (
    <aside className={styles.orderDetails}>
      <div className={styles.orderDetailsHeader}>
        <div>
          <p className={styles.panelLabel}>Детали заказа</p>
          <h3 className={styles.orderDetailsTitle}>{props.order.number ?? `#${props.order.retailcrmId}`}</h3>
        </div>
        <button className={styles.closeButton} onClick={props.onClose} type="button">
          Закрыть
        </button>
      </div>

      <dl className={styles.orderDetailsGrid}>
        <div className={styles.orderDetailsRow}>
          <dt>External ID</dt>
          <dd>{props.order.externalId ?? `retailcrm:${props.order.retailcrmId}`}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Дата</dt>
          <dd>{formatDateLabel(props.order.createdAt)}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Статус</dt>
          <dd>{props.order.status ?? "Не указан"}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Сумма</dt>
          <dd>
            {formatMoneyValue({
              amount: props.order.totalSum,
              currencyCode: props.order.currency,
            })}
          </dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>{props.sourceColumnLabel}</dt>
          <dd>{props.order.sourceLabel}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Позиций</dt>
          <dd>{formatNumberValue(props.order.itemCount)}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Крупный заказ</dt>
          <dd>{props.order.isLargeOrder ? "Да" : "Нет"}</dd>
        </div>
        <div className={styles.orderDetailsRow}>
          <dt>Синхронизирован</dt>
          <dd>{formatDateLabel(props.order.syncedAt)}</dd>
        </div>
      </dl>

      <div className={styles.orderItemsBlock}>
        <p className={styles.orderItemsTitle}>Состав заказа</p>
        {props.order.items.length === 0 ? (
          <p className={styles.orderItemsEmpty}>В сохранённом raw payload позиции не переданы.</p>
        ) : (
          <ul className={styles.orderItemsList}>
            {props.order.items.map((item, index) => (
              <li className={styles.orderItemsRow} key={`${item.productName}-${index}`}>
                <span>{item.productName}</span>
                <span>
                  {item.quantity !== null ? `${formatNumberValue(item.quantity)} шт` : "кол-во н/д"}
                </span>
              </li>
            ))}
          </ul>
        )}
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
  }

  function toggleSort(nextKey: "createdAt" | "totalSum") {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "createdAt" ? "desc" : "asc");
  }

  return (
    <section className={styles.dashboardShell}>
      <header className={styles.topbar}>
        <div className={styles.titleBlock}>
          <p className={styles.topbarLabel}>Операционный overview</p>
          <h1 className={styles.pageTitle}>Дашборд заказов</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaChip}>Данные из Supabase</span>
            <span className={styles.metaChip}>
              Последняя синхронизация: {analytics.freshness.absoluteLabel ?? "нет данных"}
            </span>
            <span className={styles.metaChip}>Валюта: {dashboard.currencyCode ?? "смешанная"}</span>
          </div>
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

          <label className={styles.switchRow}>
            <input
              checked={showComparison}
              onChange={(event) => setShowComparison(event.target.checked)}
              type="checkbox"
            />
            <span>Сравнить с предыдущим периодом</span>
          </label>

          <button
            aria-expanded={filtersOpen}
            className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleActive : ""}`}
            onClick={() => setFiltersOpen((current) => !current)}
            type="button"
          >
            Фильтры
          </button>
        </div>
      </header>

      {filtersOpen ? (
        <section className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            <label className={styles.filterField}>
              <span>Период</span>
              <select onChange={(event) => setPeriodKey(event.target.value as DashboardPeriodKey)} value={periodKey}>
                {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span>Статус</span>
              <select onChange={(event) => setStatus(event.target.value)} value={status}>
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
              <select onChange={(event) => setSource(event.target.value)} value={source}>
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
              <label className={styles.switchRow}>
                <input
                  checked={onlyLargeOrders}
                  onChange={(event) => setOnlyLargeOrders(event.target.checked)}
                  type="checkbox"
                />
                <span>Только крупные</span>
              </label>
            </div>

            <label className={`${styles.filterField} ${styles.searchField}`}>
              <span>Поиск заказа</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Номер или external id"
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
            ) : (
              <div className={styles.filtersActions}>
                <button
                  className={styles.resetButton}
                  onClick={resetFilters}
                  type="button"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
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

      <section className={styles.tableSection}>
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <div>
              <p className={styles.panelLabel}>Заказы</p>
              <h2 className={styles.panelTitle}>Последние или отфильтрованные записи</h2>
            </div>
            <div className={styles.tableMeta}>
              <span>{formatDateRangeLabel({ end: analytics.range.end, start: analytics.range.start })}</span>
              <span>Показано: {formatNumberValue(analytics.filteredOrders.length)}</span>
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
                    <th>Позиций</th>
                    <th>Крупный</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.filteredOrders.map((order) => (
                    <tr
                      className={selectedOrderId === order.retailcrmId ? styles.selectedRow : ""}
                      key={order.retailcrmId}
                      onClick={() => setSelectedOrderId(order.retailcrmId)}
                    >
                      <td>
                        <div className={styles.orderIdentity}>
                          <span className={styles.orderNumber}>
                            {order.number ?? `#${order.retailcrmId}`}
                          </span>
                          <span className={styles.orderExternalId}>
                            {order.externalId ?? `retailcrm:${order.retailcrmId}`}
                          </span>
                        </div>
                      </td>
                      <td>{formatDateLabel(order.createdAt)}</td>
                      <td>{order.status ?? "Не указан"}</td>
                      <td>
                        {formatMoneyValue({
                          amount: order.totalSum,
                          currencyCode: order.currency,
                        })}
                      </td>
                      <td>{order.sourceLabel}</td>
                      <td>{formatNumberValue(order.itemCount)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            order.isLargeOrder ? styles.badgeStrong : styles.badgeMuted
                          }`}
                        >
                          {order.isLargeOrder ? "Да" : "Нет"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
