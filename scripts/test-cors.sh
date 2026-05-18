#!/usr/bin/env bash
#
# test-cors.sh — verify CORS headers on /api/public/* and /api/admin/*
#
# Acceptance: requests with Origin: https://adalegallink.com receive
# Access-Control-Allow-Origin in the response. Requests with disallowed
# origins do NOT receive the header.
#
# Encodes /plan Phase 0 acceptance criterion #7 (CORS configured).
#
# Usage:
#   ./scripts/test-cors.sh https://ada.adalegallink.com
#   ./scripts/test-cors.sh http://localhost:3000   # local dev

set -euo pipefail

BASE="${1:-https://ada.adalegallink.com}"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == *"$expected"* ]]; then
    echo "  ✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $desc"
    echo "    expected to contain: $expected"
    echo "    got: $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "Testing CORS on $BASE"
echo ""

echo "Test 1: Allowed origin (adalegallink.com) on /api/public/listings"
HEADERS=$(curl -sI -H "Origin: https://adalegallink.com" "$BASE/api/public/listings" || true)
check "Returns Access-Control-Allow-Origin: https://adalegallink.com" \
  "Access-Control-Allow-Origin: https://adalegallink.com" \
  "$HEADERS"
echo ""

echo "Test 2: Preflight OPTIONS on /api/public/listings"
HEADERS=$(curl -sI -X OPTIONS \
  -H "Origin: https://adalegallink.com" \
  -H "Access-Control-Request-Method: GET" \
  "$BASE/api/public/listings" || true)
check "OPTIONS returns Access-Control-Allow-Methods" \
  "Access-Control-Allow-Methods" \
  "$HEADERS"
echo ""

echo "Test 3: Disallowed origin gets no CORS header"
HEADERS=$(curl -sI -H "Origin: https://evil.example.com" "$BASE/api/public/listings" || true)
if [[ "$HEADERS" == *"Access-Control-Allow-Origin"* ]]; then
  echo "  ✗ Disallowed origin should NOT get Access-Control-Allow-Origin"
  echo "    got: $HEADERS"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ Disallowed origin correctly receives no CORS header"
  PASS=$((PASS + 1))
fi
echo ""

echo "Test 4: localhost dev origin allowed"
HEADERS=$(curl -sI -H "Origin: http://localhost:5173" "$BASE/api/public/listings" || true)
check "localhost:5173 receives Access-Control-Allow-Origin" \
  "Access-Control-Allow-Origin: http://localhost:5173" \
  "$HEADERS"
echo ""

echo "Result: $PASS passed, $FAIL failed"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
