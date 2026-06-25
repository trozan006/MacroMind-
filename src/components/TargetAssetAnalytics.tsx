import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Coins, 
  ChevronRight, 
  Target, 
  Layers, 
  Activity, 
  Zap, 
  Atom, 
  Cpu, 
  Globe, 
  BookOpen, 
  Newspaper,
  Loader2,
  Search
} from "lucide-react";

interface NewsHeadline {
  title: string;
  sentiment: "bullish" | "bearish" | "neutral";
  source: string;
}

interface TechnicalAnalysisData {
  symbol: string;
  price: number;
  trend_50: number;
  trend_200: number;
  trend_label: string;
  rsi: number;
  rsi_label: "Overbought" | "Neutral" | "Oversold";
  macd_line: number;
  macd_signal: number;
  macd_histogram: number;
  macd_cross_label: "Bullish Cross" | "Bearish Cross" | "Neutral";
  support: number;
  resistance: number;
  fvg_detected: boolean;
  fvg_range: string;
  fvg_type: "Bullish" | "Bearish" | "None";
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  bb_status_label: string;
  atr: number;
  atr_label: "Low" | "Normal" | "High";
  
  // CRYPTO-specific
  funding_rate?: string;
  funding_rate_label?: string;
  volume_vs_7d_avg?: "Rising" | "Falling" | string;
  obv_trend?: string;
  
  // STOCK-specific
  vwap?: number;
  vwap_relation?: "Above VWAP" | "Below VWAP" | "At VWAP" | string;
  relative_volume?: string;
  sector_momentum_note?: string;
  
  // Fundamentals
  fundamental_market_cap: string;
  fundamental_pe_ratio: string;
  fundamental_circulating_supply: string;
  fundamental_total_supply: string;
  fundamental_52w_high: string;
  fundamental_52w_low: string;
  
  // News Sentiment
  news_headlines: NewsHeadline[];
  synthesized_reasoning: string;
  
  // Indicator status flag
  isAiEstimated: boolean;
}

interface TargetAssetAnalyticsProps {
  selectedSymbol: string | null;
  assetClass: "CRYPTO" | "STOCKS";
  livePrice?: number;
}

