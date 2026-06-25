# 📊 MacroMind Regime Detector

> Real-time market regime intelligence and sentiment analysis system for Crypto & Stocks, featuring AI-grounded scans, live Bitget data, and an interactive paper trading desk.


---

## 🚀 Project Overview

The **MacroMind Market Regime Detector** is a high-fidelity quantitative analysis terminal designed to process, classify, and visualize complex multi-asset market dynamics. By evaluating real-time indicators like the VIX, credit spreads, moving averages, and news sentiment, the terminal automatically determines the current market regime across **Stocks & Cryptocurrencies**. 

Integrating the advanced **Gemini 3.5 Flash** model with Google Search Grounding, the platform analyzes live economic events and sentiment feeds to generate real-time briefings, historical analogues, and directional probability models.

---
🔗 **Live Application:** [https://project-file-explorer-1005046078978.asia-southeast1.run.app](https://project-file-explorer-1005046078978.asia-southeast1.run.app)
---

## 🌟 Key Capabilities

### 🔍 1. Market Regime Analysis
The system evaluates the financial environment to classify conditions into four core regimes:
*   **Risk-On:** Outright market optimism with expanding liquidity, low volatility, and high risk appetite.
*   **Risk-Off:** Systematic deleveraging, flight to safe-haven assets, spiking VIX, and widening credit spreads.
*   **Trending:** Continuous, orderly directional momentum backed by institutional accumulation.
*   **Ranging:** Directionless horizontal consolidation and mean-reverting distribution phase.

### 🎙️ 2. AI Analyst Chat & Google Search Grounding
*   **Contextual Agent:** Interact with a specialized quantitative analyst agent powered by the `@google/genai` SDK on the Express backend.
*   **Real-time Grounding:** The backend queries current global news using Gemini's live **Google Search tool** to retrieve real-world articles from Bloomberg, Reuters, CNBC, and CoinDesk, returning direct, verified citations and sentiment scores.
*   **High-Fidelity Simulation Fallback:** If `GEMINI_API_KEY` is not present, the terminal seamlessly falls back to a realistic financial simulation mode so the system remains fully interactive.

### 📈 3. Interactive Paper Trading Desk
*   Test and refine trading strategies directly inside the terminal.
*   Fully functional local portfolio tracker with initial cash balances ($10,000 for Crypto, $100,000 for Stocks).
*   Live position management: buy, sell, track unrealized PnL, average entry price, and manage historical order logs.

### 📊 4. Interactive Data Visualizations
*   **Regime Matrix Grid:** Multi-indicator dials tracking VIX percentiles, bond yields, stablecoin inflows, and dominance ratios.
*   **Sentiment Metrics Panel:** Real-time rolling sentiment gauges, active social buzz trackers, and word cloud trend models.
*   **Historical Timeline Chart:** Interactive line charts detailing regime shifts against market price benchmarks over a 30-day trailing window.

### 🖥️ 5. Pro-Terminal Layout Customization
*   **Fluid Widescreen Toggle:** Shift instantly between a focused, boxed layout (standard container) and an expanded widescreen fluid view that spreads out across multi-monitor setups.
*   **Native Fullscreen Integration:** Standardized header-controls supporting full browser-level immersion with single-click actions.

---

## 🛠️ Architecture & Tech Stack

### Frontend (Client-side)
*   **Framework:** React 18 + Vite + TypeScript.
*   **Styling:** Tailwind CSS with fluid responsive designs.
*   **Animations:** Smooth state transition animations.
*   **Visualizations:** Highly customizable `recharts` for timeline rendering and indicators.
*   **Icons:** Hand-picked professional indicators from `lucide-react`.

### Backend (Server-side)
*   **Framework:** Express.js.
*   **Compiler/Bundler:** `tsx` for fast development cycles, and `esbuild` compiling the backend into a standalone, safe CommonJS module (`dist/server.cjs`) for low-latency production execution.
*   **AI SDK:** `@google/genai` TypeScript SDK utilizing the `gemini-3.5-flash` model.
*   **Search Grounding:** Live search integration with strict fallback policies and cache management to optimize latency and mitigate quota constraints.

---

## 📂 Project Directory Structure

```text
├── server.ts                 # Full-stack Express.js server entry point with Gemini API
├── vite.config.ts            # Vite bundler configuration
├── metadata.json             # App registration and permissions manifest
├── package.json              # Dependencies and compilation script definitions
├── src/
│   ├── App.tsx               # Main application layout, state orchestrator, and UI
│   ├── main.tsx              # React mounting root
│   ├── index.css             # Tailwinds import and typography settings
│   ├── types.ts              # Global TypeScript interfaces, regimes, and types
│   ├── templates.ts          # Mock analysis templates and historical analogue data
│   ├── components/           # Extracted UI components (AnalystChat, PaperTradingDesk, etc.)
│   └── utils/                # Helper functions for calculation and formatting
```

---

## ⚙️ Setup & Local Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (Version 18+ recommended)

### Step 1: Install Dependencies
Run the installation script in the project root:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory and append your API secrets:
```env
# Optional: Secure your API key on the backend
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*Note: If no key is supplied, the application automatically boots into simulated high-fidelity mode, which matches real-world historical indicators.*

### Step 3: Run the Development Server
Launch the full-stack server under hot reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Step 4: Build for Production
To bundle and compile the application for production deployment:
```bash
npm run build
```
This builds static assets into `/dist` and compiles `server.ts` into a fast, standalone `dist/server.cjs` file.

To run the production-built bundle:
```bash
npm start
```

---

## 📜 Licensing & Usage
Built under the **MacroMind Quantitative Research Group** frameworks in Google AI Studio. 

All real-time ticker quotes and feeds are sourced from live endpoints or verified search queries. Always exercise sound risk-management protocols; simulated paper trading does not constitute certified financial advice.
