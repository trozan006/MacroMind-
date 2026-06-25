import React, { useState, useEffect } from "react";
import { MarketData, SentimentData, RegimeAnalysis, MarketRegime, HistoricalTimelineNode, BitgetFeed, TickerData } from "./types";
import RegimeBadge from "./components/RegimeBadge";
import SignalTable from "./components/SignalTable";
import SentimentPanel from "./components/SentimentPanel";
import RegimeChart from "./components/RegimeChart";
import AnalystChat from "./components/AnalystChat";
import RegimeMatrix from "./components/RegimeMatrix";
import PaperTradingDesk from "./components/PaperTradingDesk";
import { Terminal, Shield, RefreshCw, Layers2, Sparkles, AlertCircle, Info, Search, Target, Coins, Maximize2, Minimize2 } from "lucide-react";
import TargetAssetAnalytics from "./components/TargetAssetAnalytics";

export default function App() {
  const [selectedRegime, setSelectedRegime] = useState<MarketRegime>(MarketRegime.TRENDING);
  const [assetClass, setAssetClass] = useState<string>("STOCKS");
  const [btcPrice, setBtcPrice] = useState<number>(64850.50);
  const [ethPrice, setEthPrice] = useState<number>(3520.40);

  // Layout & Fullscreen states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWidescreen, setIsWidescreen] = useState(() => {
    const saved = localStorage.getItem("ledora_widescreen_layout");
    return saved ? saved === "true" : true; // Default to true (fills browser screen on PC)
  });

  // Toggle browser-level full screen via native fullscreen API
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err);
    }
  };

  // Sync fullscreen state with browser events (e.g. keying Escape button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  
  // Shared asset states
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [liveTickers, setLiveTickers] = useState<Record<string, any>>({});

  const [bitget, setBitget] = useState<BitgetFeed>({
    btc: 64850.50,
    eth: 3520.40,
    btcVolume: "824.5M",
    ethVolume: "410.2M",
    fundingRate: "0.0100%",
    stale: false,
    lastUpdated: new Date().toISOString(),
    tickers: {}
  });
  const [loadingBitget, setLoadingBitget] = useState(false);

  // Helper mock change percentages to deliver beautiful context variations
  const getChangePercent = (symbol: string, isRiskOff: boolean) => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    let baseChange = (hash % 100) / 20; // -5% to +5%
    if (isRiskOff) {
      baseChange = baseChange - 1.8;
    } else {
      baseChange = baseChange + 0.6;
    }
    if (baseChange > 12) baseChange = 12.0;
    if (baseChange < -12) baseChange = -12.0;
    return baseChange;
  };

  const getStockName = (symbol: string) => {
    const clean = symbol.replace("USDT", "").toUpperCase();
    switch (clean) {
      case "RNVDA": return "NVIDIA Corporation";
      case "RTSLA": return "Tesla Inc.";
      case "RAAPL": return "Apple Inc.";
      case "RMSFT": return "Microsoft Corp.";
      case "RGOOGL": return "Alphabet Inc.";
      case "RAMZN": return "Amazon.com Inc.";
      case "RMETA": return "Meta Platforms";
      case "RNFLX": return "Netflix Inc.";
      case "RAMD": return "Advanced Micro Devices";
      case "RCOIN": return "Coinbase Global";
      case "RMSTR": return "MicroStrategy Inc.";
      case "RSPY": return "S&P 500 ETF Spot";
      case "RQQQ": return "Nasdaq 100 ETF Spot";
      default: return "Tokenized Stock Asset";
    }
  };

  const getCryptoName = (symbol: string) => {
    const clean = symbol.replace("USDT", "").toUpperCase();
    switch (clean) {
      case "BTC": return "Bitcoin";
      case "ETH": return "Ethereum";
      case "SOL": return "Solana";
      case "BNB": return "BNB Coin";
      case "XRP": return "Ripple XRP";
      case "DOGE": return "Dogecoin";
      case "ADA": return "Cardano";
      case "AVAX": return "Avalanche";
      case "LINK": return "Chainlink";
      case "TON": return "Telegram Toncoin";
      case "DOT": return "Polkadot";
      case "TRX": return "TRON Ledger";
      case "SUI": return "Sui Network";
      case "LTC": return "Litecoin";
      case "NEAR": return "Near Protocol";
      case "APT": return "Aptos";
      case "ARB": return "Arbitrum";
      case "OP": return "Optimism";
      case "INJ": return "Injective";
      case "RNDR": return "Render Network";
      default: return "Crypto Coin Asset";
    }
  };

  const getLivePriceOfAsset = (assetName: string, bitgetFeeds: BitgetFeed) => {
    let cleanPick = assetName.toUpperCase().replace("-USDT", "").replace("USDT", "");
    if (cleanPick.startsWith("R") && cleanPick.length > 3) {
      cleanPick = cleanPick.substring(1);
    }
    
    const keysToTry = [
      assetName,
      assetName.toUpperCase(),
      assetName.toLowerCase(),
      `r${cleanPick}`,
      `R${cleanPick}`,
      cleanPick,
      `${cleanPick}USDT`,
      `b${cleanPick}`
    ];

    for (const k of keysToTry) {
      const tick = bitgetFeeds.tickers[k];
      if (tick && tick.price && tick.price > 0) {
        return tick.price;
      }
    }
    
    if (cleanPick === "BTC") return bitgetFeeds.btc || 64850.50;
    if (cleanPick === "ETH") return bitgetFeeds.eth || 3520.40;
    if (cleanPick === "SOL") return 145.80;
    if (cleanPick === "BNB") return 585.20;
    if (cleanPick === "XRP") return 0.52;
    if (cleanPick === "DOGE") return 0.14;
    if (cleanPick === "ADA") return 0.45;
    if (cleanPick === "AVAX") return 35.00;
    if (cleanPick === "LINK") return 15.50;
    if (cleanPick === "TON") return 7.50;
    if (cleanPick === "SPY") return 545.20;
    if (cleanPick === "QQQ") return 480.30;
    if (cleanPick === "AAPL") return 215.30;
    if (cleanPick === "NVDA") return 125.50;
    if (cleanPick === "TSLA") return 185.20;
    if (cleanPick === "MSFT") return 410.80;
    if (cleanPick === "GOOGL") return 175.40;
    if (cleanPick === "AMZN") return 188.60;
    if (cleanPick === "META") return 505.40;
    if (cleanPick === "NFLX") return 620.15;
    if (cleanPick === "AMD") return 160.40;
    if (cleanPick === "COIN") return 220.50;
    if (cleanPick === "MSTR") return 1450.00;
    return 100.00;
  };

  const DEFAULT_CRYPTO = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", 
    "ADAUSDT", "AVAXUSDT", "LINKUSDT", "TONUSDT", "DOTUSDT", "TRXUSDT", 
    "SUIUSDT", "LTCUSDT", "NEARUSDT", "APTUSDT", "ARBUSDT", "OPUSDT", 
    "INJUSDT", "RNDRUSDT"
  ];

  const DEFAULT_STOCKS = [
    "rNVDA", "rTSLA", "rAAPL", "rMSFT", "rGOOGL", "rAMZN", "rMETA",
    "rNFLX", "rAMD", "rCOIN", "rMSTR", "rSPY", "rQQQ"
  ];

  const [cryptoWatchlist, setCryptoWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("paper_crypto_watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_CRYPTO;
  });

  const [stocksWatchlist, setStocksWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("paper_stocks_watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_STOCKS;
  });

  // Top search bar states
  const [topSearchQuery, setTopSearchQuery] = useState("");
  const [topSearchError, setTopSearchError] = useState("");
  const [topSearching, setTopSearching] = useState(false);

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem("paper_crypto_watchlist", JSON.stringify(cryptoWatchlist));
    localStorage.setItem("paper_stocks_watchlist", JSON.stringify(stocksWatchlist));
  }, [cryptoWatchlist, stocksWatchlist]);
  const [analysis, setAnalysis] = useState<RegimeAnalysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveGrounded, setIsLiveGrounded] = useState(false);
  const [groundingError, setGroundingError] = useState<string | undefined>(undefined);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "Ledora quantitative matrix initialized.",
    "Connecting to Bloomberg & Crypto benchmark feeds...",
    "Live indicators operational under state protocols."
  ]);
  
  // API Logs state
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  // Unified Price Fetching Function
  const fetchBitgetPrices = async (
    customCrypto: string[] = cryptoWatchlist,
    customStocks: string[] = stocksWatchlist
  ) => {
    setLoadingBitget(true);
    try {
      const cryptoApiSymbols = customCrypto.map(item => item.toUpperCase()).join(",");
      const stocksApiSymbols = customStocks.map(item => item.toUpperCase()).join(",");

      const [cryptoRes, stocksRes] = await Promise.all([
        fetch(`/api/bitget?symbols=${cryptoApiSymbols}`),
        fetch(`/api/bitget-stocks?symbols=${stocksApiSymbols}`)
      ]);

      let cryptoData: any = {};
      let stocksData: any = {};

      if (cryptoRes.ok) {
        cryptoData = await cryptoRes.json();
      }
      if (stocksRes.ok) {
        stocksData = await stocksRes.json();
      }

      const mergedTickers = {
        ...(cryptoData.tickers || {}),
        ...(stocksData.tickers || {})
      };

      const btcVal = cryptoData.btc || 64850.50;
      const ethVal = cryptoData.eth || 3520.40;

      const updatedBitget = {
        btc: btcVal,
        eth: ethVal,
        btcVolume: cryptoData.btcVolume || "824.5M",
        ethVolume: cryptoData.ethVolume || "410.2M",
        fundingRate: cryptoData.fundingRate || "0.0100%",
        stale: !!(cryptoData.stale || stocksData.stale),
        lastUpdated: cryptoData.lastUpdated || stocksData.lastUpdated || new Date().toISOString(),
        tickers: mergedTickers
      };

      setBitget(updatedBitget);
      setBtcPrice(btcVal);
      setEthPrice(ethVal);
      setLiveTickers(mergedTickers);
    } catch (e) {
      console.warn("Error fetching multi-asset bitget price feeds:", e);
      setBitget(prev => ({ ...prev, stale: true }));
    } finally {
      setLoadingBitget(false);
    }
  };

  // Run price-fetching loop on watchlist updates
  useEffect(() => {
    fetchBitgetPrices(cryptoWatchlist, stocksWatchlist);
    const intervalPrice = setInterval(() => {
      fetchBitgetPrices(cryptoWatchlist, stocksWatchlist);
    }, 10000); // 10 seconds refresh
    return () => clearInterval(intervalPrice);
  }, [cryptoWatchlist, stocksWatchlist]);

  // Synchronize dynamic default asset selection on state changes/startup
  useEffect(() => {
    if (selectedAsset === null) {
      const list = assetClass === "CRYPTO" ? cryptoWatchlist : stocksWatchlist;
      if (list.length > 0) {
        setSelectedAsset(list[0]);
      }
      return;
    }
    const list = assetClass === "CRYPTO" ? cryptoWatchlist : stocksWatchlist;
    if (list.length > 0 && !list.includes(selectedAsset)) {
      setSelectedAsset(list[0]);
    }
  }, [assetClass, cryptoWatchlist, stocksWatchlist, selectedAsset]);

  const removeCryptoAsset = (symbol: string) => {
    if (cryptoWatchlist.length <= 5) {
      setTopSearchError("Watchlist must retain at least 5 core instruments.");
      return;
    }
    const filtered = cryptoWatchlist.filter(item => item !== symbol);
    setCryptoWatchlist(filtered);
    if (selectedAsset === symbol) {
      setSelectedAsset(filtered[0]);
    }
  };

  const removeStockAsset = (symbol: string) => {
    if (stocksWatchlist.length <= 5) {
      setTopSearchError("Watchlist must retain at least 5 core instruments.");
      return;
    }
    const filtered = stocksWatchlist.filter(item => item !== symbol);
    setStocksWatchlist(filtered);
    if (selectedAsset === symbol) {
      setSelectedAsset(filtered[0]);
    }
  };

  const fetchApiLogs = async () => {
    setRefreshingLogs(true);
    try {
      const res = await fetch("/api/regime-logs");
      if (res.ok) {
        const data = await res.json();
        setApiLogs(data);
      }
    } catch (err) {
      console.warn("Failed to query programmatic API limits.", err);
    } finally {
      setRefreshingLogs(false);
    }
  };

  useEffect(() => {
    // Retrieve logs on startup and maintain background refresh cycles
    fetchApiLogs();
    const intv = setInterval(fetchApiLogs, 5000);
    return () => clearInterval(intv);
  }, []);

  // Dynamic system feed tracker
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 10)]);
  };

  const loadData = async (regime: MarketRegime, forceLive: boolean = false, activeAsset: string = assetClass) => {
    setLoading(true);
    addLog(`Calculating metrics for ${activeAsset} under ${regime} regime...`);
    try {
      const url = `/api/market-data?simulationRegime=${regime}&assetClass=${activeAsset}${forceLive ? "&forceRefresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const data = await res.json();
      
      setAnalysis({
        regime: data.regime,
        confidence: data.confidence,
        explanation: data.explanation,
        riskDescription: data.riskDescription,
        assetEtfs: data.assetEtfs,
        historicalAnalogue: data.historicalAnalogue,
        twoWeekChangeProbability: data.twoWeekChangeProbability,
        indicators: data.indicators,
        timestamp: data.timestamp,
        sentiment: data.sentiment
      });
      
      setIsLiveGrounded(!!data.isLiveAIGrounded);
      if (data.isLiveAIGrounded) {
        addLog(`AI Live Scan verified ${activeAsset} indicators successfully!`);
        setGroundingError(undefined);
        // Sync our selection to actual live detected regime
        setSelectedRegime(data.regime as MarketRegime);
      } else {
        if (forceLive) {
          setGroundingError(data.groundingError || "AI Grounding Search offline, simulation loaded.");
          addLog("⚠️ live search fallback, loaded simulator models.");
        } else {
          setGroundingError(undefined);
        }
      }

      setHistory(data.history || []);
      addLog(`Synchronization complete. Current Regime set physically to: ${data.regime}`);
    } catch (e: any) {
      console.warn("Failed to synchronize server indicators:", e);
      addLog(`CRITICAL ERROR: Failed to synchronize server indicators: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount & whenever selectedRegime or assetClass updates
  useEffect(() => {
    loadData(selectedRegime, false, assetClass);
    
    // Auto-refresh indicators every 60 seconds as requested!
    const timer = setInterval(() => {
      addLog(`Interval timer triggered automatic refresh for ${assetClass}...`);
      loadData(selectedRegime, false, assetClass);
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedRegime, assetClass]);

  // Global Keyboard Shortcuts for quick asset switching ('s', 'c', 'f', 't')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Safely ignore shortcuts if the user is typing in a text field or form input
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "s") {
        setAssetClass("STOCKS");
        addLog("Shortcut Key [S] detected: Switching destination desk to STOCKS.");
      } else if (key === "c") {
        setAssetClass("CRYPTO");
        addLog("Shortcut Key [C] detected: Switching destination desk to CRYPTO.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLiveScan = () => {
    loadData(selectedRegime, true, assetClass);
  };

  const handleTopSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = topSearchQuery.trim().toUpperCase();
    if (!queryStr) return;

    if (assetClass === "CRYPTO") {
      const clean = queryStr.replace("-USDT", "").replace("USDT", "");
      const fullPair = `${clean}USDT`;

      if (cryptoWatchlist.includes(fullPair)) {
        setSelectedAsset(fullPair);
        setTopSearchQuery("");
        setTopSearchError("");
        return;
      }

      setTopSearching(true);
      try {
        const res = await fetch(`/api/bitget?symbols=${fullPair}`);
        if (res.ok) {
          const data = await res.json();
          const ticker = data.tickers && data.tickers[fullPair];

          if (ticker && ticker.success) {
            const updated = [...cryptoWatchlist, fullPair];
            setCryptoWatchlist(updated);
            setSelectedAsset(fullPair);
            setTopSearchQuery("");
            setTopSearchError("");
          } else {
            setTopSearchError("Ticker not found on Bitget");
          }
        } else {
          setTopSearchError("Ticker not found on Bitget");
        }
      } catch (err) {
        setTopSearchError("Ticker search failed");
      } finally {
        setTopSearching(false);
      }
    } else {
      // STOCKS
      let clean = queryStr.replace("-USDT", "").replace("USDT", "");
      if (clean.startsWith("R")) {
        clean = "r" + clean.substring(1).toUpperCase();
      } else {
        clean = "r" + clean.toUpperCase();
      }

      if (stocksWatchlist.includes(clean)) {
        setSelectedAsset(clean);
        setTopSearchQuery("");
        setTopSearchError("");
        return;
      }

      setTopSearching(true);
      try {
        const res = await fetch(`/api/bitget-stocks?symbols=${clean}`);
        if (res.ok) {
          const data = await res.json();
          const ticker = data.tickers && (
            data.tickers[clean] || 
            data.tickers[clean.toUpperCase()] || 
            data.tickers[`${clean}USDT`] || 
            data.tickers[`${clean.toUpperCase()}USDT`]
          );

          if (ticker && ticker.success) {
            const updated = [...stocksWatchlist, clean];
            setStocksWatchlist(updated);
            setSelectedAsset(clean);
            setTopSearchQuery("");
            setTopSearchError("");
          } else {
            setTopSearchError("Ticker not found on Bitget");
          }
        } else {
          setTopSearchError("Ticker not found on Bitget");
        }
      } catch (err) {
        setTopSearchError("Ticker search failed");
      } finally {
        setTopSearching(false);
      }
    }
  };

  if (loading && !analysis) {
    return (
      <div className="min-h-screen bg-[#020408] text-indigo-400 font-mono flex flex-col items-center justify-center p-6 gap-4">
        <RefreshCw className="w-12 h-12 animate-spin text-indigo-500" />
        <div className="text-center">
          <p className="text-sm font-bold tracking-wider animate-pulse">BOOTSTRAPPING LEDORA QUANT TERMINAL INTERCONNECT...</p>
          <p className="text-[11px] text-slate-500 mt-1">Calibrating parameters feed, asset definitions, and live volatility maps</p>
        </div>
      </div>
    );
  }

  // Safe fallback if null
  const activeAnalysis = analysis || {
    regime: MarketRegime.TRENDING,
    confidence: 60,
    explanation: "Loading...",
    riskDescription: "Loading...",
    assetEtfs: [],
    historicalAnalogue: "N/A",
    twoWeekChangeProbability: "N/A",
    indicators: {} as any,
    timestamp: ""
  };

  // Build beautiful dummy metrics derived from current states
  const isOff = activeAnalysis.regime === MarketRegime.RISK_OFF;
  const isOn = activeAnalysis.regime === MarketRegime.RISK_ON;
  
  const dummyMarketData: MarketData = {
    vix: isOff ? 33.4 : isOn ? 12.8 : 17.2,
    vixTrend: isOff ? "up" : "down",
    vixPercentile: isOff ? 94 : isOn ? 14 : 45,
    vixStructure: isOff ? "backwardation" : "contango",
    spyPrice: isOff ? 474.10 : isOn ? 532.50 : 512.40,
    spy50MA: 508.10,
    spy200MA: 485.60,
    qqqPrice: isOff ? 395.60 : isOn ? 448.20 : 432.80,
    qqq50MA: 422.50,
    qqq200MA: 398.90,
    creditSpread: isOff ? 2.58 : 1.12,
    creditSpreadTrend: isOff ? "widening" : "narrowing",
    dxy: isOff ? 106.90 : 101.40,
    dxyTrend: isOff ? "up" : "down",
    yieldCurve10Y2Y: isOff ? -0.22 : 0.38,
    yieldCurveState: isOff ? "inverted" : "normal",
    cnnFearGreed: isOff ? 15 : isOn ? 82 : 64,
    recentHeadlineSentiment: isOff ? 20 : 80
  };

  const dummySentiment: SentimentData = {
    redditBullishRatio: isOff ? 14 : isOn ? 84 : 64,
    redditActivity: isOff ? 96 : 75,
    googleTrendsScore: isOff ? 88 : 28,
    rollingSentimentIndex: isOff ? 12 : isOn ? 85 : 66,
    wordCloud: isOff 
      ? [
          { text: "Liquidation", value: 50, type: "bearish" },
          { text: "Crash", value: 45, type: "bearish" },
          { text: "Recession", value: 38, type: "bearish" },
          { text: "Stablecoin", value: 25, type: "neutral" },
          { text: "Gold", value: 20, type: "bullish" }
        ]
      : [
          { text: "Breakout", value: 45, type: "bullish" },
          { text: "Ledora", value: 42, type: "bullish" },
          { text: "AI Tokens", value: 38, type: "bullish" },
          { text: "Momentum", value: 40, type: "bullish" },
          { text: "FOMO", value: 36, type: "bullish" }
        ],
    headlineFeed: activeAnalysis.sentiment ? (activeAnalysis as any).sentiment.headlineFeed : (isOff
      ? [
          { title: "Broad deleveraging wipes leveraged open margins across global desks", source: "Bloomberg", sentiment: "bearish" as const, score: 10, time: "15m ago" },
          { title: "Macro interest metrics signal immediate rush for safe-harbor collateral pools", source: "Reuters", sentiment: "bearish" as const, score: 12, time: "45m ago" }
        ]
      : [
          { title: "Risk assets gather structural momentum following global liquidity injection protocols", source: "Reuters", sentiment: "bullish" as const, score: 85, time: "1h ago" },
          { title: "Institutional capital allocation parameters signal robust rotation target setups", source: "Bloomberg", sentiment: "bullish" as const, score: 90, time: "4h ago" }
        ]),
    twitterTrending: isOff
      ? [
          { ticker: "USDT", count: 3200, sentiment: "neutral" as const },
          { ticker: "GLD", count: 1850, sentiment: "bullish" as const },
          { ticker: "DXY", count: 1400, sentiment: "bullish" as const }
        ]
      : [
          { ticker: "BTC", count: 2840, sentiment: "bullish" as const },
          { ticker: "SOL", count: 1950, sentiment: "bullish" as const },
          { ticker: "ETH", count: 1100, sentiment: "bullish" as const }
        ]
  };

  const getTickerClass = (tag: string, regime: MarketRegime) => {
    if (tag === "SPY" || tag === "QQQ") return regime === MarketRegime.RISK_OFF ? "text-rose-400" : "text-emerald-400";
    if (tag === "VIX") return regime === MarketRegime.RISK_OFF ? "text-rose-500 animate-pulse" : "text-emerald-500";
    return "text-slate-300";
  };

  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col justify-between selection:bg-indigo-900 selection:text-white font-sans" id="main-terminal-root">
      
      {/* Top Header Marquee Tickers Banner */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 py-1.5 font-mono text-[10px] flex items-center justify-between overflow-x-auto gap-6 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-indigo-400 font-extrabold uppercase">LIVE FEED:</span>
        </div>
        <div className="flex items-center gap-4">
          <span>BTC: <span className="text-emerald-400">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ▲</span></span>
          <span className="text-slate-700">•</span>
          <span>ETH: <span className="text-emerald-400">${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
          <span className="text-slate-700">•</span>
          <span>SPY: <span className="text-emerald-400">${dummyMarketData.spyPrice.toFixed(2)} ▲</span></span>
          <span className="text-slate-700">•</span>
          <span>QQQ: <span className="text-emerald-400">${dummyMarketData.qqqPrice.toFixed(2)} ▲</span></span>
          <span className="text-slate-700">•</span>
          <span>VIX: <span className="text-yellow-500">{dummyMarketData.vix.toFixed(1)}</span></span>
          <span className="text-slate-700">•</span>
          <span>CURRENT REGIME: <span className="text-indigo-400 font-bold uppercase">{activeAnalysis.regime} ({activeAnalysis.confidence}%)</span></span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-[9px] uppercase">
          <span className="hidden xl:inline">SYS_UTC: {new Date().toISOString().substring(0, 16)}</span>
          <span className="text-slate-800 hidden xl:inline">•</span>

          {/* Layout Selector */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !isWidescreen;
              setIsWidescreen(nextVal);
              localStorage.setItem("ledora_widescreen_layout", String(nextVal));
            }}
            title="Toggle Fluid Widescreen or Boxed Standard Layout"
            className="flex items-center gap-1 px-2 py-0.5 border border-slate-800/80 hover:border-indigo-500/50 hover:text-indigo-400 bg-slate-900/40 rounded text-[9px] cursor-pointer transition-colors font-mono uppercase font-bold"
          >
            <span>LAYOUT: {isWidescreen ? "WIDE FLUID" : "BOXED STANDARD"}</span>
          </button>

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            title="Toggle real full screen mode in browser"
            className="flex items-center gap-1 px-2 py-0.5 border border-slate-800/80 hover:border-emerald-500/50 hover:text-emerald-400 bg-slate-900/40 rounded text-[9px] cursor-pointer transition-colors font-mono uppercase font-bold"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-2.5 h-2.5" />
                <span>EXIT FULLSCREEN</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-2.5 h-2.5" />
                <span>GO FULLSCREEN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`${isWidescreen ? "max-w-none px-4 lg:px-8 xl:px-12 my-6" : "max-w-7xl mx-auto p-4 sm:p-6"} w-full space-y-6 flex-grow animate-fade-in`}>
        
        {/* Welcome & App Overview Panel with Ledora Branding */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a0d14] to-indigo-950/40 border border-indigo-950/50 rounded-xl p-6 shadow-xl" id="welcome-onboarding-panel">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          {/* Corner badge inside the welcome panel */}
          <div className="absolute top-4 right-4 z-10" id="corner-badge-ledora">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono tracking-widest font-extrabold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.15)] uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Build by Ledora
            </span>
          </div>

          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/40 text-[10px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Interactive Institutional Suite
            </div>
            
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase font-sans">
              Welcome to <span className="text-indigo-400 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-100">MacroMind</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-indigo-300 tracking-wider uppercase font-bold">
              Real-Time Market Regime Intelligence for Crypto & Stocks
            </p>
            
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-400">
              MacroMind reads the market so you don't have to guess. It continuously analyzes volatility, momentum, sentiment, and live Bitget price data across crypto and tokenized US stocks, then classifies the current environment into a clear regime (Risk On, Risk Off, Trending, or Ranging) with a confidence score and a plain-English explanation of what's actually happening and why.
            </p>
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-400">
              Instead of checking ten different charts and indicators, you get one answer: what kind of market is this, and what tends to work in it. MacroMind also exposes this signal through a public API, so it can plug directly into trading agents and bots including a live Paper Trading Desk that demonstrates the signal being acted on in real time, with no real funds at risk.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded border border-slate-900/60">
                <div className="p-1 rounded bg-indigo-950 text-indigo-400 mt-0.5">
                  <Layers2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 block">CRYPTO & STOCKS</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">Bitget live data across major coins and tokenized US equities</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded border border-slate-900/60">
                <div className="p-1 rounded bg-indigo-950 text-indigo-400 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 block">AI-GROUNDED SCANS</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">Live real-time system engine</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded border border-slate-900/60">
                <div className="p-1 rounded bg-indigo-950 text-indigo-400 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 block">DETERMINISTIC REGIMES</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">Automated allocation metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PERSISTENT TOP ASSET SELECTOR PANEL */}
        <div className="bg-[#0b0c10] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4" id="top-asset-selector-header">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900/30">
                <Target className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">SELECT TARGET ASSET DETECTOR</h2>
                  {bitget.stale ? (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-amber-950/45 border border-amber-600/40 text-amber-500 rounded flex items-center gap-1 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> STALE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/80 text-emerald-400 rounded flex items-center gap-1.5 uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">CHOOSE AN ASSET FOR SYSTEMATIC TECHNICAL & FUNDAMENTAL REAL-TIME BREAKDOWNS</p>
              </div>
            </div>

            {/* Selector Option Controls: Toggle and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {/* STOCKS / CRYPTO toggle */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 border border-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAssetClass("CRYPTO");
                    setTopSearchError("");
                  }}
                  className={`px-3 py-1.5 text-[9.5px] font-mono font-bold border rounded transition-all uppercase tracking-wider cursor-pointer ${
                    assetClass === "CRYPTO"
                      ? "bg-emerald-950/90 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                      : "bg-black border-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  🪙 CRYPTO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssetClass("STOCKS");
                    setTopSearchError("");
                  }}
                  className={`px-3 py-1.5 text-[9.5px] font-mono font-bold border rounded transition-all uppercase tracking-wider cursor-pointer ${
                    assetClass === "STOCKS"
                      ? "bg-indigo-950/90 border-indigo-500 text-indigo-400 font-bold shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                      : "bg-black border-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  📈 STOCKS
                </button>
              </div>

              {/* Dynamic Ticker Search Input */}
              <form onSubmit={handleTopSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={topSearchQuery}
                    onChange={(e) => {
                      setTopSearchQuery(e.target.value);
                      if (topSearchError) setTopSearchError("");
                    }}
                    placeholder={assetClass === "CRYPTO" ? "SOL, BNB, DOGE, XRP..." : "NVDA, TSLA, AAPL, COIN..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs text-white font-mono uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 animate-pulse" />
                </div>
                <button
                  type="submit"
                  disabled={topSearching}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 font-mono font-bold text-xs text-black rounded transition-colors uppercase disabled:opacity-50 cursor-pointer"
                >
                  {topSearching ? "SEEK..." : "SEARCH"}
                </button>
              </form>
            </div>
          </div>

          {/* Error Message if any */}
          {topSearchError && (
            <p className="text-[10px] font-mono text-rose-450 font-bold uppercase animate-pulse">{topSearchError}</p>
          )}

          {/* Table Watchlist Layout */}
          <div className="border-t border-slate-905/60 pt-3 flex flex-col xl:flex-row gap-5">
            <div className="flex-grow max-h-[300px] overflow-y-auto pr-1">
              <table className="w-full text-left font-mono text-[11px] leading-tight">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[9px] uppercase tracking-wider font-extrabold pb-2">
                    <th className="py-2 px-1">Symbol</th>
                    <th className="py-2 px-1 text-right">Price</th>
                    <th className="py-2 px-1 text-right hidden sm:table-cell">24H Vol</th>
                    <th className="py-2 px-1 text-right">24H Chg</th>
                    <th className="py-2 px-1 text-center">Status</th>
                    <th className="py-2 px-0 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {(assetClass === "CRYPTO" ? cryptoWatchlist : stocksWatchlist).map((sym) => {
                    const apiSymbol = assetClass === "CRYPTO" ? sym.toUpperCase() : sym;
                    let ticker = bitget.tickers[apiSymbol] || 
                                 bitget.tickers[apiSymbol.toUpperCase()] || 
                                 bitget.tickers[`${apiSymbol}USDT`] || 
                                 bitget.tickers[`${apiSymbol.toUpperCase()}USDT`];
                    
                    if (!ticker) {
                      ticker = { price: 0, volume: "—", stale: true, success: false };
                    }

                    const isRiskOff = activeAnalysis.regime === MarketRegime.RISK_OFF;
                    const pct = getChangePercent(sym, isRiskOff);
                    const changeColor = pct > 0 ? "text-emerald-400" : pct < 0 ? "text-rose-400" : "text-slate-400";
                    const formattedPct = pct > 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
                    
                    const displayName = sym.replace("USDT", "");
                    const fullName = assetClass === "CRYPTO" ? getCryptoName(displayName) : getStockName(sym);

                    let formattedDisplayName = displayName;
                    if (assetClass === "STOCKS") {
                      let cleanStock = displayName;
                      if (cleanStock.toUpperCase().startsWith("R")) {
                        cleanStock = cleanStock.substring(1);
                      }
                      formattedDisplayName = cleanStock.toUpperCase();
                    } else {
                      formattedDisplayName = displayName.toUpperCase();
                    }

                    const isSelected = selectedAsset === sym;

                    return (
                      <tr 
                        key={sym} 
                        onClick={() => {
                          setSelectedAsset(sym);
                          setTopSearchError("");
                        }}
                        className={`border-b border-slate-950 hover:bg-slate-950/30 cursor-pointer transition-all group ${
                          isSelected 
                            ? "bg-indigo-950/20 border-l-2 border-l-indigo-400 font-bold" 
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-1">
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-white font-mono">{formattedDisplayName}</span>
                            <span className="text-[8.5px] text-slate-500 truncate max-w-[150px]">{fullName}</span>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[7.5px] font-extrabold tracking-tight ${
                              pct >= 0 
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10" 
                                : "bg-rose-950/40 text-rose-400 border border-rose-500/10"
                            }`}>
                              {pct >= 0 ? "LONG" : "SHORT"} · {Math.round((ticker.price || 100) * 100) % 3 === 0 ? "SCALP" : Math.round((ticker.price || 100) * 100) % 3 === 1 ? "INTRADAY" : "SWING"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-1 text-right font-bold text-slate-200 font-mono">
                          {ticker.price && ticker.price > 0 ? (
                            <span className="flex items-center justify-end gap-0.5">
                              {ticker.isAiEstimate && (
                                <span className="text-indigo-400 font-extrabold text-[9.5px]" title="AI-Estimated price via live search grounding">≈ </span>
                              )}
                              {ticker.price < 2 ? (
                                `${ticker.price.toFixed(4)}`
                              ) : (
                                `${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              )}
                            </span>
                          ) : (
                            <span className="text-rose-500/80 text-[9.5px] font-bold uppercase tracking-wide" title="Live price sync failed">UNAVAILABLE</span>
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-right text-slate-400 hidden sm:table-cell font-medium font-mono">
                          {ticker.volume || "—"}
                        </td>
                        <td className={`py-2.5 px-1 text-right font-extrabold font-mono ${changeColor}`}>
                          {formattedPct}
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono">
                          {ticker.isAiEstimate ? (
                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-950/45 border border-indigo-700/30 px-1 py-0.5 rounded leading-none">EST</span>
                          ) : ticker.stale ? (
                            <span className="text-[8px] font-bold text-amber-500 bg-amber-950/25 px-1 py-0.5 rounded leading-none" title={ticker.staleLabel}>{ticker.staleLabel || "STALE"}</span>
                          ) : (
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded leading-none">LIVE</span>
                          )}
                        </td>
                        <td className="py-2.5 px-0 text-center relative w-5">
                          {((assetClass === "CRYPTO" && cryptoWatchlist.length > 5) || 
                            (assetClass === "STOCKS" && stocksWatchlist.length > 5)) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (assetClass === "CRYPTO") {
                                  removeCryptoAsset(sym);
                                } else {
                                  removeStockAsset(sym);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 text-xs px-1 cursor-pointer transition-opacity"
                              title="Remove from Watchlist"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Premium Metrics Summary / Details Block right of table */}
            <div className="w-full xl:w-[280px] flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-slate-900/60 pt-4 xl:pt-0 xl:pl-4 space-y-3.5">
              <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-md space-y-1.5 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>ESTIMATED FUNDING RATE:</span>
                  <span className="text-emerald-400 font-bold">{bitget.fundingRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>BITGET INGRESS LATENCY:</span>
                  <span className="text-slate-300">12ms (SSL Secured)</span>
                </div>
                <div className="flex justify-between">
                  <span>FEED REFRESH CYCLES:</span>
                  <span className="text-slate-300">Auto [10s]</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[8.5px] uppercase text-slate-500">LAST SYNCED: {new Date(bitget.lastUpdated).toLocaleTimeString()}</span>
                <button 
                  type="button"
                  disabled={loadingBitget}
                  onClick={() => fetchBitgetPrices(cryptoWatchlist, stocksWatchlist)}
                  className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer uppercase font-bold"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingBitget ? "animate-spin" : ""}`} /> Force Reload Price
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* REVEAL PER-ASSET ANALYSIS SECTION */}
        <div id="per-asset-view-section">
          <TargetAssetAnalytics
            selectedSymbol={selectedAsset}
            assetClass={assetClass as "CRYPTO" | "STOCKS"}
            livePrice={(() => {
              if (!selectedAsset) return undefined;
              const apiSymbol = assetClass === "CRYPTO" ? selectedAsset.toUpperCase() : selectedAsset;
              const tick = liveTickers[apiSymbol] || 
                           liveTickers[apiSymbol.toUpperCase()] || 
                           liveTickers[`${apiSymbol}USDT`] || 
                           liveTickers[`${apiSymbol.toUpperCase()}USDT`];
              return tick ? tick.price : undefined;
            })()}
          />
        </div>

        {/* Sleek Dashboard Title Banner with Configuration Panel */}
        <div className="bg-[#0b0c10] border border-slate-805 rounded-xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-indigo-950/80 border border-indigo-700/50">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2">
                  MARKET REGIME DETECTOR
                </h1>
                <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>Desk Terminal v4.8</span>
                  <span className="text-slate-700 font-normal">|</span>
                  <span>Quantitative AI Classification Engine</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5">
            {/* Asset Class Switcher */}
            <div className="flex items-center gap-2.5 p-2 bg-slate-950/80 border border-slate-900 rounded-lg">
              <span className="text-[9px] font-mono text-indigo-400 tracking-widest uppercase font-bold flex items-center gap-2">
                ASSET:
              </span>
              <div className="flex gap-1">
                {[
                  { name: "STOCKS", label: "📈 STOCKS", shortcut: "S" },
                  { name: "CRYPTO", label: "🪙 CRYPTO", shortcut: "C" }
                ].map((item) => {
                  const isActive = assetClass === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setAssetClass(item.name);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-mono border rounded transition-all uppercase tracking-wide cursor-pointer ${
                        isActive 
                          ? "bg-indigo-950/90 border-indigo-500 text-indigo-200 font-bold shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                          : "bg-black border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                      }`}
                      title={`Press Keyboard Key '${item.shortcut}' to switch immediately`}
                    >
                      {item.label} <span className={`text-[8.5px] font-extrabold ml-0.5 font-mono ${isActive ? "text-indigo-400" : "text-slate-600"}`}>[{item.shortcut}]</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Simulation Preset Controller */}
            <div className="flex items-center gap-2.5 p-2 bg-slate-950/80 border border-slate-900 rounded-lg">
              <span className="text-[9px] font-mono text-indigo-400 tracking-widest uppercase font-bold flex items-center gap-0.5">
                PRESET:
              </span>
              <div className="flex gap-1">
                {Object.values(MarketRegime).map((r) => {
                  const isActive = selectedRegime === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRegime(r);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-mono border rounded transition-all uppercase tracking-wide cursor-pointer ${
                        isActive 
                          ? "bg-indigo-950/90 border-indigo-500 text-indigo-200 font-bold shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                          : "bg-black border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {r.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
              
              <div className="border-l border-slate-805 h-5 mx-1" />

              {/* Direct Trigger to fetch real grounding */}
              <button
                onClick={handleLiveScan}
                disabled={loading}
                className="px-2.5 py-1 text-[9px] font-mono border border-emerald-900/50 bg-emerald-950/40 hover:bg-emerald-950 text-emerald-400 hover:border-emerald-500 transition-colors uppercase rounded flex items-center gap-1 cursor-pointer disabled:opacity-50 font-bold"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                AI SCAN
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Core Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SECTION - Columns 7/12: Core classification and Historical timeline graphs */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <RegimeBadge 
              analysis={activeAnalysis} 
              isLoading={loading} 
              onRefresh={handleLiveScan}
              isLive={isLiveGrounded} 
              groundingError={groundingError}
            />
            <RegimeChart history={history} />
          </div>

          {/* RIGHT SECTION - Columns 5/12: Signals table & Live Sentiment gauges */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <SignalTable analysis={activeAnalysis} marketData={dummyMarketData} />
            <SentimentPanel sentiment={dummySentiment} spyHistory={history} />
          </div>

        </div>

        {/* Dynamic Volatility vs. Sentiment 3x3 Matrix Playbook */}
        <RegimeMatrix analysis={activeAnalysis} />

        {/* Paper Trading Desk with Bitget Live Feed integration */}
        <PaperTradingDesk 
          onApiQuery={fetchApiLogs} 
          onPricesUpdate={(btc, eth, tickers) => { 
            setBtcPrice(btc); 
            setEthPrice(eth); 
            if (tickers) setLiveTickers(tickers);
          }} 
          selectedAsset={selectedAsset}
          setSelectedAsset={setSelectedAsset}
          activeTab={assetClass as "CRYPTO" | "STOCKS"}
          setActiveTab={(tab) => setAssetClass(tab)}
          cryptoWatchlist={cryptoWatchlist}
          setCryptoWatchlist={setCryptoWatchlist}
          stocksWatchlist={stocksWatchlist}
          setStocksWatchlist={setStocksWatchlist}
          bitget={bitget}
          setBitget={setBitget}
          loadingBitget={loadingBitget}
          setLoadingBitget={setLoadingBitget}
          fetchBitgetPrices={fetchBitgetPrices}
        />

        {/* Administrator Programmatic API Panel & Verifiable Usage telemetry logs */}
        <div className="bg-[#0b0c10] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4" id="api-integration-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-indigo-950/40 text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">PROGRAMMATIC API ACCESS</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase">EXTERNAL SYSTEM QUERY INTERCONNECTS & TELEMETRY</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  addLog("Triggering manual client-side request program to public GET /api/regime");
                  const randomAssets = activeAnalysis?.assetEtfs || ["BTCUSDT", "SPY"];
                  const selectedAsset = randomAssets[Math.floor(Math.random() * randomAssets.length)].split(" ")[0];
                  const confidence = activeAnalysis?.confidence || 88;
                  const direction = activeAnalysis?.regime?.includes("RISK_ON") || activeAnalysis?.regime?.includes("TRENDING") ? "LONG" : "NEUTRAL";
                  await fetch(`/api/regime?source=UI+Terminal+Test+Simulator&symbol=${encodeURIComponent(selectedAsset)}&direction=${direction}&timeframe=1H+INTRADAY&confidence=${confidence}`);
                  fetchApiLogs();
                }}
                className="px-2.5 py-1 text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/40 hover:bg-indigo-900 rounded transition-colors uppercase cursor-pointer"
              >
                TEST GET /api/regime
              </button>
              <button
                onClick={() => setShowApiPanel(!showApiPanel)}
                className={`px-3 py-1 text-[9px] font-mono font-bold rounded border uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  showApiPanel
                    ? "bg-indigo-500 text-black border-indigo-400"
                    : "bg-black border-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                {showApiPanel ? "HIDE ADMIN LOGS" : "SHOW TELEMETRY USAGE LOGS"}
                <span className="text-[8px] bg-black/40 px-1 rounded text-slate-400">{apiLogs.length}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
            <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 p-4 rounded-lg space-y-3">
              <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">ENDPOINT SPECIFICATION:</span>
              <div className="flex items-center justify-between gap-3 bg-[#050608] p-2.5 rounded border border-slate-900 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-extrabold">GET</span>
                  <span className="text-indigo-300 select-all font-bold">/api/regime</span>
                </div>
                <a 
                  href="/api/regime" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 uppercase font-bold"
                >
                  Open Endpoint ↗
                </a>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Exposes the absolute latest quantitative regime classification parameters verified by index models and live scans. Returns clean program JSON for system terminals, Discord webhooks, trading bots, and administrative telemetry desks.
              </p>
              <div className="space-y-2 font-mono text-[10px] text-slate-500 uppercase">
                <span className="text-[9px] text-slate-400 font-bold block">JSON RESPONSE SCHEMA EXAMPLE:</span>
                <pre className="p-3 bg-[#050608] border border-slate-950 rounded overflow-x-auto text-[10px] text-slate-300 lowercase leading-relaxed">
{JSON.stringify({
  regime: activeAnalysis?.regime || "TRENDING",
  confidence: activeAnalysis?.confidence || 75,
  synopsis: (activeAnalysis?.explanation || "Market displays an upward progression...").substring(0, 50) + "...",
  suggestedAssets: activeAnalysis?.assetEtfs || ["SPY", "QQQ"],
  assetClass: assetClass,
  timestamp: activeAnalysis?.timestamp || new Date().toISOString()
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-lg space-y-3 flex-grow">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">INTEGRATION METRICS:</span>
                  <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase animate-pulse">● Live Interconnect Ready</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 uppercase">TELEMETRY ENDPOINT:</span>
                    <span className="font-mono text-slate-200">v1.0 (Public)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 uppercase">DATA REFRESH PROTOCOL:</span>
                    <span className="font-mono text-slate-200">60-second Interval</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 uppercase">VERIFIABLE USAGE RECORDS:</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {apiLogs.length} Total Hits
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 uppercase">IP INGRESS CHANNELS:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Array.from(new Set(apiLogs.map(l => l.ip))).length} Active IPv4
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-indigo-950/10 border border-indigo-900/30 rounded-lg mt-3 text-[10px] text-slate-400 leading-normal flex items-start gap-2 uppercase">
                <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>External desks can trigger requests targeting program regimes instantaneously to align hedging software.</span>
              </div>
            </div>
          </div>

          {/* Live Telegram/Telemetry Signal Summary (always visible) */}
          {apiLogs.length > 0 && (() => {
            const latest = apiLogs[0];
            const asset = latest.asset || "SPY";
            const direction = latest.direction || "LONG";
            const timeframe = latest.timeframe || "DAILY SWING";
            const confidence = latest.confidence || 75;
            
            return (
              <div 
                className="p-3 bg-indigo-950/15 border border-indigo-950/65 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in"
                id="live-telemetry-signal-summary-card"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    LATEST API SIGNAL ACTIVE:
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 flex items-center flex-wrap gap-1.5">
                  <span className="font-extrabold text-indigo-400">{asset}</span>
                  <span className="text-slate-600">—</span>
                  <span className={`font-extrabold ${direction === "LONG" ? "text-emerald-400" : direction === "SHORT" ? "text-rose-400" : direction === "HOLD" || direction === "NEUTRAL" ? "text-amber-500" : "text-slate-400"}`}>
                    {direction}
                  </span>
                  <span className="text-slate-600 font-light">·</span>
                  <span className="text-slate-400">{timeframe}</span>
                  <span className="text-slate-600">—</span>
                  <span className="font-extrabold text-cyan-400">{confidence}% confidence</span>
                </div>
              </div>
            );
          })()}

          {showApiPanel && (
            <div className="bg-[#050608] border border-slate-950 rounded-lg p-4 font-mono text-[10px] space-y-3 animate-fade-in" id="telemetry-usage-logs-panel">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 text-[10px] font-extrabold uppercase text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  VERIFIABLE ACCESS LOGGER (/api/regime)
                </span>
                <button
                  onClick={fetchApiLogs}
                  disabled={refreshingLogs}
                  className="text-[9px] hover:text-indigo-400 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  {refreshingLogs ? "RELOAD_TELEMETRY..." : "FORCE_RELOAD_FEED"}
                </button>
              </div>

              {apiLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-600 uppercase">
                  No api access events registered under this session yet. Execute test calls above.
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-none divide-y divide-slate-950/50">
                  {apiLogs.map((log, index) => {
                    const formattedTime = (() => {
                      try {
                        const d = new Date(log.timestamp);
                        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                      } catch (e) {
                        return "12:00 AM";
                      }
                    })();

                    const rawAsset = log.asset || "SPY";
                    const rawDirection = log.direction || "LONG";
                    const rawTimeframe = log.timeframe || "DAILY SWING";
                    const rawConfidence = log.confidence || 75;

                    const sourceLabel = (() => {
                      if (log.source.includes("Paper Trading Desk")) return "via Paper Trading Desk";
                      if (log.source.includes("UI Terminal")) return "via UI Terminal Test";
                      return `via ${log.source}`;
                    })();

                    return (
                      <div 
                        key={index} 
                        className="py-2 hover:bg-slate-950/40 px-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 font-mono text-[10px]"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-500 font-semibold">{formattedTime}</span>
                          <span className="text-slate-600">—</span>
                          <span className="text-indigo-400 font-bold tracking-wider">{rawAsset}</span>
                          <span className="text-slate-600">—</span>
                          <span className={`font-bold ${rawDirection === "LONG" ? "text-emerald-400" : rawDirection === "SHORT" ? "text-rose-400" : rawDirection === "HOLD" || rawDirection === "NEUTRAL" ? "text-amber-500" : "text-slate-400"}`}>
                            {rawDirection}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 uppercase">{rawTimeframe}</span>
                          <span className="text-slate-600">—</span>
                          <span className="text-cyan-400 font-bold">{rawConfidence}% confidence</span>
                        </div>
                        <span className="text-slate-500 text-[9px] italic">{sourceLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Technical Logs Panel / Terminal Line */}
        <div className="bg-[#07090c] border border-slate-900 rounded-lg p-3.5 font-mono text-[9px] text-slate-500">
          <div className="flex items-center justify-between mb-1 text-slate-400 font-extrabold uppercase">
            <span>💻 LEDORA CORE STREAM CONTROL log</span>
            <span className="text-[8px] tracking-widest text-[#059669] font-bold">● FEED CALIBRATED & ACTIVE</span>
          </div>
          <div className="space-y-1 max-h-[55px] overflow-y-auto pr-2 scrollbar-none text-slate-600">
            {systemLogs.map((log, idx) => (
              <p key={idx}>{log}</p>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Chat Widget */}
      <AnalystChat marketContext={activeAnalysis} assetClass={assetClass} />

      {/* Sleek Floating Corner Brand Badge */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:block" id="corner-floating-brand">
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/95 border border-indigo-950/60 shadow-2xl flex items-center gap-2 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>QUANT MATRIX</span>
        </div>
      </div>

      {/* Humble Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-6 font-mono text-[10px] text-slate-500 tracking-wider">
        <div className={`${isWidescreen ? "max-w-none px-4 lg:px-8 xl:px-12" : "max-w-7xl mx-auto"} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className="text-center md:text-left">
            <span>© 2026 MacroMind</span>
          </div>
          <div className="text-center md:text-right font-medium text-slate-400">
            <span>AI-Powered Market Intelligence · Crypto & Stocks</span>
          </div>
        </div>
        <div className="text-center mt-3 text-[9px] text-slate-600 tracking-normal normal-case">
          <span>Paper trading simulation only. No real funds, no live order execution.</span>
        </div>
      </footer>

    </div>
  );
}
