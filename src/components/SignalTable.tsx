import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RegimeAnalysis } from "../types";
import { ChevronDown, ChevronUp, Activity, Percent, TrendingUp, BarChart4, DollarSign, BrainCircuit } from "lucide-react";

interface SignalTableProps {
  analysis: RegimeAnalysis;
  marketData: any;
}

export default function SignalTable({ analysis }: SignalTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (indicatorKey: string) => {
    if (expandedRow === indicatorKey) {
      setExpandedRow(null);
    } else {
      setExpandedRow(indicatorKey);
    }
  };

  const getStatusBadge = (status: "bullish" | "bearish" | "neutral") => {
    switch (status) {
      case "bullish":
        return <span className="bg-emerald-950/80 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold">🟢 BULLISH</span>;
      case "bearish":
        return <span className="bg-rose-950/80 border border-rose-500 text-rose-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold">🔴 BEARISH</span>;
      case "neutral":
      default:
        return <span className="bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold">⚪ NEUTRAL</span>;
    }
  };

  const indicators = Object.entries(analysis.indicators || {}).map(([key, ind]) => {
    // Choose appropriate icon for each indicator type based on key name matches
    let indicatorIcon = Activity;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("fear") || lowerKey.includes("vix") || lowerKey.includes("sentiment")) {
      indicatorIcon = BrainCircuit;
    } else if (lowerKey.includes("spread") || lowerKey.includes("rate") || lowerKey.includes("concentration") || lowerKey.includes("dominance")) {
      indicatorIcon = Percent;
    } else if (lowerKey.includes("volume") || lowerKey.includes("depth") || lowerKey.includes("flow") || lowerKey.includes("inflows")) {
      indicatorIcon = BarChart4;
    } else if (lowerKey.includes("trend") || lowerKey.includes("momentum") || lowerKey.includes("ma") || lowerKey.includes("averages") || lowerKey.includes("velocity")) {
      indicatorIcon = TrendingUp;
    } else if (lowerKey.includes("valu") || lowerKey.includes("price") || lowerKey.includes("usd")) {
      indicatorIcon = DollarSign;
    }

    return {
      id: key,
      label: ind.label || key,
      data: ind,
      icon: indicatorIcon,
      renderDeepDive: () => (
        <div className="bg-slate-950/90 border border-slate-900 rounded-lg p-5 mt-2 font-mono" id={`deepdive-${key}`}>
          <span className="text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">Ledora Quantitative Deep-Dive</span>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-black/50 p-3.5 rounded border border-slate-900 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">CURRENT QUANT MATCH</span>
                <div className="mt-1 text-sm font-bold text-slate-200">{ind.value}</div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-900 pt-2">
                <span className="text-slate-500 font-sans">Strategic Stance:</span>
                <span className={ind.status === "bullish" ? "text-emerald-400 font-bold" : ind.status === "bearish" ? "text-rose-400 font-bold" : "text-slate-400 font-bold"}>
                  {ind.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="md:col-span-2 bg-black/30 p-4 border border-dashed border-slate-900 rounded leading-relaxed text-xs text-slate-300">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">MARKET INTERPRETATION</span>
              ⚡ {ind.details}
            </div>
          </div>
        </div>
      )
    };
  });

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0d0f14] p-5 h-full flex flex-col" id="signal-table-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-indigo-400" />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">INDICATORS DEEP-DIVE</h2>
          <p className="text-[11px] font-mono text-slate-500">CLICK ANY SIGNAL TO EXPAND REAL-TIME PERFORMANCE DATA & DETAILS</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              <th className="pb-3 font-semibold">SIGNAL SOURCE</th>
              <th className="pb-3 font-semibold">CURRENT VALUE</th>
              <th className="pb-3 font-semibold">STATUS</th>
              <th className="pb-3 text-right font-semibold">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {indicators.map((ind) => {
              const isExpanded = expandedRow === ind.id;
              const RowIcon = ind.icon;
              return (
                <React.Fragment key={ind.id}>
                  <tr 
                    role="button"
                    onClick={() => toggleRow(ind.id)}
                    className="hover:bg-slate-900/30 transition-all cursor-pointer font-mono text-xs border-b border-slate-900"
                  >
                    {/* Source Name */}
                    <td className="py-3 px-1 flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <RowIcon className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="font-semibold text-slate-200 hover:text-indigo-300 transition-colors">
                        {ind.label}
                      </span>
                    </td>
                    {/* Current Level */}
                    <td className="py-3 text-slate-300">
                      {ind.data?.value || "N/A"}
                    </td>
                    {/* Status Badge */}
                    <td className="py-3">
                      {getStatusBadge(ind.data?.status || "neutral")}
                    </td>
                    {/* Expand icon */}
                    <td className="py-3 text-right text-slate-500 px-1">
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-indigo-400/80 hover:text-indigo-350 bg-indigo-950/20 border border-indigo-950 px-2 py-0.5 rounded">
                        <span>{isExpanded ? "COLLAPSE" : "DETAILS"}</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </div>
                    </td>
                  </tr>

                  {/* Deep dive expansion container */}
                  <tr className="border-none max-w-full">
                    <td colSpan={4} className="p-0 border-none">
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="py-2.5 pb-4 px-1 max-w-full">
                              {ind.renderDeepDive()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
