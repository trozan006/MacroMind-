export enum MarketRegime {
  RISK_ON = "RISK_ON",
  RISK_OFF = "RISK_OFF",
  TRENDING = "TRENDING",
  RANGING = "RANGING"
}

export interface IndicatorDetails {
  status: "bullish" | "bearish" | "neutral";
  value: string;
  details: string;
  label: string;
}

export interface MarketData {
  vix: number;
  vixTrend: "up" | "down" | "flat";
  vixPercentile: number;
  vixStructure: "contango" | "backwardation";
  
  spyPrice: number;
  spy50MA: number;
  spy200MA: number;
  
  qqqPrice: number;
  qqq50MA: number;
  qqq200MA: number;
  
  creditSpread: number; // HYG vs LQD spread/ratio
  creditSpreadTrend: "widening" | "narrowing" | "flat";
  
  dxy: number; // USD strength
  dxyTrend: "up" | "down" | "flat";
  
  yieldCurve10Y2Y: number; // 10Y minus 2Y rate
  yieldCurveState: "normal" | "inverted" | "flat";
  
  cnnFearGreed: number; // 0 - 100
  recentHeadlineSentiment: number; // 0 - 100
}

export interface TickerSentiment {
  ticker: string;
  count: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface NewsHeadline {
  title: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  score: number; // -1 to 1 or 0-100
  time: string;
}

export interface SentimentData {
  redditBullishRatio: number; // e.g. 62%
  redditActivity: number; // score 1-100
  twitterTrending: TickerSentiment[];
  googleTrendsScore: number; // search volume for fear keywords (0-100)
  wordCloud: { text: string; value: number; type: "bullish" | "bearish" | "neutral" }[];
  headlineFeed: NewsHeadline[];
  rollingSentimentIndex: number; // 0 to 100
}

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number;
  explanation: string;
  riskDescription: string;
  assetEtfs: string[];
  historicalAnalogue: string;
  twoWeekChangeProbability: string;
  indicators: Record<string, IndicatorDetails>;
  timestamp: string;
  sentiment?: SentimentData;
}

export interface HistoricalTimelineNode {
  date: string;
  regime: MarketRegime;
  vix: number;
  spyPrice: number;
  confidence: number;
  sentiment: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "analyst";
  text: string;
  timestamp: string;
}

export interface TickerData {
  price: number;
  volume: string;
  stale: boolean;
  staleLabel?: string;
  success?: boolean;
  isAiEstimate?: boolean;
}

export interface BitgetFeed {
  btc: number;
  eth: number;
  btcVolume: string;
  ethVolume: string;
  fundingRate: string;
  stale: boolean;
  lastUpdated: string;
  tickers: Record<string, TickerData>;
}
