import React from "react";
import { ResponsiveContainer, ComposedChart, Line, Bar, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceDot } from "recharts";
import { HistoricalTimelineNode, MarketRegime } from "../types";
import { LineChart, Play } from "lucide-react";

interface RegimeChartProps {
  history: HistoricalTimelineNode[];
}

export default function RegimeChart({ history }: RegimeChartProps) {
  const [viewMode, setViewMode] = React.useState<"market" | "regime">("market");
  
  // Dynamic color coding for customized bullet tooltips
  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case "RISK_ON": return "#10b981"; // Emerald
      case "RISK_OFF": return "#f43f5e"; // Rose
      case "TRENDING": return "#f59e0b"; // Amber
      case "RANGING":
      default: return "#94a3b8"; // Slate
    }
  };

  const getRegimeName = (regime: string) => {
    switch (regime) {
      case "RISK_ON": return "Risk-On (🟢)";
      case "RISK_OFF": return "Risk-Off (🔴)";
      case "TRENDING": return "Trending (🟡)";
      case "RANGING": return "Ranging (⚪)";
      default: return regime;
    }
  };

  const getRegimeValue = (regime: string) => {
    switch (regime) {
      case "RISK_ON": return 4;
      case "TRENDING": return 3;
      case "RANGING": return 2;
      case "RISK_OFF": return 1;
      default: return 0;
    }
  };

  const chartData = React.useMemo(() => {
    return history.map(node => ({
      ...node,
      regimeValue: getRegimeValue(node.regime)
    }));
  }, [history]);

  // Custom Tooltip component for high-fidelity Bloomberg terminal look
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HistoricalTimelineNode;
      const color = getRegimeColor(data.regime);
      
      return (
        <div className="bg-[#020617] border border-slate-800 p-4 rounded-lg shadow-xl font-mono text-xs max-w-xs space-y-2">
          <p className="text-slate-500 font-bold border-b border-slate-900 pb-1.5 uppercase">DATE: {label}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Class Regime:</span>
            <span style={{ color }} className="font-extrabold uppercase">
              {getRegimeName(data.regime)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-white font-bold">{data.confidence}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">SPY Proxy closing:</span>
            <span className="text-teal-400 font-bold">${data.spyPrice}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">VIX Level:</span>
            <span className="text-rose-450 font-bold">{data.vix}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Sentiment Score:</span>
            <span className="text-purple-400 font-bold">{data.sentiment}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0d0f14] p-5 h-full flex flex-col" id="regime-chart-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">30-DAY REGIME HISTORIC TIMELINE</h2>
            <p className="text-[11px] font-mono text-slate-500 uppercase">
              {viewMode === "market" 
                ? "DYNAMIC DUAL-AXIS CHARTS: SPY PRICE VS VIX LEVEL WITH ACTIVE REGIME BANDINGS" 
                : "REGIME STATE STEP-TRANSITIONS WITH BACKING CONFIDENCE FACTORS"}
            </p>
          </div>
        </div>

        {/* Glossy view toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[10px] font-mono self-start md:self-auto">
          <button
            id="toggle-btn-market"
            onClick={() => setViewMode("market")}
            className={`px-3 py-1.5 rounded-md transition-all uppercase tracking-wider font-bold cursor-pointer ${
              viewMode === "market"
                ? "bg-slate-800 text-white border border-slate-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SPY & VIX Levels
          </button>
          <button
            id="toggle-btn-regime"
            onClick={() => setViewMode("regime")}
            className={`px-3 py-1.5 rounded-md transition-all uppercase tracking-wider font-bold cursor-pointer ${
              viewMode === "regime"
                ? "bg-slate-800 text-white border border-slate-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Regime transitions
          </button>
        </div>
      </div>

      {/* Visual regime timeline strip indicator */}
      <div className="mb-4">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">QUICK REGIME STRIP</span>
        <div className="flex h-3 rounded overflow-hidden border border-slate-950">
          {history.map((node, idx) => (
            <div 
              key={idx} 
              className="flex-1 transition-all h-full tooltip-trigger relative group"
              style={{ backgroundColor: getRegimeColor(node.regime) }}
            >
              {/* Micro-hover title strip */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 left-1/2 transform -translate-x-1/2 p-1.5 rounded bg-black border border-slate-800 text-[9px] font-mono text-slate-200 z-10 whitespace-nowrap pointer-events-none transition-opacity">
                {node.date}: {getRegimeName(node.regime)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-500 uppercase">
          <span>30 Days Ago</span>
          <div className="flex gap-2.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> RISK ON</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> RISK OFF</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> TRENDING</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-500" /> RANGING</span>
          </div>
          <span>Current Today</span>
        </div>
      </div>

      {/* Main interactive Recharts diagram */}
      <div className="w-full flex-grow h-[260px] min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "market" ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: -5, left: -15, bottom: 5 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.25} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false} 
                dy={5}
              />
              {/* SPY Axis (Y left) */}
              <YAxis 
                yAxisId="spy" 
                stroke="#38bdf8" 
                fontSize={8} 
                tickLine={false} 
                domain={['dataMin - 10', 'dataMax + 10']} 
                label={{ value: 'SPY Close ($)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 8, dx: 5 }} 
              />
              {/* VIX Axis (Y right) */}
              <YAxis 
                yAxisId="vix" 
                orientation="right" 
                stroke="#f43f5e" 
                fontSize={8} 
                tickLine={false} 
                domain={[8, 40]} 
                label={{ value: 'VIX Volatility', angle: 90, position: 'insideRight', fill: '#f43f5e', fontSize: 8, dx: -5 }} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#475569", strokeWidth: 1 }} />
              <Legend 
                verticalAlign="top" 
                height={30} 
                iconSize={8}
                wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase" }}
              />
              
              <Line 
                yAxisId="spy"
                type="monotone" 
                dataKey="spyPrice" 
                stroke="#38bdf8" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 5, stroke: "#0ea5e9", strokeWidth: 2 }}
                name="S&P 500 Price (SPY)" 
              />
              
              <Line 
                yAxisId="vix"
                type="monotone" 
                dataKey="vix" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4, stroke: "#e11d48", strokeWidth: 1 }}
                name="VIX Fear Level" 
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: -5, left: -15, bottom: 5 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.25} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false} 
                dy={5}
              />
              {/* Regime Categorical Axis (Y left) */}
              <YAxis 
                yAxisId="regime" 
                stroke="#818cf8" 
                fontSize={8} 
                tickLine={false} 
                domain={[0.5, 4.5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(val) => {
                  switch (val) {
                    case 4: return "Risk-On";
                    case 3: return "Trending";
                    case 2: return "Ranging";
                    case 1: return "Risk-Off";
                    default: return "";
                  }
                }}
                label={{ value: 'Detected State', angle: -90, position: 'insideLeft', fill: '#818cf8', fontSize: 8, dx: 5 }} 
              />
              {/* Confidence Axis (Y right) */}
              <YAxis 
                yAxisId="confidence" 
                orientation="right" 
                stroke="#c084fc" 
                fontSize={8} 
                tickLine={false} 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                label={{ value: 'Regime Confidence', angle: 90, position: 'insideRight', fill: '#c084fc', fontSize: 8, dx: -5 }} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#475569", strokeWidth: 1 }} />
              <Legend 
                verticalAlign="top" 
                height={30} 
                iconSize={8}
                wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase" }}
              />
              
              {/* Proportional bars representing regime confidence level, colorized by their respective regime */}
              <Bar 
                yAxisId="confidence"
                dataKey="confidence" 
                barSize={12}
                name="Detection Confidence"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getRegimeColor(entry.regime)} 
                    fillOpacity={0.25}
                    stroke={getRegimeColor(entry.regime)}
                    strokeWidth={1}
                    strokeOpacity={0.4}
                  />
                ))}
              </Bar>

              {/* High-fidelity step line to visualize discrete macroeconomic state switches */}
              <Line 
                yAxisId="regime"
                type="step" 
                dataKey="regimeValue" 
                stroke="#818cf8" 
                strokeWidth={3} 
                dot={{ r: 3, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 1 }}
                activeDot={{ r: 6, stroke: "#4f46e5", strokeWidth: 2 }}
                name="Active Regime State" 
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