export default function TargetAssetAnalytics({ selectedSymbol, assetClass, livePrice }: TargetAssetAnalyticsProps) {
  const [data, setData] = useState<TechnicalAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const safeToLocaleString = (val: number | null | undefined, options?: Intl.NumberFormatOptions, fallback = "—") => {
    if (val === null || val === undefined || typeof val !== "number" || isNaN(val)) {
      return fallback;
    }
    return val.toLocaleString("en-US", options);
  };

  const safeFormatPrice = (val: number | null | undefined, fallback = "—") => {
    return safeToLocaleString(val, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, fallback);
  };

  useEffect(() => {
    if (!selectedSymbol) return;
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const queryParams = new URLSearchParams({
          symbol: selectedSymbol,
          assetClass: assetClass,
        });
        if (livePrice) {
          queryParams.append("price", livePrice.toString());
        }
        
        const res = await fetch(`/api/asset-technical-analysis?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Could not retrieve latest technical telemetry targets.");
        
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load technical analysis.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [selectedSymbol, assetClass, livePrice]);

  if (!selectedSymbol) {
    return (
      <div className="bg-[#0b0c10] border border-slate-900 rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px] shadow-lg border-dashed border-indigo-950/40" id="target-analytics-empty">
        <div className="p-4 rounded-full bg-slate-950/80 border border-slate-900/80 text-indigo-450 mb-4 animate-pulse">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2 font-sans">No Asset Selected</h3>
        <p className="text-xs font-mono text-slate-400 max-w-sm leading-relaxed uppercase">
          Select an asset above to see its full technical and fundamental breakdown.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0b0c10] border border-slate-900 rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px]" id="target-analytics-loading">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Synthesizing indicator data for {selectedSymbol}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#0b0c10] border border-slate-900 rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px] text-center" id="target-analytics-error">
        <ShieldAlert className="w-8 h-8 text-rose-500 mb-3" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">DATA PIPELINE OFFLINE</h3>
        <p className="text-xs font-mono text-slate-500 max-w-xs uppercase">
          {error || "An unexpected issue occurred while assembling technical targets."}
        </p>
      </div>
    );
  }

  const isCrypto = assetClass === "CRYPTO";
  const cleanDisplayName = selectedSymbol.replace("USDT", "");
  let formattedSymbolName = "";
  if (isCrypto) {
    formattedSymbolName = `${cleanDisplayName.toUpperCase()}-USDT`;
  } else {
    let cleanStock = cleanDisplayName;
    if (cleanStock.toUpperCase().startsWith("R")) {
      cleanStock = cleanStock.substring(1);
    }
    formattedSymbolName = cleanStock.toUpperCase();
  }

  // RSI status badge color
  const getRsiBadgeColor = (lbl: string) => {
    if (lbl === "Overbought") return "bg-rose-950/80 border-rose-500/40 text-rose-400";
    if (lbl === "Oversold") return "bg-emerald-950/80 border-emerald-500/40 text-emerald-400";
    return "bg-slate-900 border-slate-700 text-slate-300";
  };

  // MACD status badge color
  const getMacdBadgeColor = (lbl: string) => {
    if (lbl === "Bullish Cross") return "bg-emerald-950/80 border-emerald-500/40 text-emerald-400";
    if (lbl === "Bearish Cross") return "bg-rose-950/80 border-rose-500/40 text-rose-400";
    return "bg-slate-900 border-slate-700 text-slate-300";
  };

  // Derive systematic signal details from core metrics
  const signal = (() => {
    if (!data) return { direction: "LONG", timeframeLabel: "4H SWING", confidence: 75 };
    
    let bullCount = 0;
    let bearCount = 0;
    
    const curPrice = data.price ?? 0;
    const t50 = data.trend_50 ?? 0;
    const t200 = data.trend_200 ?? 0;
    const mLine = data.macd_line ?? 0;
    const mSig = data.macd_signal ?? 0;
    const rsiVal = data.rsi ?? 50;

    // SMA 50 relation
    if (curPrice > t50) bullCount++; else if (curPrice < t50) bearCount++;
    // SMA 200 relation
    if (curPrice > t200) bullCount++; else if (curPrice < t200) bearCount++;
    // MACD momentum
    if (mLine > mSig) bullCount++; else if (mLine < mSig) bearCount++;
    // RSI thresholds - symmetric: RSI > 50 is bullish momentum, RSI < 50 is bearish momentum
    if (rsiVal > 50) bullCount++; else if (rsiVal < 50) bearCount++;
    
    if (data.rsi_label === "Oversold") bullCount += 2;
    if (data.rsi_label === "Overbought") bearCount += 2;
    if (data.macd_cross_label === "Bullish Cross") bullCount += 2;
    if (data.macd_cross_label === "Bearish Cross") bearCount += 2;
    
    const direction = bullCount > bearCount ? "LONG" : bullCount < bearCount ? "SHORT" : "LONG";
    
    // Derive timeframe bucket
    let timeframeLabel = "4H SWING";
    const isBbTouch = data.bb_status_label && (
      data.bb_status_label.toUpperCase().includes("TOUCH") || 
      data.bb_status_label.toUpperCase().includes("OUTSIDE") || 
      data.bb_status_label.toUpperCase().includes("UPPER") || 
      data.bb_status_label.toUpperCase().includes("LOWER")
    );
    const isRsiExtreme = rsiVal < 35 || rsiVal > 65;
    const isMacdActive = data.macd_cross_label && data.macd_cross_label !== "Neutral";
    
    if (isRsiExtreme || isBbTouch) {
      timeframeLabel = "5M SCALP";
    } else if (isMacdActive) {
      timeframeLabel = "1H INTRADAY";
    } else {
      timeframeLabel = "4H SWING";
    }
    
    const totalFactors = bullCount + bearCount;
    const alignmentStrength = Math.max(bullCount, bearCount) / (totalFactors || 1);
    const confidence = Math.round(50 + alignmentStrength * 45); // ranges 50% to 95%
    
    return { direction, timeframeLabel, confidence: Math.min(confidence, 98) };
  })();

  return (
    <div className="bg-[#0d1015] border border-slate-900 rounded-lg p-5 flex flex-col space-y-5" id="target-asset-analytics-panel">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight text-white uppercase font-sans">
                {formattedSymbolName} TARGET ANALYTICS
              </h2>
              {data.isAiEstimated ? (
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 uppercase tracking-widest animate-pulse">
                  AI-Estimated
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">
                  Live Technical
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              DEEP-DIVE SYSTEMATIC SIGNAL FRAMEWORK & METRIC MONITOR
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/40 border border-slate-900/50 rounded px-2.5 py-1.5 self-start sm:self-auto font-mono text-[10.5px]">
          <span className="text-slate-500">SPOT price:</span>
          <span className="text-white font-bold">
            {data.price !== null && data.price !== undefined ? `$${safeFormatPrice(data.price)}` : "Unavailable"}
          </span>
        </div>
      </div>

      {/* SYSTEMATIC SIGNAL CARD */}
      <div className="bg-[#0b0d13] border border-slate-900 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="target-systematic-signal-card">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
              SYSTEMATIC CRITERIA SIGNAL
            </h3>
          </div>
          <p className="text-[10px] font-mono text-slate-400 uppercase">
            Quantifiably computed execution logic for {formattedSymbolName}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 font-mono text-xs w-full md:w-auto">
          {/* DIRECTION */}
          <div className="bg-black/40 border border-slate-950 rounded p-2 text-center min-w-[90px]">
            <span className="text-[8px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">DIRECTION</span>
            <span className={`text-[12px] font-extrabold tracking-widest ${
              signal.direction === "LONG" ? "text-emerald-400" : "text-rose-400"
            }`}>
              {signal.direction}
            </span>
          </div>

          {/* TIMEFRAME */}
          <div className="bg-black/40 border border-slate-950 rounded p-2 text-center min-w-[95px]">
            <span className="text-[8px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">TIMEFRAME</span>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight block truncate">
              {signal.timeframeLabel}
            </span>
          </div>

          {/* CONFIDENCE */}
          <div className="bg-black/40 border border-slate-950 rounded p-2 text-center min-w-[90px]">
            <span className="text-[8px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">CONFIDENCE</span>
            <span className="text-[12px] font-extrabold text-white">
              {signal.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID OF SMALL SCANNABLE INDICATOR CARDS */}
      <div>
        <h3 className="text-[10.5px] font-mono text-slate-400 font-extrabold uppercase tracking-widest mb-2 px-1 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-indigo-400" /> SYSTEMATIC CORE INDICATORS
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Trend Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-trend-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">TREND STRUCTURE (50 / 200 SMA)</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 truncate max-w-[170px] font-sans font-medium">{data.trend_label}</span>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                (data.price ?? 0) >= (data.trend_50 ?? 0) 
                  ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400" 
                  : "bg-rose-950/60 border-rose-500/30 text-rose-400"
              }`}>
                {(data.price ?? 0) >= (data.trend_50 ?? 0) ? "BULLISH" : "BEARISH"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9.5px] font-mono text-slate-500 pt-1 border-t border-slate-900/30">
              <span>50-SMA: <span className="text-slate-300 font-bold">${safeToLocaleString(data.trend_50)}</span></span>
              <span>200-SMA: <span className="text-slate-300 font-bold">${safeToLocaleString(data.trend_200)}</span></span>
            </div>
          </div>

          {/* RSI Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-rsi-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">RSI (14-PERIOD)</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-extrabold text-white">{data.rsi}</span>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${getRsiBadgeColor(data.rsi_label)}`}>
                {data.rsi_label.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-slate-900/60 h-1.5 rounded-full overflow-hidden relative mt-1.5">
              <div 
                className={`h-full rounded-full ${
                  data.rsi_label === "Overbought" 
                    ? "bg-rose-500" 
                    : data.rsi_label === "Oversold" 
                      ? "bg-emerald-400" 
                      : "bg-indigo-400"
                }`}
                style={{ width: `${Math.min(Math.max(data.rsi, 0), 100)}%` }}
              />
            </div>
          </div>

          {/* MACD Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-macd-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">MACD MOMENTUM</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-indigo-400 font-bold">Hist: {data.macd_histogram > 0 ? `+${data.macd_histogram}` : data.macd_histogram}</span>
              </div>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${getMacdBadgeColor(data.macd_cross_label)}`}>
                {data.macd_cross_label.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9.5px] font-mono text-slate-500 pt-1 border-t border-slate-900/30">
              <span>Line: <span className="text-slate-300">{data.macd_line}</span></span>
              <span>Signal: <span className="text-slate-300">{data.macd_signal}</span></span>
            </div>
          </div>

          {/* Support & Resistance Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-sr-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">SUPPORT & RESISTANCE</span>
            <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
              <div className="bg-emerald-950/20 border border-emerald-900/20 rounded p-1">
                <span className="text-[8px] font-mono text-emerald-500 block">S-BOUND</span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">${safeToLocaleString(data.support)}</span>
              </div>
              <div className="bg-rose-950/20 border border-rose-900/20 rounded p-1">
                <span className="text-[8px] font-mono text-rose-500 block">R-BOUND</span>
                <span className="text-[11px] font-mono text-rose-400 font-bold">${safeToLocaleString(data.resistance)}</span>
              </div>
            </div>
          </div>

          {/* Fair Value Gap (FVG) Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-fvg-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">FAIR VALUE GAP (FVG)</span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono font-semibold">{data.fvg_range}</span>
              {data.fvg_detected ? (
                <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                  data.fvg_type === "Bullish" 
                    ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400" 
                    : "bg-rose-950/80 border-rose-500/40 text-rose-400"
                }`}>
                  {data.fvg_type.toUpperCase()} FVG
                </span>
              ) : (
                <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                  NO ACTIVE GAP
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-500">Unfilled institutional order imbalances locator.</p>
          </div>

          {/* Bollinger Bands Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-bb-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">BOLLINGER BANDS (20, 2SD)</span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-300 font-sans truncate max-w-[130px] font-medium">{data.bb_status_label}</span>
              <span className="text-[8.5px] font-mono bg-indigo-950/50 text-indigo-400 border border-indigo-800/30 px-1.5 py-0.5 rounded uppercase font-bold">
                VOLATILITY BB
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-900/30">
              <span>L: <span className="text-slate-400">${safeToLocaleString(data.bb_lower)}</span></span>
              <span>M: <span className="text-slate-400">${safeToLocaleString(data.bb_middle)}</span></span>
              <span>U: <span className="text-slate-400">${safeToLocaleString(data.bb_upper)}</span></span>
            </div>
          </div>

          {/* Volatility ATR Card */}
          <div className="bg-black/30 border border-slate-900/80 rounded p-3 space-y-1" id="indicator-atr-card">
            <span className="text-[9.5px] font-mono text-slate-500 font-bold uppercase block tracking-wider">ATR COVALENCE (VOLATILITY)</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-slate-200">${safeToLocaleString(data.atr)}</span>
              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                data.atr_label === "High"
                  ? "bg-rose-950/65 border-rose-500/35 text-rose-400"
                  : data.atr_label === "Low"
                    ? "bg-slate-950/65 border-slate-800 text-slate-400"
                    : "bg-emerald-950/65 border-emerald-500/35 text-emerald-400"
              }`}>
                {data.atr_label.toUpperCase()} VOL
              </span>
            </div>
            <p className="text-[9px] text-slate-500">Average True Range representing 14-period price range volatility.</p>
          </div>

          {/* Conditional Asset-Class Specific Panel */}
          {isCrypto ? (
            <div className="bg-gradient-to-br from-indigo-950/20 to-black/30 border border-indigo-950/40 p-3 rounded space-y-2 justify-between flex flex-col" id="indicator-crypto-specific-card">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[9.5px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">CRYPTO-SPECIFIC TELEMETRY</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="bg-black/40 border border-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-500 block text-[8px]">FUNDING RATE</span>
                    <span className="text-slate-200 block font-bold">{data.funding_rate || "—"}</span>
                    <span className="text-[7.5px] text-indigo-400 truncate block mt-0.5">{data.funding_rate_label}</span>
                  </div>
                  <div className="bg-black/40 border border-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-500 block text-[8px]">24H VS 7D VOL</span>
                    <span className="text-slate-205 block font-bold truncate">{data.volume_vs_7d_avg || "Normal"}</span>
                    <span className="text-[7.5px] text-slate-500 block mt-0.5">Rolling average</span>
                  </div>
                </div>
              </div>
              <div className="bg-black/50 border border-slate-900/60 p-1.5 rounded text-[9.5px] font-mono flex justify-between items-center mt-1">
                <span className="text-slate-500">OBV MOMENTUM:</span>
                <span className="text-emerald-400 font-bold">{data.obv_trend || "Positive"}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-950/20 to-black/30 border border-[#1e1b4b]/30 p-3 rounded space-y-2 justify-between flex flex-col" id="indicator-stocks-specific-card">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9.5px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">STOCK-SPECIFIC MOVEMENT</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono pt-1">
                  <div className="bg-black/40 border border-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-500 block text-[8px]">VWAP LIMIT</span>
                    <span className="text-slate-200 block font-bold">${safeToLocaleString(data.vwap)}</span>
                    <span className="text-[7.5px] text-indigo-400 truncate block mt-0.5">{data.vwap_relation}</span>
                  </div>
                  <div className="bg-black/40 border border-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-500 block text-[8px]">RELATIVE VOLUME</span>
                    <span className="text-slate-200 block font-bold truncate">{data.relative_volume || "1.0x"}</span>
                    <span className="text-[7.5px] text-slate-500 block mt-0.5">vs 3-month daily MA</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] font-mono text-slate-500 leading-tight border-t border-slate-900/40 pt-1.5">
                <span className="text-indigo-400 font-bold">SECTOR NOTES:</span> {data.sector_momentum_note || "Constructive rotation index flow."}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* SYNTHESIZED SIGNAL REASONING */}
      <div className="bg-slate-950 border border-indigo-950/50 rounded-lg p-4 space-y-2" id="technical-synthesized-reasoning-panel">
        <h4 className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> SYNTHESIZED TECHNICAL SIGNAL REASONING
        </h4>
        <p className="text-xs text-slate-200 font-sans leading-relaxed tracking-normal font-medium bg-gradient-to-r from-slate-200 to-indigo-100 bg-clip-text text-transparent">
          {data.synthesized_reasoning}
        </p>
      </div>

      {/* CORE FUNDAMENTALS PANEL (KEPT CLEAN AND UNCHANGED / FIXED SCOPE) */}
      <div className="border-t border-slate-900/80 pt-4" id="target-fundamentals-panel">
        <div className="flex items-center gap-1.5 mb-3">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            {formattedSymbolName} FUNDAMENTALS
          </h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 font-mono text-[10.5px]">
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">MARKET CAPITALIZATION</span>
            <span className="text-white font-extrabold">{data.fundamental_market_cap}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">P/E MULTIPLE</span>
            <span className="text-white font-extrabold">{data.fundamental_pe_ratio}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">CIRCULATING ANCHORS</span>
            <span className="text-white font-extrabold truncate block">{data.fundamental_circulating_supply}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">TOTAL ISSUANCE CAPS</span>
            <span className="text-white font-extrabold truncate block">{data.fundamental_total_supply}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">52W MAX RANGE</span>
            <span className="text-white font-extrabold">{data.fundamental_52w_high}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded border border-slate-900/50">
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">52W MIN RANGE</span>
            <span className="text-white font-extrabold">{data.fundamental_52w_low}</span>
          </div>
        </div>
      </div>

      {/* OUTLET SENTIMENT headlines AND NEWS (KEPT CLEAN AND UNCHANGED / FIXED SCOPE) */}
      <div className="border-t border-slate-900/80 pt-4" id="target-headlines-panel">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Newspaper className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1">
            {formattedSymbolName} RELATIVE NEWS SENTIMENT
          </h3>
        </div>
        
        <div className="space-y-2.5">
          {data.news_headlines && data.news_headlines.length > 0 ? (
            data.news_headlines.map((headline, index) => {
              const isBull = headline.sentiment === "bullish";
              const isBear = headline.sentiment === "bearish";
              return (
                <div key={index} className="bg-black/20 border border-slate-900/60 p-3 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-black/35 transition-all">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium leading-relaxed font-sans text-slate-300">
                      {headline.title}
                    </p>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">Source: {headline.source}</span>
                  </div>
                  <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border self-start sm:self-auto uppercase tracking-wider whitespace-nowrap ${
                    isBull 
                      ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400" 
                      : isBear 
                        ? "bg-rose-950/60 border-rose-500/30 text-rose-400" 
                        : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}>
                    {headline.sentiment}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] font-mono text-slate-500 uppercase px-1 py-4 text-center">No secondary headlines found for today.</p>
          )}
        </div>
      </div>

    </div>
  );
}
