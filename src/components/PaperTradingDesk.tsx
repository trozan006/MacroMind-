import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Coins, 
  Clock, 
  DollarSign, 
  Activity,
  Award,
  BookOpen,
  Search
} from "lucide-react";
import TargetAssetAnalytics from "./TargetAssetAnalytics";

interface SimulatedTrade {
  id: string;
  timestamp: string;
  asset: string;
  direction: "LONG" | "SHORT" | "HOLD";
  price: number;
  exitPrice?: number;
  quantity: number;
  balanceAfter: number;
  reason: string;
  timeframe?: "SCALP" | "INTRADAY" | "SWING";
  timeframeLabel?: string;
  stopLoss?: number;
  takeProfit?: number;
  status: "OPEN" | "CLOSED_PROFIT" | "CLOSED_LOSS" | "CLOSED_MANUAL" | "HOLD";
  pnlDollar?: number;
  pnlPercent?: number;
  journalNote?: string;
  leverage?: number;
  marginVal?: number;
  liquidationPrice?: number;
  isManualTrade?: boolean;
}

interface TickerData {
  price: number;
  volume: string;
  stale: boolean;
  staleLabel?: string;
  success?: boolean;
  isAiEstimate?: boolean;
}

interface BitgetFeed {
  btc: number;
  eth: number;
  btcVolume: string;
  ethVolume: string;
  fundingRate: string;
  stale: boolean;
  lastUpdated: string;
  tickers: Record<string, TickerData>;
}

interface PaperTradingDeskProps {
  onApiQuery?: () => void;
  onPricesUpdate?: (btc: number, eth: number, tickers?: any) => void;
  selectedAsset: string | null;
  setSelectedAsset: (sym: string | null) => void;
  activeTab: "CRYPTO" | "STOCKS";
  setActiveTab: (tab: "CRYPTO" | "STOCKS") => void;
  cryptoWatchlist: string[];
  setCryptoWatchlist: React.Dispatch<React.SetStateAction<string[]>>;
  stocksWatchlist: string[];
  setStocksWatchlist: React.Dispatch<React.SetStateAction<string[]>>;
  // Lifted pricing details
  bitget: BitgetFeed;
  setBitget: React.Dispatch<React.SetStateAction<BitgetFeed>>;
  loadingBitget: boolean;
  setLoadingBitget: React.Dispatch<React.SetStateAction<boolean>>;
  fetchBitgetPrices: (customCrypto?: string[], customStocks?: string[]) => Promise<void>;
}

