# MITC Voucher Dashboard

**Path:** `/Users/dylan.dias/PycharmProjects/vouchers/`

Interactive dashboard from `voucher_new.xlsx`:
- **Users Demo** — distinct users (`um_uuid`) by state (bar chart), MITC / NON-MITC, age, gender, state filters
- **India map** — MITC voucher counts by state (pincode → state), state labels, full map

## Quick start

```bash
cd /Users/dylan.dias/PycharmProjects/vouchers/mitc_voucher_map
../.venv/bin/python generate_map.py   # or: python3 generate_map.py
python3 -m http.server 8000
```

Open http://localhost:8000/

## Files

| File | Purpose |
|------|---------|
| `../voucher_new.xlsx` | Source data |
| `generate_map.py` | Builds `data.js` |
| `data.js` | Generated (do not edit by hand) |
| `index.html` | Dashboard UI |
| `script.js` | Map + Users Demo charts |
| `style.css` | Styles |

## Regenerate after Excel changes

```bash
cd /Users/dylan.dias/PycharmProjects/vouchers/mitc_voucher_map
python3 generate_map.py
```

## Deploy live

See **[DEPLOY.md](../DEPLOY.md)** in the project root for GitHub Pages, Netlify, or Vercel.

Quick path: push `mitc_voucher_map/` to GitHub and enable **Pages → GitHub Actions**.

## Data notes

- **Map:** `mitc_flag = MITC` only; state from `current_zipCode`
- **Users Demo:** MITC + NON-MITC; NON-MITC rows often have no pincode → **No pincode / Unknown** state bucket
- **Genders** standardized to: Female, Male, Others, Unknown
- Latest run: ~22,105 MITC vouchers, ~24,061 user demo rows, 35 states with voucher data
