#!/usr/bin/env bash

set -euo pipefail

required_files=(
  "AGENTS.md"
  "docs/PROJECT_CONTEXT.md"
  "docs/SPEC.md"
  "docs/ARCHITECTURE.md"
  "docs/PLAN.md"
  "docs/STATE.md"
  "docs/CHRONICLE.md"
  "docs/DATA_MODEL.md"
  "docs/SECURITY_MODEL.md"
  "docs/DEPLOYMENT.md"
  "docs/TEST_STRATEGY.md"
  "docs/ADR/ADR-001-system-shape.md"
  "docs/ADR/ADR-002-sync-strategy.md"
  "docs/ADR/ADR-003-alerting-strategy.md"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done