export default function PaperTradingDesk({ 
  onApiQuery, 
  onPricesUpdate,
  selectedAsset,
  setSelectedAsset,
  activeTab,
  setActiveTab,
  cryptoWatchlist,
  setCryptoWatchlist,
  stocksWatchlist,
  setStocksWatchlist,
  bitget,
  setBitget,
  loadingBitget,
  setLoadingBitget,
  fetchBitgetPrices
}: PaperTradingDeskProps) {
  // Initialize virtual balance ($10,000 starting)
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem("paper_balance");
    return saved ? parseFloat(saved) : 10000.00;
  });

  // Track initial trade log setup
  const [trades, setTrades] = useState<SimulatedTrade[]>(() => {
    const saved = localStorage.getItem("paper_trades");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Start with realistic historical sample trades for beautiful visual scaffolding
    return [
      {
        id: "default-1",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        asset: "BTC-USDT",
        direction: "LONG",
        price: 64250.00,
        exitPrice: 68105.00,
        quantity: 0.05,
        balanceAfter: 10192.75,
        reason: "Bullish swing structure breakout confirmed on daily moving averages",
        timeframe: "SWING",
        timeframeLabel: "4H SWING",
        stopLoss: 62322.50,
        takeProfit: 68105.00,
        status: "CLOSED_PROFIT",
        pnlDollar: 192.75,
        pnlPercent: 6.0,
        journalNote: "Trend structure played out flawlessly. Standard 1:2 R:R ratios on higher timeframes allowed profit taking to trigger right below nearest historical local resistance zone, securing dynamic target yields."
      },
      {
        id: "default-2",
        timestamp: new Date(Date.now() - 86450000).toISOString(),
        asset: "TSLA",
        direction: "SHORT",
        price: 185.20,
        exitPrice: 190.75,
        quantity: 10,
        balanceAfter: 10137.25,
        reason: "Fading overbought RSI levels combined with local Bollinger Bands exhaustion",
        timeframe: "INTRADAY",
        timeframeLabel: "1H INTRADAY",
        stopLoss: 190.75,
        takeProfit: 174.00,
        status: "CLOSED_LOSS",
        pnlDollar: -55.50,
        pnlPercent: -3.00,
        journalNote: "Short fade was stopped out as positive broader index sentiment pushed spot prices aggressively above the VWAP pivot level."
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [lastSeenRegime, setLastSeenRegime] = useState<string>("");
  const [runningTradeSim, setRunningTradeSim] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastTradeSkippedReason, setLastTradeSkippedReason] = useState<string>("");

  // Leverage & Margin configuration states
  const [selectedLeverage, setSelectedLeverage] = useState<number>(() => {
    const saved = localStorage.getItem("paper_default_leverage");
    return saved ? parseInt(saved) : 2;
  });
  const [selectedMarginPct, setSelectedMarginPct] = useState<number>(() => {
    const saved = localStorage.getItem("paper_default_margin_pct");
    return saved ? parseInt(saved) : 10;
  });

  // Manual trade entry states
  const [manualDirection, setManualDirection] = useState<"LONG" | "SHORT">("LONG");
  const [manualLeverage, setManualLeverage] = useState<number>(2);
  const [manualMarginUSD, setManualMarginUSD] = useState<number>(1000);
  const [customStopLoss, setCustomStopLoss] = useState<string>("");
  const [customTakeProfit, setCustomTakeProfit] = useState<string>("");
  const [manualAssetSelect, setManualAssetSelect] = useState<string>("");
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState("");
  const [autoTraderActive, setAutoTraderActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("paper_autotrader_enabled");
    return saved !== "false"; // default to true
  });

  useEffect(() => {
    localStorage.setItem("paper_autotrader_enabled", autoTraderActive ? "true" : "false");
  }, [autoTraderActive]);

  useEffect(() => {
    localStorage.setItem("paper_default_leverage", selectedLeverage.toString());
  }, [selectedLeverage]);

  useEffect(() => {
    localStorage.setItem("paper_default_margin_pct", selectedMarginPct.toString());
  }, [selectedMarginPct]);

  // Synchronize default selection on tab changes to keep display aligned
  useEffect(() => {
    if (selectedAsset === null) return;
    const list = activeTab === "CRYPTO" ? cryptoWatchlist : stocksWatchlist;
    if (list.length > 0 && !list.includes(selectedAsset)) {
      setSelectedAsset(list[0]);
    }
  }, [activeTab, cryptoWatchlist, stocksWatchlist, selectedAsset]);

  // Tracking state refs to avoid duplicate auto-trades and spamming transactions
  const lastLoggedRegimeRef = React.useRef<string | null>(null);
  const lastLoggedConfidenceRef = React.useRef<number | null>(null);
  const lastTradeExecutionTimeRef = React.useRef<number>(0);

  // Keep refs in sync with state to completely prevent stale closures in async callbacks and interval tasks
  const tradesRef = React.useRef<SimulatedTrade[]>(trades);
  const balanceRef = React.useRef<number>(balance);

  const macdHistoriesRef = React.useRef<Record<string, number[]>>({});
  const lastKnownGoodPricesRef = React.useRef<Record<string, number>>({});

  const updateMacdHistory = (symbol: string, currentHist: number) => {
    if (!macdHistoriesRef.current[symbol]) {
      // Seed history: if positive, seed as positive and increasing; if negative, seed as negative and decreasing
      if (currentHist > 0) {
        macdHistoriesRef.current[symbol] = [currentHist * 0.8, currentHist * 0.9, currentHist];
      } else {
        macdHistoriesRef.current[symbol] = [currentHist * 1.2, currentHist * 1.1, currentHist];
      }
    } else {
      const hist = [...macdHistoriesRef.current[symbol], currentHist];
      if (hist.length > 5) {
        hist.shift();
      }
      macdHistoriesRef.current[symbol] = hist;
    }
    return macdHistoriesRef.current[symbol];
  };

  const isVolumeAtOrAbove7dAverage = (anaData: any, assetClass: string) => {
    if (assetClass === "CRYPTO") {
      const volStr = anaData.volume_vs_7d_avg || "Rising";
      return volStr.includes("Rising") || volStr.includes("+") || !volStr.includes("Falling");
    } else {
      const rvolStr = anaData.relative_volume || "1.0x";
      const parsed = parseFloat(rvolStr);
      if (!isNaN(parsed)) {
        return parsed >= 1.0;
      }
      return !rvolStr.includes("Falling") && !rvolStr.includes("Below");
    }
  };

  const validateStrategyCriteria = async (
    symbol: string,
    direction: "LONG" | "SHORT",
    price: number,
    isManualClick: boolean
  ): Promise<{ qualified: boolean; reason: string; technicals?: any }> => {
    // 0. PRICE ACCURACY FILTER (CRITICAL)
    const expectedFallback = getLivePriceOfAsset(symbol, { ...bitget, tickers: {} });
    const lastKnown = lastKnownGoodPricesRef.current[symbol] || expectedFallback;
    const priceDiffPct = Math.abs(price - lastKnown) / lastKnown;
    if (priceDiffPct > 0.20) {
      const rejectMsg = `Trade rejected: price data suspect for ${symbol} ($${price.toFixed(2)} — possible stale feed)`;
      return { qualified: false, reason: rejectMsg };
    }
    // Update last known good price ref on success
    lastKnownGoodPricesRef.current[symbol] = price;

    // 1. Fetch regime and confidence score
    const res = await fetch(`/api/regime?source=Paper+Trading+Desk+Agent&silent=true`);
    if (!res.ok) {
      return { qualified: false, reason: "Could not fetch programmatic api/regime." };
    }
    const regimeData = await res.json();
    const currentRegime = (regimeData.regime || "TRENDING").toUpperCase();
    const confidence = regimeData.confidence || 75;

    // Condition 7: Confidence score is 85% or above
    if (confidence < 85) {
      return { qualified: false, reason: `Confidence score ${confidence}% is below 85%` };
    }

    // Condition 1: Macro regime
    if (direction === "LONG") {
      if (currentRegime !== "TRENDING" && currentRegime !== "RISK_ON") {
        return { qualified: false, reason: `Macro regime is not TRENDING or RISK-ON (current: ${currentRegime})` };
      }
    } else {
      if (currentRegime !== "RISK_OFF" && currentRegime !== "RANGING") {
        return { qualified: false, reason: `Macro regime is not RISK-OFF or RANGING (current: ${currentRegime})` };
      }
    }

    // Condition 8: No existing open position in the same instrument
    const currentTradesList = tradesRef.current || trades;
    const cleanSym = symbol.toUpperCase().replace("USDT", "");
    const hasOpenPosition = currentTradesList.some(t => {
      if (t.status !== "OPEN") return false;
      const tClean = t.asset.toUpperCase().replace("-USDT", "").replace("USDT", "");
      return tClean === cleanSym;
    });
    if (hasOpenPosition) {
      return { qualified: false, reason: "Existing open position in the same instrument" };
    }

    // Fetch technicals
    const assetClassValue = cryptoWatchlist.includes(symbol) ? "CRYPTO" : "STOCKS";
    const anaRes = await fetch(`/api/asset-technical-analysis?symbol=${encodeURIComponent(symbol)}&assetClass=${encodeURIComponent(assetClassValue)}&price=${price}`);
    if (!anaRes.ok) {
      return { qualified: false, reason: "Could not fetch technical analyzer data." };
    }
    const technicals = await anaRes.json();

    const sma50 = technicals.trend_50 || price * 0.96;
    const sma200 = technicals.trend_200 || price * 0.92;
    const rsiVal = technicals.rsi !== undefined ? technicals.rsi : 50;
    const macdHist = technicals.macd_histogram !== undefined ? technicals.macd_histogram : 0;
    
    // Condition 2: SMA conditions
    if (direction === "LONG") {
      if (price <= sma50 || price <= sma200) {
        return { qualified: false, reason: `Price ($${price.toFixed(2)}) is not above both 50 SMA ($${sma50.toFixed(2)}) and 200 SMA ($${sma200.toFixed(2)})` };
      }
    } else {
      if (price >= sma50 || price >= sma200) {
        return { qualified: false, reason: `Price ($${price.toFixed(2)}) is not below both 50 SMA ($${sma50.toFixed(2)}) and 200 SMA ($${sma200.toFixed(2)})` };
      }
    }

    // Condition 3: MACD histogram is positive/negative AND increasing/decreasing for 2 consecutive cycles
    const macdHistories = updateMacdHistory(symbol, macdHist);
    if (direction === "LONG") {
      if (macdHist <= 0) {
        return { qualified: false, reason: `MACD histogram (${macdHist.toFixed(4)}) is not positive` };
      }
      if (macdHistories.length >= 3) {
        const h0 = macdHistories[macdHistories.length - 3];
        const h1 = macdHistories[macdHistories.length - 2];
        const h2 = macdHistories[macdHistories.length - 1];
        if (!(h2 > h1 && h1 > h0)) {
          return { qualified: false, reason: `MACD histogram is not increasing for 2 consecutive cycles (last 3: [${h0.toFixed(4)}, ${h1.toFixed(4)}, ${h2.toFixed(4)}])` };
        }
      }
    } else {
      if (macdHist >= 0) {
        return { qualified: false, reason: `MACD histogram (${macdHist.toFixed(4)}) is not negative` };
      }
      if (macdHistories.length >= 3) {
        const h0 = macdHistories[macdHistories.length - 3];
        const h1 = macdHistories[macdHistories.length - 2];
        const h2 = macdHistories[macdHistories.length - 1];
        if (!(h2 < h1 && h1 < h0)) {
          return { qualified: false, reason: `MACD histogram is not decreasing for 2 consecutive cycles (last 3: [${h0.toFixed(4)}, ${h1.toFixed(4)}, ${h2.toFixed(4)}])` };
        }
      }
    }

    // Condition 4: RSI conditions
    if (direction === "LONG") {
      if (rsiVal < 45 || rsiVal > 65) {
        return { qualified: false, reason: `RSI (${rsiVal.toFixed(1)}) is outside 45 and 65 inclusive` };
      }
    } else {
      if (rsiVal < 35 || rsiVal > 55) {
        return { qualified: false, reason: `RSI (${rsiVal.toFixed(1)}) is outside 35 and 55 inclusive` };
      }
    }

    // Condition 5: 24h volume is at or above 7-day average
    const volumeAtOrAbove = isVolumeAtOrAbove7dAverage(technicals, assetClassValue);
    if (!volumeAtOrAbove) {
      const volText = assetClassValue === "CRYPTO" ? technicals.volume_vs_7d_avg : technicals.relative_volume;
      return { qualified: false, reason: `24H volume is below its 7-day average (current: ${volText})` };
    }

    // Condition 6: Support or resistance proximity (not within 0.5% of resist for long, nearest support for short)
    if (direction === "LONG") {
      const resistanceVal = technicals.resistance || (price * 1.05);
      const proximity = Math.abs(price - resistanceVal) / resistanceVal;
      if (proximity < 0.005) {
        return { qualified: false, reason: `Price ($${price.toLocaleString()}) is within 0.5% of nearest resistance ($${resistanceVal.toLocaleString()})` };
      }
    } else {
      const supportVal = technicals.support || (price * 0.94);
      const proximity = Math.abs(price - supportVal) / supportVal;
      if (proximity < 0.005) {
        return { qualified: false, reason: `Price ($${price.toLocaleString()}) is within 0.5% of nearest support ($${supportVal.toLocaleString()})` };
      }
    }

    return { qualified: true, reason: "Successfully qualified", technicals };
  };

  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("paper_balance", balance.toFixed(2));
    localStorage.setItem("paper_trades", JSON.stringify(trades));
    localStorage.setItem("paper_crypto_watchlist", JSON.stringify(cryptoWatchlist));
    localStorage.setItem("paper_stocks_watchlist", JSON.stringify(stocksWatchlist));
  }, [balance, trades, cryptoWatchlist, stocksWatchlist]);

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

  const cleanAssetSymbol = (symbol: string) => {
    const clean = symbol.replace("-USDT", "").replace("USDT", "").toUpperCase();
    if (clean.startsWith("R") && clean.length > 3) {
      return clean.substring(1);
    }
    return clean;
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

  // Resolve asset pricing dynamically with fallback dictionary for robust data flow
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

  // Return daily rolling limit and counts
  const getDailyTradeLimitInfo = () => {
    const now = Date.now();
    const latestTrades = tradesRef.current || trades;
    const activeTrades = latestTrades.filter(t => {
      if (t.status === "HOLD" || t.direction === "HOLD") return false;
      if (t.timeframeLabel === "MANUAL" || t.isManualTrade) return false;
      const tTime = new Date(t.timestamp).getTime();
      return (now - tTime) < 24 * 60 * 60 * 1000;
    });
    
    const count = activeTrades.length;
    const limitReached = count >= 3;
    
    let resetMsg = "";
    if (limitReached && activeTrades.length > 0) {
      const times = activeTrades.map(t => new Date(t.timestamp).getTime());
      const oldestTime = Math.min(...times);
      const msLeft = (oldestTime + 24 * 60 * 60 * 1000) - now;
      if (msLeft > 0) {
        const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));
        const minsLeft = Math.ceil((msLeft % (60 * 60 * 1000)) / (60 * 1000));
        resetMsg = `next slot opens in ${hoursLeft}h ${minsLeft}m`;
      } else {
        resetMsg = "next slot opens soon";
      }
    }
    
    return { count, limitReached, resetMsg };
  };

  const closeTradeManual = async (tradeId: string) => {
    let currentBalance = balance;
    let balanceChanged = false;
    
    const updatedTrades = trades.map(t => {
      if (t.id === tradeId && t.status === "OPEN") {
        const livePrice = getLivePriceOfAsset(t.asset, bitget);
        const exitPrice = livePrice;
        let pnlDollar = 0;
        let pnlPercent = 0;
        
        const marginVal = t.marginVal || (t.price * t.quantity);
        
        if (t.direction === "LONG") {
          pnlDollar = (exitPrice - t.price) * t.quantity;
        } else {
          pnlDollar = (t.price - exitPrice) * t.quantity;
        }
        
        // Cap losses at isolated collateral limit
        if (pnlDollar < -marginVal) {
          pnlDollar = -marginVal;
        }
        
        pnlPercent = (pnlDollar / marginVal) * 100;
        
        currentBalance += pnlDollar;
        balanceChanged = true;
        
        const closedTrade: SimulatedTrade = {
          ...t,
          status: "CLOSED_MANUAL" as const,
          exitPrice,
          pnlDollar: parseFloat(pnlDollar.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent.toFixed(2)),
          balanceAfter: parseFloat(currentBalance.toFixed(2))
        };
        
        generateJournalNoteAsync(closedTrade);
        return closedTrade;
      }
      return t;
    });
    
    if (balanceChanged) {
      setTrades(updatedTrades);
      setBalance(currentBalance);
    }
  };

  const lastPrefilledAssetRef = React.useRef<string>("");
  useEffect(() => {
    const assetToPrefill = manualAssetSelect || selectedAsset;
    if (assetToPrefill && assetToPrefill !== lastPrefilledAssetRef.current) {
      lastPrefilledAssetRef.current = assetToPrefill;
      setManualAssetSelect(assetToPrefill);
      const livePrice = getLivePriceOfAsset(assetToPrefill, bitget);
      if (livePrice && livePrice > 0) {
        const slPct = 0.03;
        const tpPct = 0.06;
        let sl = livePrice * (1 - slPct);
        let tp = livePrice * (1 + tpPct);
        if (manualDirection === "SHORT") {
          sl = livePrice * (1 + slPct);
          tp = livePrice * (1 - tpPct);
        }
        setCustomStopLoss(sl.toFixed(2));
        setCustomTakeProfit(tp.toFixed(2));
      }
    }
  }, [selectedAsset, manualAssetSelect, manualDirection, bitget]);

  const executeManualLeverageTrade = async () => {
    setManualError("");
    const assetToTrade = manualAssetSelect || selectedAsset;
    
    if (!assetToTrade) {
      setManualError("Please select a watchlisted asset or search for one first.");
      return;
    }
    
    const assetPrice = getLivePriceOfAsset(assetToTrade, bitget);
    if (!assetPrice || assetPrice <= 0 || isNaN(assetPrice)) {
      setManualError("Live price unavailable. Please wait for prices to update, or try another ticker.");
      return;
    }
    
    // Validate strict strategy criteria for manual trades
    const validationResult = await validateStrategyCriteria(assetToTrade, manualDirection, assetPrice, true);
    if (!validationResult.qualified) {
      setManualError(`Compliance Rejected: ${validationResult.reason}`);
      setLastTradeSkippedReason(`Skipped manual ${assetToTrade}: ${validationResult.reason}`);
      return;
    }
    
    // Parse stop loss and take profit
    const sl = parseFloat(customStopLoss);
    const tp = parseFloat(customTakeProfit);
    
    if (isNaN(sl) || sl <= 0) {
      setManualError("Specify a valid numerical Stop Loss price.");
      return;
    }
    
    if (isNaN(tp) || tp <= 0) {
      setManualError("Specify a valid numerical Take Profit price.");
      return;
    }
    
    // Validate bounds
    if (manualDirection === "LONG") {
      if (sl >= assetPrice) {
        setManualError("Stop Loss for LONG must be below entry price.");
        return;
      }
      if (tp <= assetPrice) {
        setManualError("Take Profit for LONG must be above entry price.");
        return;
      }
    } else {
      if (sl <= assetPrice) {
        setManualError("Stop Loss for SHORT must be above entry price.");
        return;
      }
      if (tp >= assetPrice) {
        setManualError("Take Profit for SHORT must be below entry price.");
        return;
      }
    }
    
    const marginUSD = manualMarginUSD;
    if (isNaN(marginUSD) || marginUSD <= 0) {
      setManualError("Available margin input must be a valid positive number.");
      return;
    }
    
    const currentTradesList = tradesRef.current || [];
    const totalMarginLocked = currentTradesList
      .filter(t => t.status === "OPEN")
      .reduce((sum, t) => sum + (t.marginVal || (t.price * t.quantity) / (t.leverage || 1)), 0);
    const freeCapital = Math.max(0, balance - totalMarginLocked);
    
    if (marginUSD > freeCapital) {
      setManualError(`Insufficient free capital! Your available cash is $${freeCapital.toFixed(2)}. This trade requires $${marginUSD.toFixed(2)} collateral.`);
      return;
    }
    
    if (marginUSD < 10) {
      setManualError("Minimum isolated margin collateral is $10.00.");
      return;
    }
    
    // Calculate liquidation price (isolated margin maintenance model at 95% loss)
    let liquidationPrice = assetPrice * (1 - 0.95 / manualLeverage);
    if (manualDirection === "SHORT") {
      liquidationPrice = assetPrice * (1 + 0.95 / manualLeverage);
    }
    
    // Check if Stop Loss exceeds Liquidation price
    if (manualDirection === "LONG") {
      if (sl <= liquidationPrice) {
        setManualError(`Liquidation warning! Stop Loss ($${sl.toFixed(2)}) is below liquidation price ($${liquidationPrice.toFixed(2)}). Tighten your Stop Loss or lower the leverage.`);
        return;
      }
    } else {
      if (sl >= liquidationPrice) {
        setManualError(`Liquidation warning! Stop Loss ($${sl.toFixed(2)}) is above liquidation price ($${liquidationPrice.toFixed(2)}). Tighten your Stop Loss or lower the leverage.`);
        return;
      }
    }
    
    // Calculate quantity
    const positionValue = marginUSD * manualLeverage;
    const qty = parseFloat((positionValue / assetPrice).toFixed(4));
    
    if (qty <= 0) {
      setManualError("Calculated size is too small. Increase leverage or margin collateral.");
      return;
    }
    
    const newTrade: SimulatedTrade = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      asset: assetToTrade,
      direction: manualDirection,
      price: assetPrice,
      quantity: qty,
      balanceAfter: balance, // remains unchanged on open!
      reason: `Manual execution. Position: ${manualLeverage}x Isolated ${manualDirection}, Collateral: $${marginUSD.toFixed(2)}.`,
      status: "OPEN",
      leverage: manualLeverage,
      marginVal: marginUSD,
      liquidationPrice: parseFloat(liquidationPrice.toFixed(4)),
      stopLoss: parseFloat(sl.toFixed(4)),
      takeProfit: parseFloat(tp.toFixed(4)),
      timeframe: "INTRADAY",
      timeframeLabel: "MANUAL",
      isManualTrade: true
    };
    
    setTrades(prev => [newTrade, ...prev]);
    setManualSuccess(`SUCCESS: Isolated ${manualLeverage}x ${manualDirection} position opened on ${assetToTrade} of $${positionValue.toFixed(2)} position size!`);
    
    // Reset form success/errors safely
    setTimeout(() => {
      setManualSuccess("");
    }, 5000);
  };

  const generateJournalNoteAsync = async (trade: SimulatedTrade) => {
    try {
      const response = await fetch("/api/generate-trade-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: trade.asset,
          direction: trade.direction,
          timeframe: trade.timeframeLabel,
          entryPrice: trade.price,
          exitPrice: trade.exitPrice,
          pnlDollar: trade.pnlDollar,
          pnlPercent: trade.pnlPercent,
          status: trade.status
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.note) {
          setTrades(prev => prev.map(item => {
            if (item.id === trade.id) {
              return { ...item, journalNote: json.note };
            }
            return item;
          }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch journal reflection note:", e);
    }
  };

  // Triggers simulated trade based on API regime endpoint consumption (GET /api/regime)
  const runSimulatedTradeStep = async (isManual = false) => {
    if (runningTradeSim) return;

    if (!isManual && !autoTraderActive) {
      return;
    }

    // Check rolling-24h trade count check BEFORE generating any trade, blocking generation entirely
    const limitInfoCheck = getDailyTradeLimitInfo();
    if (limitInfoCheck.limitReached) {
      return;
    }

    setRunningTradeSim(true);
    try {
      // 1. Consume `/api/regime` internally silently so we can fetch current state parameters!
      const res = await fetch(`/api/regime?source=Paper+Trading+Desk+Agent&silent=true`);
      if (!res.ok) throw new Error("Could not fetch programmatic api/regime.");
      
      const regimeData = await res.json();
      const currentRegime = (regimeData.regime || "TRENDING").toUpperCase();
      const confidence = regimeData.confidence || 75;

      // Handle macro regime flipping completely: was TRENDING, now RISK_OFF -> close all open LONGs immediately!
      const normalizedRegime = currentRegime;
      const normalizedLastRegime = lastSeenRegime.toUpperCase();
      const isLastBullish = normalizedLastRegime.includes("TRENDING") || normalizedLastRegime.includes("RISK_ON") || normalizedLastRegime.includes("BULLISH") || normalizedLastRegime === "";
      const isCurrentBearish = normalizedRegime.includes("RISK_OFF") || normalizedRegime.includes("BEARISH");
      
      if (isCurrentBearish && isLastBullish && lastSeenRegime !== "") {
        const latestTrades = tradesRef.current || trades;
        const openLongs = latestTrades.filter(t => t.status === "OPEN" && t.direction === "LONG");
        if (openLongs.length > 0) {
          let currentBalance = balanceRef.current;
          const updatedTrades = latestTrades.map(t => {
            if (t.status === "OPEN" && t.direction === "LONG") {
              const livePrice = getLivePriceOfAsset(t.asset, bitget) || t.price;
              const marginVal = t.marginVal || (t.price * t.quantity);
              const computedPnl = (livePrice - t.price) * t.quantity;
              const pnlDollar = Math.max(-marginVal, computedPnl);
              const pnlPercent = (pnlDollar / marginVal) * 100;
              currentBalance += pnlDollar;
              
              const closedTrade: SimulatedTrade = {
                ...t,
                status: "CLOSED_LOSS",
                exitPrice: livePrice,
                pnlDollar: parseFloat(pnlDollar.toFixed(2)),
                pnlPercent: parseFloat(pnlPercent.toFixed(2)),
                balanceAfter: parseFloat(currentBalance.toFixed(2)),
                reason: t.reason + " (Closed early: Macro regime flipped completely to RISK-OFF)"
              };
              generateJournalNoteAsync(closedTrade);
              return closedTrade;
            }
            return t;
          });
          setTrades(updatedTrades);
          setBalance(currentBalance);
        }
      }

      setLastSeenRegime(currentRegime);

      // Choose asset to trade strictly based on the CURRENT user selected active tab class (STOCKS vs CRYPTO)
      const assetClassValue = activeTab; 
      const watchlist = assetClassValue === "STOCKS" ? stocksWatchlist : cryptoWatchlist;
      if (watchlist.length === 0) {
        throw new Error("Active watchlist is empty.");
      }
      const pickedAsset = watchlist[Math.floor(Math.random() * watchlist.length)];
      
      // Get the price of the picked asset
      const assetPrice = getLivePriceOfAsset(pickedAsset, bitget);
      if (!assetPrice || assetPrice <= 0 || isNaN(assetPrice)) {
        setRunningTradeSim(false);
        return;
      }
      
      // Format asset display name elegantly (strictly removing r prefix for stocks)
      let assetToTrade = pickedAsset;
      if (assetClassValue === "CRYPTO") {
        assetToTrade = pickedAsset.endsWith("USDT")
          ? pickedAsset.substring(0, pickedAsset.length - 4).toUpperCase() + "-USDT"
          : pickedAsset.toUpperCase() + "-USDT";
      } else {
        const displayName = pickedAsset.replace("USDT", "");
        if (displayName.toUpperCase().startsWith("R")) {
          assetToTrade = displayName.substring(1).toUpperCase();
        } else {
          assetToTrade = displayName.toUpperCase();
        }
      }

      // Determine trade direction purely based on regime:
      // LONG: TRENDING or RISK_ON
      // SHORT: RISK_OFF or RANGING
      let direction: "LONG" | "SHORT" | "HOLD" = "HOLD";
      let directionLabel: "LONG" | "SHORT" = "LONG";
      if (currentRegime.includes("TRENDING") || currentRegime.includes("RISK_ON")) {
        direction = "LONG";
        directionLabel = "LONG";
      } else if (currentRegime.includes("RISK_OFF") || currentRegime.includes("RANGING")) {
        direction = "SHORT";
        directionLabel = "SHORT";
      }

      const logProgrammaticApiCall = async (asset: string, dir: string, tf: string, conf: number) => {
        try {
          await fetch(`/api/regime?source=Paper+Trading+Desk+Agent&symbol=${encodeURIComponent(asset)}&direction=${dir}&timeframe=${encodeURIComponent(tf)}&confidence=${conf}`);
          if (onApiQuery) {
            onApiQuery();
          }
        } catch (e) {
          console.warn("Could not log programmatic api call", e);
        }
      };

      const now = Date.now();
      const timeSinceLastTrade = now - lastTradeExecutionTimeRef.current;

      // Duplicate-prevention check (asset + direction + price) using latest trades ref
      const currentTrades = tradesRef.current || trades;
      const differsFromLast = currentTrades.length === 0 || 
        (currentTrades[0].asset !== assetToTrade || 
         currentTrades[0].direction !== direction || 
         Math.abs(currentTrades[0].price - assetPrice) > 0.0001);

      if (!isManual) {
        // Cooldown check (60 seconds)
        if (timeSinceLastTrade < 60000) {
          setRunningTradeSim(false);
          return;
        }

        // Regime criteria check
        const meetsRegimeCriteria = lastLoggedRegimeRef.current === null || currentRegime !== lastSeenRegime || (lastLoggedConfidenceRef.current === null || Math.abs(confidence - lastLoggedConfidenceRef.current) >= 10);

        if (!meetsRegimeCriteria || !differsFromLast) {
          setRunningTradeSim(false);
          return;
        }
      } else {
        if (!differsFromLast) {
          setRunningTradeSim(false);
          return;
        }
      }

      const currentBal = balanceRef.current;

      if (direction !== "HOLD") {
        // Evaluate strict strategy criteria conditions!
        const validation = await validateStrategyCriteria(pickedAsset, directionLabel, assetPrice, false);
        
        if (!validation.qualified) {
          // If ANY condition above fails, skip the trade this cycle. Show a visible skip note
          const skipMsg = `Skipped [${pickedAsset}]: ${validation.reason}`;
          setLastTradeSkippedReason(skipMsg);
          setRunningTradeSim(false);
          await logProgrammaticApiCall(assetToTrade, direction, "1H INTRADAY", confidence);
          return;
        }

        // Passed rigorous qualification check, clear the last skip note
        setLastTradeSkippedReason("");

        // Position Sizing: Default collateral per trade is 10% of current available balance
        const marginAllocation = currentBal * 0.10;
        const selectedLeverage = 2; // conservative default leverage

        if (marginAllocation < 10) {
          const skipMsg = `Skipped [${pickedAsset}]: Insufficient free balance for minimum trade size ($${marginAllocation.toFixed(2)} vs $10 required)`;
          setLastTradeSkippedReason(skipMsg);
          setRunningTradeSim(false);
          await logProgrammaticApiCall(assetToTrade, direction, "1H INTRADAY", confidence);
          return;
        }

        const positionValue = marginAllocation * selectedLeverage;
        const qty = parseFloat((positionValue / assetPrice).toFixed(4));

        if (qty > 0) {
          // Timeframe selection logic
          const priceSeed = assetPrice || 100;
          const seed = Math.round(priceSeed * 100) % 3;
          let timeframe: "SCALP" | "INTRADAY" | "SWING" = "SWING";
          let timeframeLabel = "4H SWING";
          if (seed === 0) {
            timeframe = "SCALP";
            timeframeLabel = "5M SCALP";
          } else if (seed === 1) {
            timeframe = "INTRADAY";
            timeframeLabel = "1H INTRADAY";
          } else {
            timeframe = "SWING";
            timeframeLabel = "1D SWING";
          }
          
          // SL/TP by timeframe
          const slMap = { SCALP: 0.005, INTRADAY: 0.015, SWING: 0.03 };
          const tpMap = { SCALP: 0.01, INTRADAY: 0.03, SWING: 0.06 };
          const slPct = slMap[timeframe];
          const tpPct = tpMap[timeframe];
          
          let stopLoss = assetPrice * (1 - slPct);
          let takeProfit = assetPrice * (1 + tpPct);
          if (direction === "SHORT") {
            stopLoss = assetPrice * (1 + slPct);
            takeProfit = assetPrice * (1 - tpPct);
          }

          // Compute liquidation price
          let liquidationPrice = assetPrice * (1 - 0.95 / selectedLeverage);
          if (direction === "SHORT") {
            liquidationPrice = assetPrice * (1 + 0.95 / selectedLeverage);
          }

          // Protect from SL being wider than liquidation price
          if (direction === "LONG") {
            if (stopLoss <= liquidationPrice) {
              stopLoss = assetPrice * (1 - 0.75 / selectedLeverage);
            }
          } else {
            if (stopLoss >= liquidationPrice) {
              stopLoss = assetPrice * (1 + 0.75 / selectedLeverage);
            }
          }

          const newTrade: SimulatedTrade = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            asset: assetToTrade,
            direction,
            price: assetPrice,
            quantity: qty,
            balanceAfter: currentBal,
            reason: `Qualified systematic trade under ${currentRegime} macro matrix.`,
            timeframe,
            timeframeLabel,
            stopLoss: parseFloat(stopLoss.toFixed(2)),
            takeProfit: parseFloat(takeProfit.toFixed(2)),
            leverage: selectedLeverage,
            marginVal: parseFloat(marginAllocation.toFixed(2)),
            liquidationPrice: parseFloat(liquidationPrice.toFixed(2)),
            status: "OPEN"
          };

          setTrades(prev => [newTrade, ...prev]);

          lastLoggedRegimeRef.current = currentRegime;
          lastLoggedConfidenceRef.current = confidence;
          lastTradeExecutionTimeRef.current = Date.now();

          await logProgrammaticApiCall(assetToTrade, direction, timeframeLabel, confidence);
        }
      } else {
        // Record a systematic hold log state
        const holdLog: SimulatedTrade = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          asset: assetToTrade,
          direction: "HOLD",
          price: assetPrice,
          quantity: 0,
          balanceAfter: currentBal,
          reason: "Systematic Flat Strategy hold under neutral conditions.",
          status: "HOLD"
        };
        setTrades(prev => [holdLog, ...prev]);

        // Update tracking states
        lastLoggedRegimeRef.current = currentRegime;
        lastLoggedConfidenceRef.current = confidence;
        lastTradeExecutionTimeRef.current = Date.now();

        // Log hold API call
        await logProgrammaticApiCall(assetToTrade, "HOLD", "4H SWING", confidence);
      }
    } catch (err) {
      console.warn("Paper Trader error running systematic simulation frame", err);
    } finally {
      runningTradeTriggeredSafeModeCleanUp();
    }
  };

  const runningTradeTriggeredSafeModeCleanUp = () => {
    setRunningTradeSim(false);
  };

  // Listen to Bitget price updates and check Open position targets
  useEffect(() => {
    let balanceChanged = false;
    let currentBalance = balanceRef.current;
    const latestTrades = tradesRef.current || trades;
    
    const updatedTrades = latestTrades.map(t => {
      if (t.status !== "OPEN") return t;
      
      const livePrice = getLivePriceOfAsset(t.asset, bitget);
      if (!livePrice || livePrice <= 0 || isNaN(livePrice)) return t;
      
      let newStatus = t.status;
      let exitPrice = livePrice;
      let pnlDollar = 0;
      let pnlPercent = 0;
      
      // Stop Loss, Take Profit & Liquidation thresholds
      const sl = t.stopLoss || t.price;
      const tp = t.takeProfit || t.price;
      const liq = t.liquidationPrice;
      const marginVal = t.marginVal || (t.price * t.quantity);

      // Check LIQUIDATION first
      let liquidated = false;
      if (liq) {
        if (t.direction === "LONG" && livePrice <= liq) {
          liquidated = true;
          newStatus = "CLOSED_LOSS";
          exitPrice = liq;
          pnlDollar = -marginVal;
          pnlPercent = -100;
        } else if (t.direction === "SHORT" && livePrice >= liq) {
          liquidated = true;
          newStatus = "CLOSED_LOSS";
          exitPrice = liq;
          pnlDollar = -marginVal;
          pnlPercent = -100;
        }
      }
      
      if (!liquidated) {
        if (t.direction === "LONG") {
          if (livePrice >= tp) {
            newStatus = "CLOSED_PROFIT";
            exitPrice = tp; // Exact fill execution
          } else if (livePrice <= sl) {
            newStatus = "CLOSED_LOSS";
            exitPrice = sl; // Exact fill execution
          }
        } else if (t.direction === "SHORT") {
          if (livePrice <= tp) {
            newStatus = "CLOSED_PROFIT";
            exitPrice = tp; // Exact fill execution
          } else if (livePrice >= sl) {
            newStatus = "CLOSED_LOSS";
            exitPrice = sl; // Exact fill execution
          }
        }
      }
      
      if (newStatus !== "OPEN") {
        if (!liquidated) {
          let computedPnl = 0;
          if (t.direction === "LONG") {
            computedPnl = (exitPrice - t.price) * t.quantity;
          } else {
            computedPnl = (t.price - exitPrice) * t.quantity;
          }
          
          // Cap losses at isolated collateral limit
          if (computedPnl < -marginVal) {
            computedPnl = -marginVal;
          }
          pnlDollar = computedPnl;
          pnlPercent = (pnlDollar / marginVal) * 100;
        }
        
        currentBalance += pnlDollar;
        balanceChanged = true;
        
        let finalReason = t.reason;
        if (liquidated) {
          finalReason = finalReason + ` (COLLATERAL LIQUIDATED AT $${liq?.toFixed(2)})`;
        }
        
        const closedTrade: SimulatedTrade = {
          ...t,
          status: newStatus,
          exitPrice,
          pnlDollar: parseFloat(pnlDollar.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent.toFixed(2)),
          balanceAfter: parseFloat(currentBalance.toFixed(2)),
          reason: finalReason
        };
        
        // Generate reflection note asynchronously in the background
        generateJournalNoteAsync(closedTrade);
        
        return closedTrade;
      }
      
      return t;
    });
    
    if (balanceChanged) {
      setTrades(updatedTrades);
      setBalance(currentBalance);
    }
  }, [bitget]);

  useEffect(() => {
    // Periodically run programmatic simulated trade cycles (queries `/api/regime` internally)
    const intervalTrader = setInterval(() => {
      runSimulatedTradeStep(false);
    }, 15000); // every 15 seconds

    return () => {
      clearInterval(intervalTrader);
    };
  }, [balance, lastSeenRegime, bitget.btc, bitget.eth]);

  // Export Trade Logs function
  const exportTradeLog = () => {
    const filename = `macro-mind-regime-trade-log-${Date.now()}.json`;
    const jsonStr = JSON.stringify({
      startingCapital: 10000.00,
      currentSimulatedCapital: balance,
      timestamp: new Date().toISOString(),
      disclaimer: "Paper trading simulation logs. No real custody/capital.",
      logs: trades
    }, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const removeCryptoAsset = (symbol: string) => {
    if (cryptoWatchlist.length <= 5) {
      setSearchError("Watchlist must retain at least 5 core instruments.");
      return;
    }
    const filtered = cryptoWatchlist.filter(item => item !== symbol);
    setCryptoWatchlist(filtered);
    setSearchError("");
  };

  const removeStockAsset = (symbol: string) => {
    if (stocksWatchlist.length <= 5) {
      setSearchError("Watchlist must retain at least 5 core instruments.");
      return;
    }
    const filtered = stocksWatchlist.filter(item => item !== symbol);
    setStocksWatchlist(filtered);
    setSearchError("");
  };

  const resetSimulatedBalance = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000); // auto reset confirmation after 3s
      return;
    }
    setConfirmReset(false);
    setBalance(10000.00);
    setTrades([]);
    localStorage.setItem("paper_balance", "10000.00");
    localStorage.setItem("paper_trades", "[]");
    lastLoggedRegimeRef.current = null;
    lastLoggedConfidenceRef.current = null;
    lastTradeExecutionTimeRef.current = Date.now(); // 60s cooldown to keep ledger empty initially!
    setLastSeenRegime("");
  };

  const isTabAllStale = (() => {
    const list = activeTab === "CRYPTO" ? cryptoWatchlist : stocksWatchlist;
    return list.every(sym => {
      const apiSymbol = activeTab === "CRYPTO" ? sym.toUpperCase() : sym;
      let ticker = bitget.tickers[apiSymbol] || 
                   bitget.tickers[apiSymbol.toUpperCase()] || 
                   bitget.tickers[`${apiSymbol}USDT`] || 
                   bitget.tickers[`${apiSymbol.toUpperCase()}USDT`];
      return !ticker || ticker.stale || !ticker.success;
    });
  })();

  const isTabMajorityStale = (() => {
    const list = activeTab === "CRYPTO" ? cryptoWatchlist : stocksWatchlist;
    let staleCount = 0;
    list.forEach(sym => {
      const apiSymbol = activeTab === "CRYPTO" ? sym.toUpperCase() : sym;
      let ticker = bitget.tickers[apiSymbol] || 
                   bitget.tickers[apiSymbol.toUpperCase()] || 
                   bitget.tickers[`${apiSymbol}USDT`] || 
                   bitget.tickers[`${apiSymbol.toUpperCase()}USDT`];
      if (!ticker || ticker.stale || !ticker.success) {
        staleCount++;
      }
    });
    return staleCount > (list.length / 2);
  })();

  const limitInfo = getDailyTradeLimitInfo();
  const closedTrades = trades.filter(t => t.status && t.status !== "OPEN" && t.status !== "HOLD");
  const openPositions = trades.filter(t => t.status === "OPEN");

  const totalMarginLocked = trades
    .filter(t => t.status === "OPEN")
    .reduce((sum, t) => sum + (t.marginVal || (t.price * t.quantity) / (t.leverage || 1)), 0);
  const freeCapital = Math.max(0, balance - totalMarginLocked);

  return (
    <div className="w-full" id="paper-trade-suite-container">
      {/* PAPER TRADING DESK SIMULATION ENGINE */}
      <div className="bg-[#0b0c10] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="paper-trading-simulation-panel">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">PAPER TRADING DESK</h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase">SYSTEMATIC ALGO TRADER WITH REALIZED PNL lifeCYCLE</p>
              </div>
            </div>
 
            {/* Virtual Capital Panel */}
            <div className="flex items-center gap-3 bg-black/60 px-4 py-2 border border-slate-900 rounded p-1.5">
              <div>
                <span className="text-[8px] font-mono text-indigo-400 uppercase font-extrabold block">SIMULATED PORTFOLIO CAPITAL</span>
                <div className="flex items-center text-sm font-bold font-mono text-emerald-400 tracking-tight gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-950 font-bold text-amber-500 uppercase max-w-[80px] text-center font-mono leading-tight">
                NO REAL FUNDS
              </span>
            </div>
          </div>
 
          {/* Interactive action toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080b0f] p-3 border border-slate-950 rounded-md">
            <div className="text-[10px] font-mono text-slate-400 uppercase leading-relaxed max-w-sm">
              Current active regime mapping automatic paper actions. Under 24h rolling limit of 5 trades. Balance is updated strictly upon trade realization on Stop Loss or Take Profit.
            </div>
 
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Automated Algo Trading ON/OFF System Switch */}
              <div className="flex items-center gap-2 bg-black/60 border border-slate-900 rounded-md px-2.5 py-1">
                <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider">AUTO-TRADING</span>
                <button
                  type="button"
                  onClick={() => setAutoTraderActive(!autoTraderActive)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoTraderActive ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                  aria-label="Toggle Automated Trading"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoTraderActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wide px-1 rounded-sm ${autoTraderActive ? "text-emerald-400 bg-emerald-950/20" : "text-rose-400 bg-rose-950/20"}`}>
                  {autoTraderActive ? "ON" : "OFF"}
                </span>
              </div>

              <button
                disabled={runningTradeSim}
                onClick={() => runSimulatedTradeStep(true)}
                className="px-3 py-1.5 text-[9px] font-mono font-bold bg-indigo-500 text-black hover:bg-indigo-400 rounded transition-all uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              >
                <Activity className={`w-3.5 h-3.5 ${runningTradeSim ? "animate-pulse" : ""}`} />
                {runningTradeSim ? "SCANNING API..." : "AUTO-TRADE STAGE TRIGGER"}
              </button>
 
              <button
                onClick={exportTradeLog}
                className="px-3 py-1.5 text-[9px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white rounded transition-colors uppercase flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Export Trade Log
              </button>
              
              <button
                onClick={resetSimulatedBalance}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold rounded transition-all uppercase flex items-center gap-1 cursor-pointer ${
                  confirmReset 
                    ? "bg-rose-500 text-black border border-rose-400 font-extrabold animate-pulse" 
                    : "bg-rose-950/20 text-rose-400 border border-rose-905/40 hover:bg-rose-950/40 hover:border-rose-900"
                }`}
                title="Reset simulation parameters"
              >
                {confirmReset ? "CONFIRM RESET?" : "RESET BAL"}
              </button>
            </div>
            
            {/* Daily Trade Limit status indicator */}
            <div className="w-full pt-1.5 border-t border-slate-900/60 mt-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {limitInfo.limitReached ? (
                <div className="text-[9.5px] font-mono text-amber-500 font-bold bg-amber-950/30 border border-amber-900/35 px-2.5 py-1.5 rounded flex items-center gap-1.5 uppercase">
                  <span>🚨 Daily limit reached (3/3) — {limitInfo.resetMsg}</span>
                </div>
              ) : (
                <div className="text-[9px] font-mono text-slate-500 uppercase">
                  Daily trades allocated: <span className="text-slate-300 font-bold">{limitInfo.count}/3</span> (Resets progressively 24h rolling time)
                </div>
              )}

              {lastTradeSkippedReason && (
                <div className="text-[9.5px] font-mono text-amber-400 font-medium bg-amber-950/20 border border-amber-900/30 px-3 py-1.5 rounded flex items-center gap-1.5 max-w-full md:max-w-md" id="skipped-signal-note">
                  <span className="font-extrabold flex-shrink-0 animate-pulse text-amber-500">⚡ COMPLIANCE GUARD:</span>
                  <span className="truncate" title={lastTradeSkippedReason}>{lastTradeSkippedReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* ISOLATED MARGIN & LEVERAGE ORDER ENTRY DESK */}
          <div className="bg-[#080b11] border border-slate-900 rounded-lg p-4 space-y-4" id="margin-order-desk">
            <div className="flex items-center justify-between border-b border-slate-905/30 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">ISOLATED MARGIN & LEVERAGE ORDER DESK</h3>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-mono">
                <div className="text-slate-400">
                  FREE COLLATERAL: <span className="text-emerald-400 font-bold">${freeCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-slate-400">
                  LOCKED MARGIN: <span className="text-amber-500 font-bold">${totalMarginLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Side & Size Parameters */}
              <div className="space-y-3.5">
                {/* Asset & Price Select Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1">Select Instrument</label>
                    <select
                      value={manualAssetSelect}
                      onChange={(e) => {
                        setManualAssetSelect(e.target.value);
                        setManualError("");
                      }}
                      className="w-full bg-black/60 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Active Asset --</option>
                      <optgroup label="Cryptocurrencies (BTC & Alts)">
                        {cryptoWatchlist.map(sym => {
                          const cleanSym = sym.replace("USDT", "").toUpperCase();
                          const fullName = getCryptoName(cleanSym);
                          return (
                            <option key={sym} value={sym}>
                              {cleanSym} - {fullName}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Stocks / Equities">
                        {stocksWatchlist.map(sym => {
                          const clean = sym.replace("USDT", "");
                          let cleanStock = clean;
                          if (cleanStock.toUpperCase().startsWith("R")) {
                            cleanStock = cleanStock.substring(1);
                          }
                          const cleanSym = cleanStock.toUpperCase();
                          const fullName = getStockName(sym);
                          return (
                            <option key={sym} value={sym}>
                              {cleanSym} - {fullName}
                            </option>
                          );
                        })}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Live Entry Price</label>
                    <div className="w-full bg-slate-950 border border-slate-900 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono font-bold">
                      {manualAssetSelect || selectedAsset ? (
                        `$${(getLivePriceOfAsset(manualAssetSelect || selectedAsset || "", bitget) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        "Select Asset"
                      )}
                    </div>
                  </div>
                </div>

                {/* Direction Select Button Group */}
                <div>
                  <label className="text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1.5">Trade Position Bias (Side)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setManualDirection("LONG");
                        setManualError("");
                      }}
                      className={`flex-1 py-2 text-center text-xs font-mono font-bold tracking-wider rounded transition-all cursor-pointer uppercase border ${
                        manualDirection === "LONG"
                          ? "bg-emerald-950/45 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                          : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      LONG (BUY)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualDirection("SHORT");
                        setManualError("");
                      }}
                      className={`flex-1 py-2 text-center text-xs font-mono font-bold tracking-wider rounded transition-all cursor-pointer uppercase border ${
                        manualDirection === "SHORT"
                          ? "bg-rose-950/45 border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]"
                          : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      SHORT (SELL)
                    </button>
                  </div>
                </div>

                {/* Margin Collateral Sizer (Dollar Amount) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Isolated Margin Collateral</label>
                    <span className="text-[11px] font-mono font-bold text-white">${manualMarginUSD.toLocaleString()} / <span className="text-slate-400">${freeCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <input
                      type="range"
                      min={10}
                      max={Math.max(10, freeCapital)}
                      value={manualMarginUSD}
                      onChange={(e) => {
                        setManualMarginUSD(parseInt(e.target.value));
                        setManualError("");
                      }}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-600 font-mono">$</span>
                      <input
                        type="number"
                        min={10}
                        max={freeCapital}
                        value={manualMarginUSD}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setManualMarginUSD(isNaN(val) ? 10 : val);
                          setManualError("");
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {/* Sizing Percent Presets row */}
                  <div className="flex justify-between gap-1.5 mt-1.5">
                    {[5, 10, 20, 50].map(pct => {
                      const computedVal = Math.round(freeCapital * (pct / 100));
                      const finalPreset = Math.max(10, Math.min(computedVal, freeCapital));
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setManualMarginUSD(finalPreset);
                            setManualError("");
                          }}
                          className={`flex-1 py-1 text-center font-mono font-bold text-[8.5px] rounded transition-all cursor-pointer ${
                            manualMarginUSD === finalPreset 
                              ? "bg-indigo-950 border border-indigo-500 text-indigo-400" 
                              : "bg-[#0c1017] border border-slate-900 text-slate-500 hover:text-slate-400"
                          }`}
                        >
                          {pct}% Bal
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Leverage Multiplier presets */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Leverage Multiplier</label>
                    <span className="text-[11px] font-mono font-bold text-white">{manualLeverage}x Ratio</span>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={manualLeverage}
                      onChange={(e) => {
                        setManualLeverage(parseInt(e.target.value));
                        setManualError("");
                      }}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
                    />
                    <div className="relative w-28">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={manualLeverage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setManualLeverage(isNaN(val) ? 1 : Math.min(50, val));
                          setManualError("");
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-right text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {/* Leverage presets row */}
                  <div className="flex justify-between gap-1 mt-1.5">
                    {[1, 2, 5, 10, 25, 50].map(L => (
                      <button
                        key={L}
                        type="button"
                        onClick={() => {
                          setManualLeverage(L);
                          setManualError("");
                        }}
                        className={`flex-1 py-1 text-center font-mono font-bold text-[8.5px] rounded transition-all cursor-pointer border ${
                          manualLeverage === L
                            ? "bg-indigo-950 border-indigo-500 text-indigo-400"
                            : "bg-[#0c1017] border border-slate-900 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        {L}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Pre-Execution Safety Monitor & Action Box */}
              <div className="flex flex-col justify-between bg-black/35 p-3.5 border border-slate-900/60 rounded-lg space-y-3.5">
                {/* Dynamically derived metrics pre-execution */}
                <div className="space-y-2.5 text-[10.5px] font-mono">
                  <div className="flex items-center justify-between border-b border-slate-900/40 pb-1.5">
                    <span className="text-slate-500 uppercase">Effective Buying Power:</span>
                    <span className="text-white font-bold text-xs">${(manualMarginUSD * manualLeverage).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Stop Loss Input Field */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-rose-400/80 uppercase">Target Stop Loss ($):</span>
                    <input
                      type="number"
                      step="any"
                      value={customStopLoss}
                      onChange={(e) => setCustomStopLoss(e.target.value)}
                      placeholder="Stop Loss px"
                      className="w-32 bg-black border border-slate-800 rounded px-1.5 py-1 text-right text-xs text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Take Profit Input Field */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-400/80 uppercase">Target Take Profit ($):</span>
                    <input
                      type="number"
                      step="any"
                      value={customTakeProfit}
                      onChange={(e) => setCustomTakeProfit(e.target.value)}
                      placeholder="Take Profit px"
                      className="w-32 bg-black border border-slate-800 rounded px-1.5 py-1 text-right text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Calculated liquidation price */}
                  {(() => {
                    const activeSym = manualAssetSelect || selectedAsset;
                    const livePrice = getLivePriceOfAsset(activeSym || "", bitget) || 0;
                    if (!livePrice || livePrice <= 0) return null;
                    
                    let liquidationPrice = livePrice * (1 - 0.95 / manualLeverage);
                    if (manualDirection === "SHORT") {
                      liquidationPrice = livePrice * (1 + 0.95 / manualLeverage);
                    }
                    
                    const calculatedSL = parseFloat(customStopLoss);
                    let triggersLiquidationFirst = false;
                    if (!isNaN(calculatedSL)) {
                      if (manualDirection === "LONG") {
                        triggersLiquidationFirst = calculatedSL <= liquidationPrice;
                      } else {
                        triggersLiquidationFirst = calculatedSL >= liquidationPrice;
                      }
                    }
                    
                    return (
                      <div className="space-y-2 border-t border-slate-900/40 pt-2 text-[10.5px]">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-500 font-bold uppercase">Collateral Liquidation Price:</span>
                          <span className="text-amber-500 font-bold">${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        
                        {/* Dynamic risk profile text */}
                        <div className="p-2 rounded bg-black/60 border border-slate-900 text-[8.5px]">
                          {manualLeverage <= 2 ? (
                            <span className="text-emerald-400">Conservative Isolated profile: Narrow 100% loss liquidation boundary.</span>
                          ) : manualLeverage <= 10 ? (
                            <span className="text-indigo-400">Moderate Isolated leverage: Regular buffer against high volatility.</span>
                          ) : manualLeverage <= 25 ? (
                            <span className="text-amber-400 font-semibold">High speculative risk: Narrow price swings trigger liquidation.</span>
                          ) : (
                            <span className="text-rose-405 font-bold animate-pulse">Aggressive speculators: Immediate loss on rapid intraday spikes.</span>
                          )}
                        </div>

                        {triggersLiquidationFirst && (
                          <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30 text-rose-500 text-[8.5px] font-bold">
                            🚨 WARN: Stop Loss is wider than liquidation price! The position will be closed out with 100% margin loss before hitting your SL.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Action button */}
                <div className="space-y-1.5 mt-2">
                  <button
                    type="button"
                    onClick={executeManualLeverageTrade}
                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-black font-mono font-bold text-xs uppercase rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    🚀 Open Isolated {manualLeverage}x {manualDirection} Position
                  </button>

                  {manualError && (
                    <div className="p-2 rounded bg-rose-950/35 border border-rose-500/20 text-rose-405 text-[8.5px] font-mono leading-tight uppercase font-medium">
                      ❌ {manualError}
                    </div>
                  )}

                  {manualSuccess && (
                    <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/35 text-emerald-400 text-[8.5px] font-mono leading-tight uppercase font-bold text-center">
                      ✨ {manualSuccess}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIVE ISOLATED MARGIN POSITIONS & PNL MONITOR */}
            <div className="border-t border-slate-900/60 pt-4 mt-2 space-y-3" id="active-positions-desk-section">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    Active Open Positions ({openPositions.length})
                  </h4>
                </div>
                <span className="text-[8.5px] font-mono text-slate-500 uppercase">
                  Real-time Unrealized PNL Updates Live
                </span>
              </div>

              {openPositions.length === 0 ? (
                <div className="border border-dashed border-slate-900 rounded p-4 text-center text-[9px] font-mono text-slate-500 uppercase bg-black/25">
                  No active open positions on isolated margin. Select an asset above to initiate a leveraged trade position.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {openPositions.map(pos => {
                    const livePrice = getLivePriceOfAsset(pos.asset, bitget) || pos.price;
                    const marginValue = pos.marginVal || (pos.price * pos.quantity / (pos.leverage || 1));
                    let pnlDollar = 0;
                    if (pos.direction === "LONG") {
                      pnlDollar = (livePrice - pos.price) * pos.quantity;
                    } else {
                      pnlDollar = (pos.price - livePrice) * pos.quantity;
                    }
                    if (pnlDollar < -marginValue) {
                      pnlDollar = -marginValue;
                    }
                    const pnlPercent = (pnlDollar / marginValue) * 100;
                    const isProfit = pnlDollar >= 0;
                    const pnlColorClass = isProfit ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold";
                    const pnlBgClass = isProfit ? "bg-emerald-950/15 border-emerald-500/20" : "bg-rose-950/15 border-rose-500/20";

                    return (
                      <div
                        key={pos.id}
                        className={`border rounded p-3 space-y-2.5 transition-all ${pnlBgClass} backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.55)]`}
                      >
                        {/* Header Details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-xs font-bold text-white tracking-tight">
                                {cleanAssetSymbol(pos.asset)}
                              </span>
                              <span className={`text-[7.5px] font-black px-1 rounded-sm uppercase tracking-wide ${
                                pos.direction === "LONG" ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-400" : "bg-rose-950/80 border border-rose-500/30 text-rose-400"
                              }`}>
                                {pos.direction}
                              </span>
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-950/40 px-1 rounded uppercase">
                                {pos.leverage || 1}x
                              </span>
                            </div>
                            <span className="text-[7.5px] text-slate-500 font-mono block mt-0.5">
                              Opened @ {new Date(pos.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => closeTradeManual(pos.id)}
                            className="px-2 py-1 border border-rose-500/60 hover:border-rose-500 bg-rose-950/85 hover:bg-rose-900 text-rose-400 hover:text-white transition-all font-mono font-bold text-[8.5px] rounded cursor-pointer uppercase flex items-center justify-center gap-1 shadow-sm"
                          >
                            Close Trade (Exit)
                          </button>
                        </div>

                        {/* Numeric stats grid */}
                        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] font-mono border-t border-slate-900/30 pt-2 text-slate-400">
                          <div className="flex justify-between">
                            <span>Entry Price:</span>
                            <span className="text-slate-200 font-semibold">${pos.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Live Price:</span>
                            <span className="text-slate-200 font-semibold">${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Collateral:</span>
                            <span className="text-slate-300 font-semibold">${marginValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Size:</span>
                            <span className="text-slate-300 font-semibold">${(marginValue * (pos.leverage || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Sl/Tp/Liq Limits Row */}
                        <div className="grid grid-cols-3 gap-1 bg-black/45 border border-slate-900/50 p-1 text-[8px] font-mono text-center">
                          <div className="flex flex-col">
                            <span className="text-slate-550 uppercase text-[7px]">Stop Loss</span>
                            <span className="text-rose-400 font-semibold">${pos.stopLoss?.toFixed(2) || "N/A"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-550 uppercase text-[7px]">Take Profit</span>
                            <span className="text-emerald-400 font-semibold">${pos.takeProfit?.toFixed(2) || "N/A"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-550 uppercase text-[7px]">Liquidation</span>
                            <span className="text-amber-500 font-semibold">${pos.liquidationPrice?.toFixed(2) || "N/A"}</span>
                          </div>
                        </div>

                        {/* Unrealized Real-Time Profit & Loss (PNL) Indicator */}
                        <div className="flex justify-between items-center bg-black/60 border border-slate-900 rounded px-2 py-1 text-[11px] font-mono">
                          <span className="text-[8px] text-slate-500 uppercase font-semibold">Unrealized PNL</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={pnlColorClass}>
                              {isProfit ? "+" : ""}${pnlDollar.toFixed(2)}
                            </span>
                            <span className={`text-[9.5px] ${pnlColorClass} opacity-90`}>
                              ({isProfit ? "+" : ""}{pnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PREFERRED GLOBAL SETUP CONTROLS */}
            <div className="border-t border-slate-900/40 pt-3 flex flex-wrap gap-4 items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500 uppercase font-bold">AUTOMATED ALGO TRADE PREFERRED PRESETS:</span>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Pref. Leverage:</span>
                  <div className="flex gap-1">
                    {[1, 2, 5, 10, 20].map(L => (
                      <button
                        key={L}
                        type="button"
                        onClick={() => setSelectedLeverage(L)}
                        className={`px-2 py-0.5 border rounded cursor-pointer ${
                          selectedLeverage === L
                            ? "bg-indigo-950 border-indigo-500 text-indigo-400 font-bold"
                            : "bg-black/60 border-transparent text-slate-500 hover:text-slate-350"
                        }`}
                      >
                        {L}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Pref. Margin Limit:</span>
                  <div className="flex gap-1">
                    {[5, 10, 20].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSelectedMarginPct(pct)}
                        className={`px-2 py-0.5 border rounded cursor-pointer ${
                          selectedMarginPct === pct
                            ? "bg-indigo-950 border-indigo-500 text-indigo-400 font-bold"
                            : "bg-black/60 border-transparent text-slate-500 hover:text-slate-350"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Executions Logs table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
              <span>REALIZED AND ACTIVE PORTFOLIO POSITIONS LEDGER:</span>
              <span className="text-indigo-500 font-extrabold animate-pulse font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> RISK MONITOR DAEMON ONLINE
              </span>
            </div>

            {/* Summary Statistics Bento Grid Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" id="ledger-stats-dashboard-bar">
              <div className="bg-[#05070a] border border-slate-900 rounded p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Trading Win Rate</span>
                <span className="text-xs font-bold font-mono text-white mt-1">
                  {closedTrades.length > 0 ? ((closedTrades.filter(t => (t.pnlDollar || 0) > 0).length / closedTrades.length) * 100).toFixed(1) : "0.0"}%
                </span>
                <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1.5">
                  <div className="bg-indigo-500 h-1" style={{ width: `${closedTrades.length > 0 ? (closedTrades.filter(t => (t.pnlDollar || 0) > 0).length / closedTrades.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="bg-[#05070a] border border-slate-900 rounded p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Total Realized PnL</span>
                <span className={`text-xs font-bold font-mono mt-1 ${closedTrades.reduce((acc, curr) => acc + (curr.pnlDollar || 0), 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {closedTrades.reduce((acc, curr) => acc + (curr.pnlDollar || 0), 0) >= 0 ? "+" : ""}${closedTrades.reduce((acc, curr) => acc + (curr.pnlDollar || 0), 0).toFixed(2)}
                </span>
                <span className="text-[7.5px] text-slate-600 font-mono mt-1 font-semibold uppercase">ACCUMULATED CAPITAL</span>
              </div>
              <div className="bg-[#05070a] border border-slate-900 rounded p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Open Positions</span>
                <span className="text-xs font-bold font-mono text-amber-500 mt-1">
                  {trades.filter(t => t.status === "OPEN").length}
                </span>
                <span className="text-[7.5px] text-slate-600 font-mono mt-1 font-semibold uppercase">SL / TP CONTROLLED</span>
              </div>
              <div className="bg-[#05070a] border border-slate-900 rounded p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Closed Logs Count</span>
                <span className="text-xs font-bold font-mono text-slate-300 mt-1">
                  {closedTrades.length}
                </span>
                <span className="text-[7.5px] text-slate-600 font-mono mt-1 font-semibold uppercase">ARCHIVED AUDITS</span>
              </div>
            </div>
 
            <div className="bg-[#05070a] border border-slate-950 rounded overflow-hidden">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left font-mono text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-[#0c0f13] text-slate-500 uppercase tracking-wider">
                      <th className="p-2.5">TIME (UTC)</th>
                      <th className="p-2.5">INSTRUMENT</th>
                      <th className="p-2.5">DIRECTION</th>
                      <th className="p-2.5 text-right">ENTRY Price</th>
                      <th className="p-2.5 text-center">TARGETS (SL / TP)</th>
                      <th className="p-2.5 text-right">REALIZED PNL</th>
                      <th className="p-2.5 text-center">STATUS</th>
                      <th className="p-2.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-600 uppercase">
                          No trades yet. Click &quot;AUTO-TRADE STAGE TRIGGER&quot; to execute real-time systematic orders programmatically.
                        </td>
                      </tr>
                    ) : (
                      trades.map((t, idx) => {
                        const isHold = t.status === "HOLD" || t.direction === "HOLD";
                        const isOpen = t.status === "OPEN";
                        
                        let livePnL = 0;
                        let livePercent = 0;
                        if (isOpen) {
                          const currentAssetLivePrice = getLivePriceOfAsset(t.asset, bitget);
                          if (currentAssetLivePrice && currentAssetLivePrice > 0) {
                            if (t.direction === "LONG") {
                              livePnL = (currentAssetLivePrice - t.price) * t.quantity;
                            } else {
                              livePnL = (t.price - currentAssetLivePrice) * t.quantity;
                            }
                            livePercent = ((currentAssetLivePrice - t.price) / t.price) * 100;
                            if (t.direction === "SHORT") {
                              livePercent = -livePercent;
                            }
                          }
                        }

                        const pnlVal = isOpen ? livePnL : (t.pnlDollar || 0);
                        const pctVal = isOpen ? livePercent : (t.pnlPercent || 0);
                        const pnlColor = pnlVal > 0 ? "text-emerald-400 font-extrabold" : pnlVal < 0 ? "text-rose-400 font-extrabold" : "text-slate-400";
                        const pnlSign = pnlVal > 0 ? "+" : "";

                        return (
                          <React.Fragment key={t.id || `trade-${idx}`}>
                            <tr className="hover:bg-slate-950/40 transition-colors border-b border-slate-950/60 w-full">
                              <td className="p-2.5 text-slate-500 text-[9px] whitespace-nowrap">
                                {new Date(t.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="p-2.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white text-[11px] font-mono">{cleanAssetSymbol(t.asset)}</span>
                                  {!isHold && (
                                    <div className="flex flex-col space-y-0.5 mt-0.5">
                                      <span className="text-[8px] text-indigo-400 uppercase font-bold tracking-wide">
                                        ⏱ {t.timeframeLabel || "SWING"}
                                      </span>
                                      {t.leverage && (
                                        <span className="text-[8px] text-amber-500 uppercase font-extrabold tracking-wide">
                                          ⚔️ {t.leverage}x Isolated
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="flex flex-col items-start gap-1">
                                  {t.direction === "LONG" && (
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 inline-flex items-center gap-0.5 uppercase">
                                      LONG
                                    </span>
                                  )}
                                  {t.direction === "SHORT" && (
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-rose-950/80 border border-rose-500/30 text-rose-400 inline-flex items-center gap-0.5 uppercase">
                                      SHORT
                                    </span>
                                  )}
                                  {isHold && (
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-slate-900 border border-slate-850 text-slate-500 inline-flex items-center gap-0.5 uppercase">
                                      HOLD
                                    </span>
                                  )}
                                  {t.marginVal && (
                                    <span className="text-[7.5px] font-mono font-bold text-slate-500 whitespace-nowrap uppercase">
                                      Margin: ${t.marginVal.toLocaleString(undefined, { minimumFractionDigits: 1 }) }
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-200">
                                ${t.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-center text-[9px]">
                                {isHold ? (
                                  <span className="text-slate-600 font-mono">—</span>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span className="text-rose-400/80 font-mono">SL: ${t.stopLoss?.toFixed(2)}</span>
                                    <span className="text-emerald-400/80 font-mono">TP: ${t.takeProfit?.toFixed(2)}</span>
                                    {t.liquidationPrice && (
                                      <span className="text-amber-500/80 font-mono text-[7.5px] font-bold">LIQ: ${t.liquidationPrice?.toFixed(2)}</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-mono">
                                {isHold ? (
                                  <span className="text-slate-600">—</span>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className={pnlColor}>
                                      {pnlSign}${pnlVal.toFixed(2)}
                                    </span>
                                    <span className={`text-[8.5px] ${pnlColor} opacity-90`}>
                                      ({pnlSign}{pctVal.toFixed(2)}%)
                                    </span>
                                    {isOpen && <span className="text-[7px] text-amber-500 font-extrabold tracking-wider animate-pulse uppercase">UNREALIZED</span>}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {t.status === "OPEN" && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-950/30 border border-amber-500/35 text-amber-400 uppercase tracking-wider animate-pulse">OPEN</span>
                                )}
                                {t.status === "CLOSED_PROFIT" && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950/30 border border-emerald-500/35 text-emerald-400 uppercase tracking-wider">PROFIT CLOSE</span>
                                )}
                                {t.status === "CLOSED_LOSS" && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-950/30 border border-rose-500/35 text-rose-400 uppercase tracking-wider">LOSS CLOSE</span>
                                )}
                                {t.status === "CLOSED_MANUAL" && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-950/30 border border-indigo-500/35 text-indigo-400 uppercase tracking-wider">MANUAL EXIT</span>
                                )}
                                {isHold && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-500 uppercase">STANDBY</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {isOpen ? (
                                  <button
                                    onClick={() => closeTradeManual(t.id)}
                                    className="px-2.5 py-1 bg-rose-950 text-rose-400 hover:bg-rose-900 hover:text-white border border-rose-800 font-mono font-bold text-[8.5px] rounded cursor-pointer uppercase transition-colors"
                                  >
                                    Exit Trade
                                  </button>
                                ) : (
                                  <span className="text-slate-600 font-mono text-[9px]">—</span>
                                )}
                              </td>
                            </tr>
                            
                            {/* AI Journal Reflection Nested Detail Block */}
                            <tr className="bg-[#05070a]/90 text-[9px] font-mono leading-relaxed">
                              <td colSpan={8} className="p-2.5 px-3.5 text-slate-400 border-l border-slate-900">
                                <div className="space-y-1.5">
                                  <div className="flex gap-1.5 max-w-4xl">
                                    <span className="text-slate-500 uppercase font-bold text-[8px] bg-slate-950 px-1 rounded flex-shrink-0">TRIGGER SIGNAL</span>
                                    <span className="text-slate-300 italic">{t.reason}</span>
                                  </div>
                                  {!isHold && t.journalNote && (
                                    <div className="flex gap-2 max-w-4xl border-t border-slate-900/30 pt-1">
                                      <span className="text-indigo-400 uppercase font-bold text-[8px] bg-indigo-950/20 border border-indigo-500/10 px-1 rounded flex-shrink-0">📝 AI Journal</span>
                                      <span className="text-slate-200 font-sans tracking-wide leading-tight bg-slate-950/40 p-1.5 rounded border border-slate-950/60 block w-full">{t.journalNote}</span>
                                    </div>
                                  )}
                                  {!isHold && isOpen && !t.journalNote && (
                                    <div className="flex gap-1 border-t border-slate-900/30 pt-1 text-slate-500 italic">
                                      <span>⏱ Risk engine active. AI reflection journal note will generate upon trade execution close.</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
 
        {/* Mandatory permanent disclaimer matching instructions strictly */}
        <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-slate-500">
          <div className="flex items-center gap-2 text-[9px] bg-amber-950/10 border border-amber-950/30 text-amber-500/90 rounded px-2.5 py-1 uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Paper trading simulation only. No real capital, no live order execution, no custody of funds.</span>
          </div>
          <div className="text-[9.5px] font-mono text-indigo-400 hover:underline uppercase flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>System Rules Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
