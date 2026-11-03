# Building Completion Estimating Web App

A modern, fast, client-side construction estimating and Bill of Quantities (BOQ) application designed specifically for **physical assembly and architectural finishes**. Fully optimized for zero-cost, static hosting on **GitHub Pages**.

---

## 🛠 Features

- **10 Technical Trade Tabs (27 Sub-Scopes)**:
  1. `01` **Earthworks & Temporary Works**: Site preparation, fence/office, excavation, backfill compaction, gravel bedding.
  2. `02` **Concrete & Masonry Works**: Ready-mix structural concrete, rebar tying, formworks & shoring, CHB masonry & plaster.
  3. `03` **Waterproofing & Moisture Protection**: Polyethylene vapor barrier, wet areas & balconies, torch-on roof deck membrane.
  4. `04` **Structural Steel and Roofing Works**: Steel trusses, C-purlins, pre-painted roofing, SS gutters, thermal insulation.
  5. `05` **Carpentry and Drywall Works**: Gypsum ceiling systems, drywall partitions, acoustic cavity insulation, built-in millwork.
  6. `06` **Doors, Windows & Architectural Metals**: Entry/interior doors, aluminum/glass windows, stainless stair & balcony railings.
  7. `07` **Finishes and Painting Works**: Porcelain & anti-slip tiles, vinyl flooring, skim coat rendering, multi-surface painting.
  8. `08` **Plumbing Rough-In Works**: PPR water lines, uPVC sanitary drainage, floor drains, vent stacks, hydrostatic testing.
  9. `09` **Electrical Rough-In Works**: Embedded uPVC conduits & utility boxes, THHN copper wire pulling, grounding & megger testing.
  10. `10` **Mechanical & Fire Protection Works**: Inverter AC copper lines, sprinkler loop piping, fire alarm wiring, firestop penetration seals.
- **Consolidated Master Summary**:
  - Live trade-by-trade rollup.
  - Material vs. Labor vs. Equipment cost allocation breakdown.
  - Compounding or additive project markups: Overhead/OCM %, Contractor's Profit %, Tax/VAT %.
  - Cost per floor area KPI ($/m² or $/sq.ft).
  - Pure SVG Donut and Bar charts.
- **Single-File Consolidation & Export**:
  - **Multi-Sheet Excel (`.xlsx`)**: Sheet 1 is the Consolidated Summary, Sheets 2–11 are individual trade BOQ tables with formatted columns and totals.
  - **Single Portable JSON (`.json`)**: Save, backup, and restore project estimates with zero data loss.
  - **Print / PDF Proposal**: Clean, professional client-ready layout automatically activated when clicking "Print".
- **Local Persistence**:
  - Continuous automatic saving to browser `localStorage`. Edits persist across page refreshes.

---

## 🚀 Getting Started Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

3. **Run automated test suite**:
   ```bash
   npm run test:run
   ```

4. **Build production bundle**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub Pages

This app is configured to deploy directly to GitHub Pages using GitHub Actions:

1. **Initialize Git & Commit**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete building completion estimating app"
   ```

2. **Connect to your GitHub Repository**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - In your GitHub repo, go to **Settings** > **Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
   - The included workflow `.github/workflows/deploy.yml` will automatically build, test, and publish your web app!
