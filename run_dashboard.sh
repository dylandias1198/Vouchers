#!/bin/bash
# Run from PyCharm project: /Users/dylan.dias/PycharmProjects/vouchers
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
MAP="$ROOT/mitc_voucher_map"
PY="${ROOT}/.venv/bin/python"
[ -x "$PY" ] || PY=python3

echo "Regenerating data.js..."
"$PY" "$MAP/generate_map.py"

echo ""
echo "Starting server at http://localhost:8000/"
echo "Press Ctrl+C to stop."
cd "$MAP"
python3 -m http.server 8000
