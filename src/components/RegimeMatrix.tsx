import React from "react";
import { MarketRegime, RegimeAnalysis } from "../types";
import { Grid3X3, ArrowRight, ShieldAlert, BadgeInfo, TrendingUp, Sparkles } from "lucide-react";

interface RegimeMatrixProps {
  analysis: RegimeAnalysis;
}

interface MatrixCell {
  row: number; // 0=High Vol, 1=Medium Vol, 2=Low Vol
  col: number; // 0=Bearish, 1=Neutral, 2=Bullish
  volatilityLabel: "HIGH" | "NORMAL" | "LOW";
  sentimentLabel: "BEARISH" | "NEUTRAL" | "BULLISH";
  title: string;
  regime: MarketRegime | null;
  colorClass: string;
  glowColor: string;
  bgActiveClass: string;
  description: string;
  tacticalPlaybook: string;
  targetAssets: string[];
}

export default function RegimeMatrix({ analysis }: RegimeMatrixProps) {
  const [selectedCell, setSelectedCell] = React.useState<MatrixCell | null>(null);

  const matrixCells: MatrixCell[] = [
    // --- ROW 0: HIGH VOLATILITY ---
    {
      row: 0,
      col: 0,
      volatilityLabel: "HIGH",
      sentimentLabel: "BEARISH",
      title: "Systemic Panic / Capitulation",
      regime: MarketRegime.RISK_OFF,
      colorClass: "border-rose-850 text-rose-400 hover:border-rose-500",
      glowColor: "rgba(244, 63, 94, 0.25)",
      bgActiveClass: "bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
      description: "Aggressive deleveraging driven by macro liquidation events. Sentiment is collapsed into extreme fear while the volatility index is spiked into critical percentiles.",
      tacticalPlaybook: "Immediate risk-reduction. Hedging overlays become self-funding. Establish cash dominance or select sovereign debt and gold buffers.",
      targetAssets: ["BIL (T-Bills)", "GLD (Gold)", "VIX calls", "USD Cash"]
    },
    {
      row: 0,
      col: 1,
      volatilityLabel: "HIGH",
      sentimentLabel: "NEUTRAL",
      title: "Systematic Hedging / Pinning",
      regime: null,
      colorClass: "border-amber-950 text-amber-500 hover:border-amber-700",
      glowColor: "rgba(245, 158, 11, 0.15)",
      bgActiveClass: "bg-amber-950/30 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
      description: "Aggressive volatility spikes occurring on major structured options expirations or neutral macro data prints, resulting in rapid index level sweeps with no clear directional commitment.",
      tacticalPlaybook: "Trade the volatility boundaries. Sell tail risk while maintaining tight stop controls. Focus on long volatility arbitrage structures.",
      targetAssets: ["VIX Position", "Straddles / Strangles", "Highly liquid index puts"]
    },
    {
      row: 0,
      col: 2,
      volatilityLabel: "HIGH",
      sentimentLabel: "BULLISH",
      title: "Climax Blowoff / Speculative FOMO",
      regime: null,
      colorClass: "border-purple-950 text-purple-400 hover:border-purple-700",
      glowColor: "rgba(168, 85, 247, 0.15)",
      bgActiveClass: "bg-purple-950/30 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
      description: "Maximum speculative buying coinciding with wide daily trading ranges. Highly leveraged retailers chase momentum as indices make vertical blowoff moves.",
      tacticalPlaybook: "Trail stops aggressively. Avoid entering massive fresh long positions. Harvest high implied option premiums on calls.",
      targetAssets: ["High-Beta tech", "Call options", " leveraged growth indexes"]
    },

    // --- ROW 1: NORMAL/MEDIUM VOLATILITY ---
    {
      row: 1,
      col: 0,
      volatilityLabel: "NORMAL",
      sentimentLabel: "BEARISH",
      title: "Controlled Distribution",
      regime: null,
      colorClass: "border-orange-950 text-orange-400 hover:border-orange-700",
      glowColor: "rgba(251, 146, 60, 0.15)",
      bgActiveClass: "bg-orange-950/30 border-orange-500/60 shadow-[0_0_12px_rgba(251,146,60,0.2)]",
      description: "Smart money systematically lightens exposure under the cover of moderate volume. Volatility shows steady, controlled elevation but no outright spikes.",
      tacticalPlaybook: "Maintain elevated cash levels. Sell rallies into key overhead resistance points. Transition into consumer staples and defensives.",
      targetAssets: ["XLP (Consumer Staples)", "SH (Short S&P 500)", "Fixed Income"]
    },
    {
      row: 1,
      col: 1,
      volatilityLabel: "NORMAL",
      sentimentLabel: "NEUTRAL",
      title: "Mean-Reverting Range / Chop",
      regime: MarketRegime.RANGING,
      colorClass: "border-blue-900 text-blue-400 hover:border-blue-500",
      glowColor: "rgba(59, 130, 246, 0.25)",
      bgActiveClass: "bg-blue-950/40 border-blue-505/80 ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      description: "A balanced marketplace with no clear macroeconomic consensus. High-low range levels remain remarkably reliable. Volatility sits near its 50th percentile.",
      tacticalPlaybook: "Execute mean-reversion strategies. Sell resistance and buy support bounds. Implement premium-decay yield protocols (Covered Calls, Iron Condors).",
      targetAssets: ["JEPI (Premium income)", "Consolidated Large Caps", "Range Options"]
    },
    {
      row: 1,
      col: 2,
      volatilityLabel: "NORMAL",
      sentimentLabel: "BULLISH",
      title: "Accelerating Bullish Momentum",
      regime: MarketRegime.TRENDING,
      colorClass: "border-amber-800 text-amber-300 hover:border-amber-400",
      glowColor: "rgba(245, 158, 11, 0.25)",
      bgActiveClass: "bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-550/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      description: "Healthy expansion backed by positive corporate earings or monetary liquidity tailwinds. Trends are highly orderly with standard minor pullbacks.",
      tacticalPlaybook: "Buy pullbacks to the short-term moving averages. Stay aligned with momentum asset classes. Avoid shorting broad indices.",
      targetAssets: ["SPY (S&P Index)", "QQQ (Nasdaq Group)", "IWM (Russell 2000)"]
    },

    // --- ROW 2: LOW VOLATILITY ---
    {
      row: 2,
      col: 0,
      volatilityLabel: "LOW",
      sentimentLabel: "BEARISH",
      title: "Complacent Decay / Apathy",
      regime: null,
      colorClass: "border-indigo-950 text-indigo-400 hover:border-indigo-850",
      glowColor: "rgba(99, 102, 241, 0.1)",
      bgActiveClass: "bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
      description: "Dull, unparticipated downward drift. Market sentiment is unenthusiastic but lack of major catalysts keeps volatility from expanding, grinding sellers.",
      tacticalPlaybook: "Focus on yield-generating money markets. Avoid buying low-beta speculative plays in declining structures.",
      targetAssets: ["USDC Vaults", "BIL (T-Bills)", "Defensive high-yield savings"]
    },
    {
      row: 2,
      col: 1,
      volatilityLabel: "LOW",
      sentimentLabel: "NEUTRAL",
      title: "Structural Accumulation",
      regime: null,
      colorClass: "border-emerald-950 text-emerald-500 hover:border-emerald-800",
      glowColor: "rgba(16, 185, 129, 0.15)",
      bgActiveClass: "bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
      description: "Extremely quiet consolidation near major pivot lows or trading floors. Smart institutionals gently absorb float over long timelines within tight bands.",
      tacticalPlaybook: "Scale into long-term strategic allocations slowly. Volatility is cheap; buy protective leaps or long-dated optional calls.",
      targetAssets: ["Underlying value stocks", "Spot Bitcoin / Ethereum", "LEAPs Options"]
    },
    {
      row: 2,
      col: 2,
      volatilityLabel: "LOW",
      sentimentLabel: "BULLISH",
      title: "Goldilocks / Risk-On Ascent",
      regime: MarketRegime.RISK_ON,
      colorClass: "border-emerald-900 text-emerald-400 hover:border-emerald-500",
      glowColor: "rgba(52, 211, 153, 0.25)",
      bgActiveClass: "bg-emerald-950/40 border-emerald-400/80 ring-1 ring-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
      description: "Ideal market conditions. Realized and implied volatilities are thoroughly crushed while investor confidence climbs steadily to multi-month highs.",
      tacticalPlaybook: "Max long risk-assets. Embrace high beta instruments, cross-asset growth stocks, and top-tier liquid crypto classes.",
      targetAssets: ["BTC (Bitcoin)", "SOXL (Semiconductors)", "QQQ (Tech Core)", "Solana Ecosystem"]
    }
  ];

  // Auto-detect which cell maps to active analysis
  const activeCellIndex = matrixCells.findIndex(cell => cell.regime === analysis.regime);
  const activeCell = activeCellIndex !== -1 ? matrixCells[activeCellIndex] : null;

  // Set the default displayed details to activeCell on first load or changes
  React.useEffect(() => {
    if (activeCell) {
      setSelectedCell(activeCell);
    }
  }, [analysis.regime]);

  const displayCell = selectedCell || activeCell || matrixCells[8];

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0d0f14] p-5 h-full flex flex-col" id="regime-matrix-card">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">QUANTITATIVE MATRIX</h2>
          <p className="text-[11px] font-mono text-slate-500">VOLATILITY VS. SENTIMENT GRID MAPPING SYSTEMATIC ENVIRONMENTAL RISK</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-grow">
        
        {/* Left Side: 3x3 Matrix Grid Layout */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div className="relative border-l border-b border-slate-850 pl-6 pb-6 pr-1 pt-2">
            
            {/* Volatility Y-Axis label */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-slate-700">▲</span> VOLATILITY (IMPLIED VIX) <span className="text-slate-700">▼</span>
            </div>

            {/* Matrix Cells Grid */}
            <div className="grid grid-cols-3 gap-2">
              {matrixCells.map((cell, idx) => {
                const isActive = cell.regime === analysis.regime;
                const isSelectedForDetail = displayCell.row === cell.row && displayCell.col === cell.col;
                
                return (
                  <button
                    key={idx}
                    id={`matrix-cell-${cell.row}-${cell.col}`}
                    onClick={() => setSelectedCell(cell)}
                    className={`relative rounded-md p-3 h-20 flex flex-col justify-between items-start text-left transition-all duration-300 font-sans border text-xs overflow-hidden cursor-pointer select-none ${
                      isActive 
                        ? cell.glowColor 
                          ? cell.bgActiveClass
                          : "bg-slate-900 border-slate-600 font-bold" 
                        : isSelectedForDetail 
                          ? "bg-slate-900/60 border-slate-700/80 shadow-md scale-[0.98]"
                          : "bg-[#080a0d] border-slate-900 text-slate-400 hover:bg-[#11141c] hover:text-white"
                    }`}
                  >
                    {/* Visual active radar indicator */}
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}

                    {/* Small coordinate parameters */}
                    <div className="text-[8px] font-mono tracking-wider text-slate-500 uppercase">
                      {cell.volatilityLabel[0]}V / {cell.sentimentLabel[0]}S
                    </div>

                    {/* Short label */}
                    <div className="font-bold text-[10px] leading-tight truncate w-full tracking-tight">
                      {cell.title.split("/")[0]}
                    </div>

                    {/* State Tag indicator */}
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className={`text-[8px] font-mono uppercase px-1 rounded-sm tracking-wide ${
                        isActive
                          ? "bg-indigo-900/40 text-indigo-300 font-extrabold border border-indigo-700/40"
                          : "text-slate-500"
                      }`}>
                        {isActive ? "ACTIVE" : cell.regime ? cell.regime.replace("_", "") : "TRANSIT"}
                      </span>
                    </div>

                    {/* Cell hover glow helper */}
                    <div 
                      className="absolute inset-0 opacity-15 pointer-events-none transition-opacity hover:opacity-30" 
                      style={{ background: `radial-gradient(circle at center, ${cell.glowColor} 0%, transparent 70%)` }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Sentiment X-Axis label */}
            <div className="w-full text-center mt-3 text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center justify-center gap-1.5 pl-4">
              <span className="text-slate-700">◀</span> SENTIMENT INDEX (MACRO FEED) <span className="text-slate-700">▶</span>
            </div>

            {/* Horizontal Grid Legends */}
            <div className="grid grid-cols-3 pl-4 text-center text-[8px] font-mono text-slate-600 uppercase mt-1">
              <div>BEARISH</div>
              <div>NEUTRAL</div>
              <div>BULLISH</div>
            </div>
          </div>
          
          <div className="px-5 py-2.5 mt-2 bg-slate-950/60 border border-slate-900 rounded-md font-mono text-[9px] text-slate-500 flex justify-between items-center">
            <span>VOL INDEX SPOT: <strong className="text-slate-300">{analysis.regime === MarketRegime.RISK_OFF ? "ELEVATED (VIX > 25)" : "CRUSHED (VIX < 15)"}</strong></span>
            <span>REGIME CONFIDENCE: <strong className="text-indigo-400">{analysis.confidence}%</strong></span>
          </div>
        </div>

        {/* Right Side: Interactive Details View & Tactical Playbook */}
        <div className="md:col-span-5 bg-slate-950/60 border border-slate-900/60 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 tracking-widest font-extrabold uppercase">
                  {displayCell.volatilityLabel} VOLATILITY // {displayCell.sentimentLabel} SENTIMENT
                </span>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                  {displayCell.regime === analysis.regime && (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  )}
                  {displayCell.title}
                </h3>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                displayCell.regime === analysis.regime
                  ? "bg-indigo-950 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900 text-slate-500 border border-slate-800"
              }`}>
                {displayCell.regime === analysis.regime ? "ACTIVE STATE" : "PRESET MODEL"}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {displayCell.description}
            </p>

            <div className="space-y-2 bg-[#090b0e] p-3 rounded-md border border-slate-900">
              <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-indigo-500" />
                TACTICAL MODEL PLAYBOOK:
              </span>
              <p className="text-[10px] text-slate-300 leading-normal font-mono uppercase">
                {displayCell.tacticalPlaybook}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase">
                STRATEGIC FOCUS INSTRUMENTS:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {displayCell.targetAssets.map((asset, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#11141c] text-white border border-slate-800 rounded uppercase tracking-wider"
                  >
                    {asset}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 mt-4 flex items-center gap-2 text-[9px] text-slate-500 font-mono uppercase">
            <BadgeInfo className="w-3.5 h-3.5 text-slate-600" />
            <span>Interactive grid. Click cells to explore alternate quant regimes & targets.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
