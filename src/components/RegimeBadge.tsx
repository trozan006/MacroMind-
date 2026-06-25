import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MarketRegime, RegimeAnalysis } from "../types";
import { ShieldCheck, TrendingUp, RefreshCw, AlertOctagon, HelpCircle, FileText, Compass, Sparkles } from "lucide-react";

interface RegimeBadgeProps {
  analysis: RegimeAnalysis;
  isLoading: boolean;
  onRefresh: () => void;
  isLive: boolean;
  groundingError?: string;
}

export default function RegimeBadge({ analysis, isLoading, onRefresh, isLive, groundingError }: RegimeBadgeProps) {
  const { regime, confidence, explanation, riskDescription, assetEtfs, historicalAnalogue, twoWeekChangeProbability } = analysis;

  const getRegimeConfig = (r: MarketRegime) => {
    switch (r) {
      case MarketRegime.RISK_ON:
        return {
          bg: "bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
          badgeBg: "bg-emerald-500 text-black",
          color: "text-emerald-400",
          name: "Risk-On (Bullish)",
          icon: TrendingUp,
          glow: "from-emerald-500/20 to-transparent",
        };
      case MarketRegime.RISK_OFF:
        return {
          bg: "bg-rose-950/40 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          badgeBg: "bg-rose-500 text-black",
          color: "text-rose-400",
          name: "Risk-Off (Capitulation)",
          icon: AlertOctagon,
          glow: "from-rose-500/20 to-transparent",
        };
      case MarketRegime.TRENDING:
        return {
          bg: "bg-amber-950/40 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
          badgeBg: "bg-amber-500 text-black",
          color: "text-amber-400",
          name: "Trending (Momentum)",
          icon: Compass,
          glow: "from-amber-500/20 to-transparent",
        };
      case MarketRegime.RANGING:
      default:
        return {
          bg: "bg-slate-900/80 border-slate-600 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)]",
          badgeBg: "bg-slate-500 text-white",
          color: "text-slate-300",
          name: "Ranging (Choppy/Mean-Revert)",
          icon: HelpCircle,
          glow: "from-slate-500/10 to-transparent",
        };
    }
  };

  const config = getRegimeConfig(regime);
  const IconComponent = config.icon;

  return (
    <div className={`p-6 rounded-lg border ${config.bg} relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-between`} id="regime-badge-container">
      {/* Decorative gradient overlay */}
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl ${config.glow} rounded-full filter blur-3xl -z-10`} />

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">SYSTEM REGIME ALIGNMENT</span>
            {isLive ? (
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-mono bg-emerald-950/60 border border-emerald-500/80 text-emerald-400 rounded-md font-bold flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)] select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DATA: LIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-mono bg-amber-950/30 border border-amber-600/70 text-amber-500 rounded-md font-bold flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.1)] select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                DATA: SIMULATED
              </span>
            )}
          </div>
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="flex items-center gap-1 text-[11px] font-mono border border-slate-700 hover:border-slate-500 bg-slate-950 px-2 py-1 rounded text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "REFRESHING..." : "LIVE AI SCAN"}
          </button>
        </div>

        {groundingError && (
          <div className="text-[10px] font-mono text-amber-500 border border-amber-950 bg-amber-950/20 px-2 py-1 rounded mb-3 animate-pulse">
            ⚠️ {groundingError}
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-4 mt-2">
          {/* Regime Title Block */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={regime}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className={`p-4 rounded-lg bg-black/60 border ${config.badgeBg.split(' ')[0]} border-opacity-30`}>
                <IconComponent className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em] block uppercase">CLASSIFICATION</span>
                <p className="text-2xl font-bold font-sans tracking-tight uppercase">{config.name}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Confidence Indicator */}
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em] block">CONFIDENCE</span>
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className={`text-3xl font-bold ${config.color}`}>{confidence}</span>
              <span className="text-sm text-slate-500">%</span>
            </div>
            {/* Visual Mini bar */}
            <div className="w-20 h-1 bg-slate-950 rounded overflow-hidden mt-1 inline-block border border-slate-800">
              <div 
                className={`h-full ${config.badgeBg}`} 
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explain Plain English */}
        <div className="my-6">
          <span className="text-[10px] font-mono text-slate-400 tracking-[0.25em] block uppercase mb-1.5">MARKET SYNOPSIS</span>
          <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/60 p-3.5 border border-slate-900 rounded font-serif">
            {explanation}
          </p>
        </div>

        {/* Impending Risk Warning */}
        <div className="border border-red-950/50 bg-red-950/10 p-3 rounded-lg flex items-start gap-2.5 mb-6">
          <AlertOctagon size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wide block font-semibold">Regime Transition Risk</span>
            <p className="text-xs text-slate-300 mt-0.5">{riskDescription}</p>
          </div>
        </div>
      </div>

      {/* Recommended Strategy */}
      <div className="border-t border-slate-800/80 pt-4 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SUGGESTED ETFS</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {assetEtfs.map((etf) => (
                <span key={etf} className="text-[11px] font-mono font-medium border border-slate-800 bg-black/50 px-2.5 py-1 rounded text-slate-300">
                  {etf}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">HISTORICAL ANALOGUE</span>
            <div className="text-xs font-mono text-slate-300 mt-1.5 bg-black/30 p-1.5 border border-slate-900 rounded border-dashed">
              {historicalAnalogue}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">2-WEEK TRANSITION WEIGHT</span>
            <div className="text-xs font-mono text-slate-300 mt-1.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${regime === MarketRegime.RISK_OFF ? "bg-amber-400" : "bg-teal-400 animate-pulse"}`} />
              {twoWeekChangeProbability}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
