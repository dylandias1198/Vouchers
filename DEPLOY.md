# Deploy the MITC Voucher Dashboard live

**Repository:** [github.com/dylandias1198/Vouchers](https://github.com/dylandias1198/Vouchers)

**Live URL (after Pages is enabled):** [https://dylandias1198.github.io/Vouchers/](https://dylandias1198.github.io/Vouchers/)

The dashboard is a **static site** (no server code). It is hosted via **GitHub Pages** from the `mitc_voucher_map/` folder.

## Before you deploy

1. **Regenerate data** (after Excel changes):
   ```bash
   cd mitc_voucher_map
   ../.venv/bin/python generate_map.py
   ```

2. **Privacy:** `data.js` contains aggregated voucher/user statistics. Use a **private** GitHub repo or get approval before a public URL.

3. **Do not commit** `voucher_new.xlsx` (ignored in `.gitignore`). The live site uses `data.js` and `lifetime-histograms.js` only.

---

## Option A — GitHub Pages (your repo)

### One-time setup

From Terminal:

```bash
cd /Users/dylan.dias/PycharmProjects/vouchers
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

Or manually:

```bash
cd /Users/dylan.dias/PycharmProjects/vouchers
python3 mitc_voucher_map/generate_map.py
git init
git remote add origin https://github.com/dylandias1198/Vouchers.git
git add .gitignore .github mitc_voucher_map netlify.toml DEPLOY.md deploy-to-github.sh run_dashboard.sh
git commit -m "Add MITC voucher dashboard for GitHub Pages"
git branch -M main
git push -u origin main
```

On GitHub: open [Settings → Pages](https://github.com/dylandias1198/Vouchers/settings/pages) → **Build and deployment** → **Source: GitHub Actions**.

After the “Deploy dashboard to GitHub Pages” workflow completes (~1 min):

**https://dylandias1198.github.io/Vouchers/**

### Update the live site

```bash
cd mitc_voucher_map && python3 generate_map.py && cd ..
git add mitc_voucher_map/data.js mitc_voucher_map/lifetime-histograms.js
git commit -m "Refresh dashboard data"
git push
```

---

## Option B — Netlify (fastest, no GitHub Actions)

1. Install CLI: `npm install -g netlify-cli`
2. From project root:
   ```bash
   cd /Users/dylan.dias/PycharmProjects/vouchers
   netlify deploy --prod --dir=mitc_voucher_map
   ```
3. Log in when prompted; Netlify prints a public URL like `https://something.netlify.app`.

Or drag the **`mitc_voucher_map`** folder onto [https://app.netlify.com/drop](https://app.netlify.com/drop).

---

## Option C — Vercel

```bash
npm i -g vercel
cd /Users/dylan.dias/PycharmProjects/vouchers
vercel --prod mitc_voucher_map
```

---

## Option D — Quick share (temporary, ~few hours)

```bash
cd mitc_voucher_map
python3 -m http.server 8000
# In another terminal:
npx localtunnel --port 8000
```

Use only for quick demos; not for production.

---

## Requirements for any host

- HTTPS (GitHub/Netlify/Vercel provide this)
- Internet access for Highcharts CDN (`code.highcharts.com`)
- India map loads from `code.highcharts.com/mapdata/...`
