import React, { useState } from "react";
import { SentimentData } from "../types";
import { Brain, Star, TrendingUp, HelpCircle, MessageSquare, Flame, BarChart3, AlertCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface SentimentPanelProps {
  sentiment: SentimentData;
  spyHistory: { date: string; spyPrice: number; sentiment: number }[];
}

export default function SentimentPanel({ sentiment, spyHistory }: SentimentPanelProps) {
  const [activeTab, setActiveTab] = useState<"reddit" | "news" | "search">("reddit");
  const { redditBullishRatio, redditActivity, googleTrendsScore, rollingSentimentIndex, wordCloud, headlineFeed, twitterTrending } = sentiment;

  // Sentiment color logic
  const getIndexColor = (val: number) => {
    if (val >= 70) return "text-emerald-400";
    if (val >= 50) return "text-teal-400";
    if (val >= 35) return "text-slate-300";
    return "text-rose-500";
  };

  const getThermometerGradient = () => {
    return "linear-gradient(to right, #f43f5e 0%, #e11d48 20%, #f59e0b 50%, #10b981 80%, #059669 100%)";
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0d0f14] p-5 h-full flex flex-col" id="sentiment-panel-card">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">MARKET SENTIMENT MONITOR</h2>
          <p className="text-[11px] font-mono text-slate-500">SOCIAL FEED AGGREGATION & NATURAL LANGUAGE PROCESSING SENTIMENT GAUGE</p>
        </div>
      </div>

      {/* Thermometer Gauge block */}
      <div className="bg-black/40 border border-slate-900 rounded-lg p-4 mb-6 font-mono">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> ROLLING 24HR SENTIMENT INDEX
          </span>
          <span className={`text-xl font-extrabold ${getIndexColor(rollingSentimentIndex)}`}>
            {rollingSentimentIndex} / 100
          </span>
        </div>
        
        {/* Thermometer bar */}
        <div className="relative w-full h-3.5 rounded-full overflow-visible border border-slate-950 shadow-inner" style={{ background: getThermometerGradient() }}>
          {/* Slider marker representing rollingIndex */}
          <div 
            className="absolute -top-1 w-5 h-5 bg-white border-2 border-slate-950 rounded-full cursor-pointer shadow-lg transform -translate-x-1/2 transition-all duration-1000 flex items-center justify-center"
            style={{ left: `${rollingSentimentIndex}%` }}
          >
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
          <span>CAPITULATION / PANIC (0-30)</span>
          <span>NEUTRAL CHOP (50)</span>
          <span>BULLISH ACCUMULATION (70-100)</span>
        </div>
      </div>

      {/* Sentiment sources Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 flex-grow font-mono">
        
        {/* Left Column - Reddit / Twitter Core Tracker + Word Cloud */}
        <div className="border border-slate-900 bg-black/20 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-extrabold">WSB & REDDIT BULL RATIO</span>
              <span className="text-xs text-white font-bold">{redditBullishRatio}% Bullish</span>
            </div>
            
            {/* Bull ratio mini-indicator bar */}
            <div className="w-full h-2 bg-slate-950 rounded overflow-hidden border border-slate-900 mb-4">
              <div className="h-full bg-emerald-500" style={{ width: `${redditBullishRatio}%` }} />
            </div>

            {/* Trending Tickers list */}
            <div>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase block mb-2">HOT TICKERS MENTIONS (24h)</span>
              <div className="space-y-1.5">
                {twitterTrending.map((t) => (
                  <div key={t.ticker} className="flex justify-between items-center text-xs bg-slate-950/80 p-2 rounded border border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{t.ticker}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                        {t.count} comments
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold ${t.sentiment === "bullish" ? "text-emerald-400" : t.sentiment === "bearish" ? "text-rose-400" : "text-slate-400"}`}>
                      {t.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Google Trends monitor & Headline sentiments scraper */}
        <div className="border border-slate-900 bg-black/20 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-extrabold">GOOGLE TRENDS FEAR RATINGS</span>
              <span className={`text-xs font-bold ${googleTrendsScore > 60 ? "text-rose-400" : "text-slate-400"}`}>
                Score: {googleTrendsScore} / 100
              </span>
            </div>
            
            {/* Keywords list */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] text-center text-slate-400">
              <div className="p-1.5 rounded bg-slate-950 border border-slate-900 block">
                <span className="block text-slate-500">"stock crash"</span>
                <span className={`font-mono font-bold ${googleTrendsScore > 70 ? "text-rose-400" : "text-slate-300"}`}>{Math.round(googleTrendsScore * 1.1)}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-900 block">
                <span className="block text-slate-500">"buy the dip"</span>
                <span className={`font-mono font-bold ${rollingSentimentIndex > 60 ? "text-emerald-400" : "text-slate-300"}`}>{Math.round(redditBullishRatio * 0.9)}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-900 block">
                <span className="block text-slate-500">"recession"</span>
                <span className={`font-mono font-bold ${googleTrendsScore > 50 ? "text-rose-400" : "text-slate-300"}`}>{googleTrendsScore}%</span>
              </div>
            </div>

            {/* Live Financial Headline scrapings */}
            <div>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase block mb-2">ROLLING 24HR HEADLINE SENTIMENT FEED</span>
              <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                {headlineFeed.map((h, idx) => {
                  const badgeColor = h.sentiment === "bullish" 
                    ? "bg-emerald-950 border-emerald-500 text-emerald-400" 
                    : h.sentiment === "bearish" 
                      ? "bg-rose-950 border-rose-500 text-rose-400" 
                      : "bg-slate-900 border-slate-700 text-slate-400";
                  
                  return (
                    <div key={idx} className="bg-slate-950/70 p-2 rounded border border-slate-900 text-xs flex flex-col gap-1 hover:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-slate-200 line-clamp-2 leading-snug">{h.title}</p>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded border uppercase font-mono tracking-widest flex-shrink-0 ${badgeColor}`}>
                          {h.sentiment}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase">
                        <span>{h.source}</span>
                        <span>{h.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: 7-day Sentiment Chart / SPY Overlay */}
      <div className="border-t border-slate-800/80 pt-4 mt-auto">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block mb-2 text-left">
          📊 HISTORICAL SENTIMENT INDEX VS SPY price OVERLAY (Recent 8 Days)
        </span>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spyHistory.slice(-8)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#475569" fontSize={8} tickLine={false} />
              <YAxis stroke="#475569" fontSize={8} domain={['auto', 'auto']} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", fontFamily: "monospace" }} 
                labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                itemStyle={{ fontSize: "10px" }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSentiment)" 
                name="Sentiment Index"
              />
              <Area 
                type="monotone" 
                dataKey="spyPrice" 
                stroke="#38bdf8" 
                strokeWidth={1}
                strokeDasharray="3 3"
                fillOpacity={0} 
                name="SPY Proxy ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
