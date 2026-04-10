# ADR 006: Using Recharts for Analytical Dashboards

## Context

The initial architectural constraints specified in `AGENTS.md` and enforced in earlier M-phases favored pure, zero-dependency SVG logic (or no client-side charting at all) to keep the repository un-bloated, minimizing maintenance and maximizing the clarity of the Supabase read-only flow.

However, during M8 execution, it became clear that creating a premium SaaS-tier dashboard ("дорого и профессионально" / "expensive and professional") requires interactivity, tooltips, resizing, animations, and precise pixel management for axes that cannot easily be hand-written in pure React+SVG without slowly rebuilding an ad-hoc graphing library.

## Decision

We will introduce the `recharts` library as our single explicit exception for client-side analytical rendering.

## Rationale
- **Visual Maturity**: Supports AreaCharts with SVG gradients, BarCharts with rounded corners, and complex multi-layered tooltips that react to hover events smoothly.
- **Maintainability**: Replacing custom scaling math with a proven component library reduces bugs.
- **Dependency Scope**: The scope is strictly bound to `app/dashboard-view.tsx`. We will continue fetching all data directly from the Supabase read-model without inventing client-side data stores.

## Consequences
- Requires `app/dashboard-view.tsx` to remain a Next.js Client Component (`"use client"`), which it already is.
- Increases the bundle size slightly, but the cost is justified by the UI polish objective.
