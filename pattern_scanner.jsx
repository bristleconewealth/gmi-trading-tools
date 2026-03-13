import { useState, useEffect, useCallback, useRef } from "react";

// ─── SECTOR DEFINITIONS ───────────────────────────────────────────────────────
const SECTORS = {
  "Technology": {
    color: "#60a5fa", bg: "#1e3a5f", emoji: "💻",
    tickers: [
      "AAPL","MSFT","NVDA","AVGO","ADBE","CRM","CSCO","ACN","TXN","QCOM",
      "IBM","ORCL","AMD","AMAT","LRCX","KLAC","SNPS","CDNS","ADI","MU",
      "PANW","CRWD","ZS","DDOG","NET","SNOW","MDB","FTNT","KEYS","MPWR",
      "ENTG","MRVL","ASML","TSM","INTC","NXPI","MCHP","ON","SWKS","SMCI",
      "NOW","WDAY","VEEV","HUBS","GTLB","TTD","BILL","CFLT","IOT","ANSS",
      "VRSK","IDXX","INTU","OKTA","ZM","DOCU","TWLO","PLTR","AXTI","ONTO",
      "ALGM","AMBA","ICHR","KLIC","MKSI","COHU","DIOD","SLAB","RMBS","VICR",
      "FORM","NOVT","UCTT","ACLS","SITM","PDFS","PLAB","CEVA","EMKR"
    ]
  },
  "Energy": {
    color: "#fb923c", bg: "#431407", emoji: "⚡",
    tickers: [
      "XOM","CVX","COP","EOG","SLB","MPC","PSX","VLO","PXD","OXY",
      "HAL","BKR","DVN","FANG","APA","HES","MRO","EQT","AR","RRC",
      "CEG","VST","TLN","NRG","NEE","DUK","SO","AEP","EXC","PCG",
      "FSLR","ENPH","RUN","ARRY","NOVA","STEM","SPWR","CSIQ","JKS","DQ",
      "XLE","XLU","OKLO","SMR","BE","PLUG","BLOOM","HYLN","HYZN","FLNC",
      "REI","TREC","VNET","SEDG","CWEN","NEP","GPRE","CLNE","AMRC","ARRY"
    ]
  },
  "Healthcare": {
    color: "#34d399", bg: "#064e3b", emoji: "🏥",
    tickers: [
      "UNH","JNJ","LLY","MRK","ABBV","ABT","TMO","DHR","BMY","AMGN",
      "GILD","ISRG","REGN","VRTX","SYK","EW","IDXX","DXCM","IQV","ZBH",
      "BAX","BDX","BSX","COO","EHC","HCA","THC","UHS","CNC","MOH",
      "CVS","WBA","MCK","ABC","CAH","PDCO","OMCL","PINC","QDEL","RGEN",
      "HIMS","NVCR","FATE","BEAM","EDIT","NTLA","CRSP","BLUE","AXSM","ACAD",
      "CELH","HALO","INMD","IRTC","NARI","NVST","OSUR","TMDX","WRAP","XRAY",
      "ANIP","AUPH","DVAX","FOLD","ALKS","SAGE","NKTR","IRWD","GDRX","SKIN"
    ]
  },
  "Financials": {
    color: "#a78bfa", bg: "#2e1065", emoji: "🏦",
    tickers: [
      "JPM","BAC","WFC","GS","MS","BLK","SCHW","AXP","COF","DFS",
      "SYF","ALLY","V","MA","SPGI","ADP","PAYX","ICE","CME","MSCI",
      "BX","KKR","APO","ARES","CG","TPG","OWL","BXSL","ARCC","HTGC",
      "OMF","PRAA","OPFI","AFRM","UPST","SOFI","LC","OPEN","SLM","NMIH",
      "MTB","USB","PNC","TFC","RF","FITB","HBAN","CFG","KEY","ZION",
      "MET","PRU","AFL","AIG","CB","TRV","ALL","PGR","HIG","CNA"
    ]
  },
  "Industrials": {
    color: "#fbbf24", bg: "#451a03", emoji: "🏗️",
    tickers: [
      "HON","GE","CAT","DE","RTX","LMT","NOC","GD","BA","UPS",
      "FDX","ODFL","FAST","CPRT","CTAS","VRSK","ADP","PAYX","CSX","UNP",
      "NSC","KSU","WAB","TT","ITW","EMR","ROK","PH","DOV","CARR",
      "OTIS","ARNC","ATI","CMC","NUE","STLD","X","CLF","WOR","RS",
      "KTOS","CACI","SAIC","LDOS","HII","L3H","BAH","MANT","KEYW","DRS",
      "IBP","TREX","AZEK","PGTI","DOOR","FBHS","MHO","MTH","TMHC","TPH"
    ]
  },
  "Consumer": {
    color: "#f472b6", bg: "#500724", emoji: "🛍️",
    tickers: [
      "AMZN","TSLA","HD","MCD","NKE","SBUX","TJX","LOW","COST","WMT",
      "TGT","ORLY","AZO","CMG","ROST","BKNG","ABNB","UBER","LYFT","DASH",
      "MNST","KO","PEP","PG","MDLZ","PM","MO","STZ","BF-B","TAP",
      "SHAK","BROS","DNUT","FAT","JACK","RRGB","DENN","CAKE","TXRH","BJRI",
      "F","GM","RIVN","LCID","NIO","LI","YELP","ANGI","FRSH","TALK",
      "MELI","ETSY","EBAY","W","RH","WSM","BBBY","M","JWN","KSS"
    ]
  },
  "Crypto / Digital Assets": {
    color: "#f59e0b", bg: "#3d1a00", emoji: "₿",
    tickers: [
      "IBIT","MSTR","COIN","MARA","RIOT","CLSK","HUT","CIFR","BTBT","BTDR",
      "GBTC","ETHE","BITO","BLOK","DAPP","WGMI","BITQ","BITI","HODL","BKCH",
      "SMLR","HIVE","DMGI","MIGI","MGTI","IREN","WULF","CORZ","ARBK","BRPHF"
    ]
  },
  "Nuclear / Clean Energy": {
    color: "#4ade80", bg: "#052e16", emoji: "☢️",
    tickers: [
      "CEG","VST","TLN","NRG","SMR","OKLO","BE","PLUG","FSLR","ENPH",
      "RUN","ARRY","NOVA","STEM","SPWR","CSIQ","JKS","DQ","FLNC","CWEN",
      "NEP","NEE","AES","BEP","BEPC","GPRE","CLNE","AMRC","HYZN","HYLN"
    ]
  },
  "AI / Cloud": {
    color: "#38bdf8", bg: "#082f49", emoji: "🤖",
    tickers: [
      "NVDA","MSFT","GOOGL","META","AMZN","ORCL","CRM","NOW","WDAY","ADBE",
      "PLTR","SNOW","DDOG","CFLT","MDB","NET","ZS","PANW","CRWD","FTNT",
      "HUBS","GTLB","TTD","BILL","IOT","VEEV","OKTA","ZM","TWLO","COUP",
      "SOUN","BBAI","AITX","GFAI","AIXI","AIOT","RCAT","BLDE","JOBY","ACHR"
    ]
  },
  "Space / Defense": {
    color: "#c084fc", bg: "#2e1065", emoji: "🚀",
    tickers: [
      "RKLB","IONQ","LMT","RTX","NOC","GD","BA","KTOS","CACI","SAIC",
      "LDOS","HII","L3H","BAH","MANT","KEYW","DRS","AJRD","ASTR","SPCE",
      "MNTS","ASTS","SATL","GEOX","PL","BWXT","CURI","MAXN","NWBO","ACHR",
      "JOBY","LILM","EVTOL","BLDE","ARQT","LAZR","LIDR","INVZ","OUST","AEVA"
    ]
  },
  "Real Estate": {
    color: "#86efac", bg: "#052e16", emoji: "🏢",
    tickers: [
      "SPG","AMT","PLD","CCI","EQIX","DLR","PSA","EXR","AVB","EQR",
      "MAA","UDR","CPT","ESS","NNN","O","STOR","WPC","EPRT","STAG",
      "COLD","REXR","ELS","SUI","UE","KIM","REG","FRT","BXP","VNO",
      "SLG","HIW","PDM","DEA","JBGS","ESRT","NXRT","IRT","AIRC","NSA"
    ]
  },
  "Precious Metals": {
    color: "#fde68a", bg: "#3d2a00", emoji: "🥇",
    tickers: [
      "GLD","SLV","GDX","GDXJ","PHYS","PSLV","IAU","SGOL","SIVR","PPLT",
      "NEM","GOLD","AEM","KGC","AGI","EGO","HL","AG","PAAS","MAG",
      "WPM","FNV","RGLD","OR","SAND","SILV","GATO","MMX","GORO","MUX",
      "PLTM","SBSW","SSRM","CDE","FSM","GPL","BCNN","ISVLF","MTA","TXG"
    ]
  },
};

const ALL_TICKERS = [...new Set(Object.values(SECTORS).flatMap(s => s.tickers))];

function getTickerSector(ticker) {
  for (const [sector, data] of Object.entries(SECTORS)) {
    if (data.tickers.includes(ticker)) return sector;
  }
  return "Other";
}

// ─── PATTERN DETECTION ────────────────────────────────────────────────────────

function calcSMA(prices, period) {
  return prices.map((_, i) =>
    i < period - 1 ? null : prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  const ema = [prices[0]];
  for (let i = 1; i < prices.length; i++) ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  return ema;
}

function detectBullPullback(candles) {
  if (candles.length < 60) return null;
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);

  const last = candles.length - 1;
  const c = closes[last];
  const s20 = sma20[last];
  const s50 = sma50[last];
  const s200 = sma200[last];

  if (!s20 || !s50 || !s200) return null;

  // Uptrend: price above all MAs, MAs stacked correctly
  const inUptrend = c > s20 && s20 > s50 && s50 > s200;
  if (!inUptrend) return null;

  // Find recent high (last 60 bars)
  const recentWindow = closes.slice(-60);
  const recentHigh = Math.max(...recentWindow);
  const recentHighIdx = last - (60 - 1 - recentWindow.lastIndexOf(recentHigh));

  // Pullback depth from recent high
  const pullbackPct = ((recentHigh - c) / recentHigh) * 100;
  if (pullbackPct < 3 || pullbackPct > 40) return null;

  // Price near MA support
  const distTo20 = Math.abs(c - s20) / s20 * 100;
  const distTo50 = Math.abs(c - s50) / s50 * 100;
  const nearMA20 = distTo20 < 3;
  const nearMA50 = distTo50 < 4;
  const nearMA = nearMA20 || nearMA50;

  // Volume: recent avg lower than breakout avg (healthy pullback = low volume)
  const recentVol = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const avgVol = volumes.slice(-30).reduce((a, b) => a + b, 0) / 30;
  const lowVolPullback = recentVol < avgVol * 0.85;

  // Recent bars showing potential reversal (last close > open on last bar)
  const lastCandle = candles[last];
  const bullishClose = lastCandle.close > lastCandle.open;
  const prevLow = Math.min(...closes.slice(-5));
  const holdingSupport = c > (nearMA20 ? s20 * 0.985 : s50 * 0.985);

  // Score
  let score = 0;
  if (nearMA20) score += 30;
  else if (nearMA50) score += 20;
  if (lowVolPullback) score += 20;
  if (bullishClose) score += 15;
  if (holdingSupport) score += 15;
  if (pullbackPct >= 5 && pullbackPct <= 20) score += 20; // ideal pullback depth

  const ma_touch = nearMA20 ? "20 MA" : nearMA50 ? "50 MA" : "Between MAs";
  const label = nearMA20 ? "Pullback to 20MA" : nearMA50 ? "Pullback to 50MA" : "Bull Pullback";

  return {
    pattern: "Bull Pullback",
    label,
    score,
    pullbackPct: pullbackPct.toFixed(1),
    ma_touch,
    price: c,
    sma20: s20,
    sma50: s50,
    sma200: s200,
    recentHigh,
    lowVolPullback,
    details: `${pullbackPct.toFixed(1)}% off highs • Near ${ma_touch} • ${lowVolPullback ? "Low vol ✓" : "Vol normal"}`,
    color: "#22c55e",
    bg: "#052e16"
  };
}

function detectDoubleBottom(candles) {
  if (candles.length < 40) return null;
  const closes = candles.map(c => c.close);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  const last = candles.length - 1;
  const current = closes[last];

  // Find two significant lows in the last 60 bars
  const window = 60;
  const start = Math.max(0, last - window);
  const windowLows = lows.slice(start);
  const windowCloses = closes.slice(start);

  // Find local minima (lower than 5 bars on each side)
  const localMins = [];
  for (let i = 5; i < windowLows.length - 5; i++) {
    const slice = windowLows.slice(i - 5, i + 6);
    if (windowLows[i] === Math.min(...slice)) {
      localMins.push({ idx: i, low: windowLows[i], absIdx: start + i });
    }
  }

  if (localMins.length < 2) return null;

  // Find best pair of lows at least 10 bars apart
  let best = null;
  for (let i = 0; i < localMins.length - 1; i++) {
    for (let j = i + 1; j < localMins.length; j++) {
      const lo1 = localMins[i];
      const lo2 = localMins[j];
      const separation = lo2.idx - lo1.idx;
      if (separation < 10) continue;

      // Both lows within 3% of each other
      const diff = Math.abs(lo1.low - lo2.low) / Math.max(lo1.low, lo2.low) * 100;
      if (diff > 3) continue;

      // Find neckline (highest close between the two lows)
      const between = windowCloses.slice(lo1.idx, lo2.idx + 1);
      const neckline = Math.max(...between);

      // Price should be bouncing off second low (current price > second low by at least 1%)
      const bounce = (current - lo2.low) / lo2.low * 100;
      if (bounce < 0.5) continue;

      // Score
      let score = 0;
      score += Math.max(0, 30 - diff * 8); // tighter = better
      score += Math.min(25, bounce * 3);    // bouncing well
      if (separation >= 15 && separation <= 45) score += 20; // good separation
      if (lo2.low >= lo1.low) score += 15; // second low holds above first (bullish)

      // Volume: second bottom on lower volume than first (bullish)
      const v1 = volumes.slice(start + lo1.idx - 2, start + lo1.idx + 3);
      const v2 = volumes.slice(start + lo2.idx - 2, start + lo2.idx + 3);
      const avgV1 = v1.reduce((a, b) => a + b, 0) / v1.length;
      const avgV2 = v2.reduce((a, b) => a + b, 0) / v2.length;
      const volConfirm = avgV2 < avgV1;
      if (volConfirm) score += 10;

      // Neckline break?
      const aboveNeck = current > neckline;
      if (aboveNeck) score += 15;

      if (!best || score > best.score) {
        best = {
          pattern: "Double Bottom",
          label: aboveNeck ? "Double Bottom (Confirmed)" : "Double Bottom (Forming)",
          score: Math.min(100, Math.round(score)),
          diff: diff.toFixed(1),
          bounce: bounce.toFixed(1),
          neckline,
          aboveNeck,
          volConfirm,
          lo1: lo1.low,
          lo2: lo2.low,
          separation,
          price: current,
          details: `Lows ${diff.toFixed(1)}% apart • ${bounce.toFixed(1)}% bounce • ${aboveNeck ? "Above neckline ✓" : "Below neckline"} • ${volConfirm ? "Vol confirms ✓" : ""}`,
          color: "#60a5fa",
          bg: "#1e3a5f"
        };
      }
    }
  }
  return best;
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ candles, pattern, result }) {
  if (!candles || candles.length < 10) return <div style={{ width: 120, height: 40, background: "#111827", borderRadius: 4 }} />;
  const recent = candles.slice(-40);
  const closes = recent.map(c => c.close);
  const mn = Math.min(...closes);
  const mx = Math.max(...closes);
  const range = mx - mn || 1;
  const w = 120, h = 40;
  const pts = closes.map((v, i) => `${(i / (closes.length - 1)) * w},${h - ((v - mn) / range) * (h - 4) - 2}`).join(" ");
  const color = pattern === "Bull Pullback" ? "#22c55e" : "#60a5fa";

  // MA lines for bull pullback
  let ma20line = "", ma50line = "";
  if (pattern === "Bull Pullback" && result) {
    const ma20y = h - ((result.sma20 - mn) / range) * (h - 4) - 2;
    const ma50y = h - ((result.sma50 - mn) / range) * (h - 4) - 2;
    ma20line = `M 0,${ma20y} L ${w},${ma20y}`;
    ma50line = `M 0,${ma50y} L ${w},${ma50y}`;
  }

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {ma20line && <path d={ma20line} fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.7" />}
      {ma50line && <path d={ma50line} fill="none" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.7" />}
    </svg>
  );
}

// ─── SCORE BAR ────────────────────────────────────────────────────────────────
function ScoreBar({ score, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 5, background: "#1f2937", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "'Space Mono',monospace", minWidth: 24 }}>{score}</span>
    </div>
  );
}

// ─── GMI SEASON PLAYBOOK ─────────────────────────────────────────────────────
const GMI_SEASONS = {
  Spring: {
    color: "#22c55e",
    bg: "#052e16",
    border: "#16a34a",
    tagline: "Goldilocks — Growth rising, inflation falling",
    bias: "FULLY BULLISH",
    sizeRule: "Full size on all setups",
    bestPlays: [
      { label: "Long-duration Tech / Growth", emoji: "💻", why: "Disinflationary boom rewards long-duration assets most" },
      { label: "AI & Cloud", emoji: "🤖", why: "Earnings multiple expansion as rates fall" },
      { label: "Crypto / BTC", emoji: "₿", why: "Highest beta to global liquidity cycle" },
      { label: "Small Cap Growth", emoji: "📈", why: "Risk-on rotation benefits highest-beta names" },
      { label: "Cyclical Industrials", emoji: "🏗️", why: "ISM rising drives capex and manufacturing" },
    ],
    avoid: ["Bonds (duration risk)", "Defensives (underperform in risk-on)", "Cash drag"],
    sectors: ["Technology", "AI / Cloud", "Crypto / Digital Assets", "Industrials", "Space / Defense"],
  },
  Summer: {
    color: "#fbbf24",
    bg: "#451a03",
    border: "#d97706",
    tagline: "Growth peaking, inflation rising — watch Fed",
    bias: "CAUTIOUSLY BULLISH",
    sizeRule: "75% size — tighten stops, protect open P&L",
    bestPlays: [
      { label: "Energy / Commodities", emoji: "⚡", why: "Inflation rising lifts commodity producers" },
      { label: "Financials / Banks", emoji: "🏦", why: "Rising rates help net interest margins" },
      { label: "Value over Growth", emoji: "⚖️", why: "Multiple compression as rates peak" },
      { label: "Real Assets / REITs", emoji: "🏢", why: "Inflation hedge with income" },
      { label: "Precious Metals", emoji: "🥇", why: "Inflation hedge, late Summer peak often marks gold run" },
    ],
    avoid: ["High-multiple growth", "Long-duration bonds", "Crypto (liquidity headwind)"],
    sectors: ["Energy", "Financials", "Real Estate", "Precious Metals", "Industrials"],
  },
  Fall: {
    color: "#f97316",
    bg: "#431407",
    border: "#ea580c",
    tagline: "Growth slowing, inflation elevated — reduce risk",
    bias: "NEUTRAL / REDUCE",
    sizeRule: "50% size — defensive sectors only, no new cyclicals",
    bestPlays: [
      { label: "Defensive Healthcare", emoji: "🏥", why: "Non-cyclical earnings hold in slowdown" },
      { label: "Consumer Staples", emoji: "🛒", why: "Pricing power, inelastic demand" },
      { label: "Utilities", emoji: "⚡", why: "Rate-sensitive but defensive income" },
      { label: "Cash / T-Bills (USFR)", emoji: "💵", why: "Preserve capital, wait for better entry" },
      { label: "Short High-Beta Names", emoji: "📉", why: "Growth unwind hits speculative longs hardest" },
    ],
    avoid: ["Cyclicals", "Crypto", "AI/Growth momentum", "Small caps"],
    sectors: ["Healthcare", "Consumer", "Energy"],
  },
  Winter: {
    color: "#ef4444",
    bg: "#450a0a",
    border: "#dc2626",
    tagline: "Recession — growth contracting, liquidity tightening",
    bias: "NO NEW LONGS",
    sizeRule: "0% — cash only, manage existing positions",
    bestPlays: [
      { label: "Cash (USFR / BIL)", emoji: "💵", why: "Capital preservation is the trade" },
      { label: "Gold / GLD", emoji: "🥇", why: "Safe haven, outperforms in recession" },
      { label: "Long Treasuries (TLT)", emoji: "📊", why: "Flight to safety as growth collapses" },
      { label: "Short Equities / SPX puts", emoji: "📉", why: "Bear market — protect and profit" },
      { label: "JPY / Defensive FX", emoji: "💴", why: "Risk-off currency outperforms" },
    ],
    avoid: ["Everything cyclical", "Crypto", "High-yield bonds", "Emerging markets"],
    sectors: [],
  },
};

// ─── MACRO CONTEXT BAR ────────────────────────────────────────────────────────
function MacroContextBar({ macro, onImport, onApplySectors }) {
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef();
  const season = macro?.season || "Spring";
  const gmi = GMI_SEASONS[season];
  const mono = "'Space Mono', monospace";

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const snap = JSON.parse(ev.target.result);
        if (snap.state) onImport(snap.state);
      } catch { alert("Could not read macro dashboard JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ background: gmi.bg, borderBottom: `1px solid ${gmi.border}30`, borderTop: `2px solid ${gmi.border}60` }}>
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />

      {/* COLLAPSED BAR */}
      <div style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Season pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ padding: "4px 14px", borderRadius: 20, background: gmi.bg, border: `1px solid ${gmi.color}`, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: gmi.color, boxShadow: `0 0 8px ${gmi.color}` }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: gmi.color, fontFamily: mono, letterSpacing: "0.08em" }}>
              {season.toUpperCase()} — {gmi.bias}
            </span>
          </div>
          <span style={{ fontSize: 10, color: "#475569", fontFamily: mono }}>{gmi.tagline}</span>
          <span style={{ fontSize: 10, color: "#334155", fontFamily: mono }}>{expanded ? "▲" : "▼"} GMI Playbook</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Quick best plays pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "#334155", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.1em" }}>Best plays:</span>
          {gmi.bestPlays.slice(0, 3).map((p, i) => (
            <span key={i} style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, background: `${gmi.color}15`, color: gmi.color, border: `1px solid ${gmi.color}30`, fontFamily: mono }}>
              {p.emoji} {p.label}
            </span>
          ))}
        </div>

        {/* Import macro snapshot */}
        <button
          onClick={() => fileRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: `1px solid ${gmi.border}50`, background: "transparent", color: gmi.color, fontSize: 10, cursor: "pointer", fontFamily: mono, opacity: 0.8 }}
          title="Load your macro dashboard JSON to sync season"
        >
          ⬆ Sync Macro
        </button>
      </div>

      {/* EXPANDED PLAYBOOK */}
      {expanded && (
        <div style={{ padding: "0 28px 16px", borderTop: `1px solid ${gmi.border}20` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>

            {/* Best plays */}
            <div>
              <div style={{ fontSize: 9, color: "#475569", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                ✦ {season} Best Plays (GMI Framework)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {gmi.bestPlays.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 10px", background: `${gmi.color}08`, borderRadius: 7, border: `1px solid ${gmi.color}15` }}>
                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: gmi.color, fontFamily: mono }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.4 }}>{p.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: rules + avoid + quick-filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Position sizing */}
              <div style={{ padding: "10px 14px", borderRadius: 8, background: `${gmi.color}12`, border: `1px solid ${gmi.color}30` }}>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Position Size Rule</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: gmi.color, fontFamily: mono }}>{gmi.sizeRule}</div>
              </div>

              {/* Avoid list */}
              <div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>⚠ Avoid This Season</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {gmi.avoid.map((a, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 9px", borderRadius: 8, background: "#450a0a", color: "#fca5a5", border: "1px solid #ef444430", fontFamily: mono }}>
                      ✕ {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick-filter sectors button */}
              {gmi.sectors.length > 0 && (
                <button
                  onClick={() => { onApplySectors(gmi.sectors); setExpanded(false); }}
                  style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${gmi.color}50`, background: `${gmi.color}15`, color: gmi.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: mono, textAlign: "left" }}
                >
                  ▶ Apply {season} sectors to scanner
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 2, fontWeight: 400 }}>
                    {gmi.sectors.join(" · ")}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function PatternScanner() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [error, setError] = useState(null);
  const [customTickers, setCustomTickers] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [selectedSectors, setSelectedSectors] = useState(new Set());
  const [macro, setMacro] = useState({ season: "Spring", lateCount: 0, globalLiquidity: "Rising", ism: 51.2 });
  const abortRef = useRef(false);

  const analyzeBatch = async (tickers) => {
    const prompt = `You are a technical analysis engine scanning for chart patterns as of early March 2026.

For each ticker, determine if it shows a Bull Pullback or Double Bottom on the daily chart based on recent price action.

Return ONLY a JSON array with exactly ${tickers.length} elements (null for no clear pattern). Use this format:
[
  {
    "ticker": "AAPL",
    "pattern": "Bull Pullback",
    "label": "Pullback to 50MA",
    "score": 72,
    "price": 185.50,
    "details": "12% off highs • Near 50MA • Low vol pullback",
    "pullbackPct": "12.0",
    "ma_touch": "50 MA"
  }
]

For Double Bottom add: "diff" (% between lows, e.g. "1.8"), "bounce" (% bounce, e.g. "4.2"), "aboveNeck" (true/false).

Rules:
- Only flag genuine, high-quality setups. Be selective.
- score range 40-95. Only include if score >= 45.
- Use null for stocks with no clear pattern or ones you're uncertain about.
- Bull Pullback: stock must be in clear uptrend (above key MAs), pulled back 5-30% to MA support.
- Double Bottom: two distinct lows within 3% of each other, bouncing off second.

Tickers: ${tickers.join(", ")}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    const raw = (data.content?.find(b => b.type === "text")?.text || "")
      .replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(raw);
    } catch { return tickers.map(() => null); }
  };

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setResults([]);
    abortRef.current = false;

    const tickers = useCustom
      ? customTickers.split(/[\s,]+/).map(t => t.trim().toUpperCase()).filter(Boolean)
      : selectedSectors.size > 0
        ? [...new Set([...selectedSectors].flatMap(s => SECTORS[s]?.tickers || []))]
        : ALL_TICKERS;

    setProgress({ done: 0, total: tickers.length, current: "Starting..." });

    const found = [];
    const BATCH = 25;

    for (let i = 0; i < tickers.length; i += BATCH) {
      if (abortRef.current) break;
      const batch = tickers.slice(i, i + BATCH);
      setProgress({ done: i, total: tickers.length, current: batch.slice(0, 4).join(", ") + "…" });

      try {
        const batchResults = await analyzeBatch(batch);
        if (Array.isArray(batchResults)) {
          batchResults.forEach((r, idx) => {
            if (!r || !r.ticker || r.score < 45) return;
            const ticker = r.ticker || batch[idx];
            const sector = getTickerSector(ticker);
            const isDB = r.pattern === "Double Bottom";
            found.push({
              ...r,
              ticker,
              sector,
              color: isDB ? "#60a5fa" : "#22c55e",
              bg: isDB ? "#1e3a5f" : "#052e16",
              candles: null
            });
          });
        }
      } catch (e) { console.error("Batch failed:", e); }

      setResults([...found].sort((a, b) => b.score - a.score));
      if (i + BATCH < tickers.length) await new Promise(r => setTimeout(r, 200));
    }

    setProgress(p => ({ ...p, done: tickers.length, current: "" }));
    setLastScan(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setScanning(false);
  }, [customTickers, useCustom, selectedSectors]);

  const filtered = results
    .filter(r => filter === "All" || r.pattern === filter)
    .sort((a, b) => sortBy === "score" ? b.score - a.score : a.ticker.localeCompare(b.ticker));

  const mono = "'Space Mono', monospace";
  const sans = "'DM Mono', 'Courier New', monospace";

  const bullCount = results.filter(r => r.pattern === "Bull Pullback").length;
  const dbCount = results.filter(r => r.pattern === "Double Bottom").length;

  return (
    <div style={{ minHeight: "100vh", background: "#050A0E", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #0a1628 0%, #050A0E 100%)", borderBottom: "1px solid #0f2040", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.18em", fontFamily: mono, textTransform: "uppercase" }}>Daily Chart Pattern Scanner</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#f1f5f9" }}>
              Pattern Scanner
              <span style={{ fontSize: 12, fontWeight: 400, color: "#475569", marginLeft: 10, fontFamily: mono }}>S&P 500 · Russell 2000 · NASDAQ</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastScan && !scanning && (
              <span style={{ fontSize: 10, color: "#475569", fontFamily: mono }}>Last scan {lastScan} · {results.length} patterns found</span>
            )}
            {scanning && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120, height: 4, background: "#0f2040", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#3b82f6)", transition: "width 0.3s", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: "#475569", fontFamily: mono, minWidth: 90 }}>
                  {progress.done}/{progress.total} {progress.current}
                </span>
              </div>
            )}
            <button
              onClick={() => { if (scanning) { abortRef.current = true; setScanning(false); } else runScan(); }}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: scanning ? "#450a0a" : "linear-gradient(135deg,#16a34a,#15803d)",
                color: scanning ? "#fca5a5" : "#fff", fontSize: 13, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: scanning ? "none" : "0 0 20px #16a34a40",
                transition: "all 0.2s"
              }}
            >
              {scanning ? "⬛ Stop" : "▶ Run Scan"}
            </button>
          </div>
        </div>

        {/* CUSTOM TICKERS */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#64748b" }}>
            <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)}
              style={{ accentColor: "#3b82f6" }} />
            Custom watchlist instead
          </label>
          {useCustom && (
            <input
              value={customTickers}
              onChange={e => setCustomTickers(e.target.value)}
              placeholder="AAPL, MSFT, NVDA, TSLA ..."
              style={{ flex: 1, maxWidth: 500, background: "#0a1628", border: "1px solid #1e3a5f", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: mono, outline: "none" }}
            />
          )}
        </div>

        {/* SECTOR FILTER */}
        {!useCustom && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #0f2040" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 9, color: "#475569", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Filter by Sector
              </span>
              {selectedSectors.size > 0 && (
                <button
                  onClick={() => setSelectedSectors(new Set())}
                  style={{ fontSize: 9, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontFamily: mono, padding: 0 }}
                >
                  Clear ({selectedSectors.size} selected) ✕
                </button>
              )}
              {selectedSectors.size === 0 && (
                <span style={{ fontSize: 9, color: "#334155", fontFamily: mono }}>All sectors selected</span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(SECTORS).map(([sector, data]) => {
                const active = selectedSectors.has(sector);
                return (
                  <button
                    key={sector}
                    onClick={() => {
                      setSelectedSectors(prev => {
                        const next = new Set(prev);
                        if (next.has(sector)) next.delete(sector);
                        else next.add(sector);
                        return next;
                      });
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 20,
                      border: `1px solid ${active ? data.color : "#1e3a5f"}`,
                      background: active ? data.bg : "transparent",
                      color: active ? data.color : "#475569",
                      fontSize: 11, cursor: "pointer", fontFamily: mono,
                      transition: "all 0.15s",
                      boxShadow: active ? `0 0 10px ${data.color}30` : "none"
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = data.color + "80"; e.currentTarget.style.color = data.color + "cc"; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#475569"; }}}
                  >
                    <span style={{ fontSize: 12 }}>{data.emoji}</span>
                    {sector}
                    <span style={{ fontSize: 9, color: active ? data.color + "aa" : "#334155" }}>
                      {data.tickers.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MACRO CONTEXT BAR */}
      <MacroContextBar
        macro={macro}
        onImport={(snap) => setMacro(snap)}
        onApplySectors={(sectors) => setSelectedSectors(new Set(sectors))}
      />

      {/* STATS BAR */}
      {results.length > 0 && (
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #0f2040" }}>
          {[
            { label: "Total Patterns", val: results.length, color: "#e2e8f0" },
            { label: "Bull Pullbacks", val: bullCount, color: "#22c55e" },
            { label: "Double Bottoms", val: dbCount, color: "#60a5fa" },
            { label: "High Confidence (≥70)", val: results.filter(r => r.score >= 70).length, color: "#fbbf24" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 20px", borderRight: "1px solid #0f2040", background: "#050A0E" }}>
              <div style={{ fontSize: 9, color: "#475569", fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: mono }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      {results.length > 0 && (
        <div style={{ padding: "12px 28px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #0f2040", background: "#080d14" }}>
          <span style={{ fontSize: 10, color: "#475569", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.1em" }}>Filter:</span>
          {["All", "Bull Pullback", "Double Bottom"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "4px 14px", borderRadius: 20, border: `1px solid ${filter === f ? "#3b82f6" : "#1e3a5f"}`,
              background: filter === f ? "#1e3a5f" : "transparent", color: filter === f ? "#93c5fd" : "#475569",
              fontSize: 12, cursor: "pointer", fontFamily: mono, transition: "all 0.15s"
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "#475569", fontFamily: mono }}>Sort:</span>
          {["score", "ticker"].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: "4px 12px", borderRadius: 20, border: `1px solid ${sortBy === s ? "#3b82f6" : "#1e3a5f"}`,
              background: sortBy === s ? "#1e3a5f" : "transparent", color: sortBy === s ? "#93c5fd" : "#475569",
              fontSize: 12, cursor: "pointer", fontFamily: mono, transition: "all 0.15s",
              textTransform: "capitalize"
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* RESULTS */}
      <div style={{ padding: "16px 28px" }}>
        {!scanning && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◎</div>
            <div style={{ fontSize: 15, color: "#334155", fontFamily: mono }}>Press Run Scan to begin</div>
            <div style={{ fontSize: 12, color: "#1e3a5f", marginTop: 6 }}>
              Scanning {ALL_TICKERS.length} tickers across S&P 500, Russell 2000 &amp; NASDAQ
            </div>
          </div>
        )}

        {scanning && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4, animation: "pulse 1.5s ease-in-out infinite" }}>◎</div>
            <div style={{ fontSize: 13, color: "#475569", fontFamily: mono, marginBottom: 6 }}>Analyzing {progress.current}</div>
            <div style={{ fontSize: 11, color: "#1e3a5f" }}>Results will appear as patterns are detected…</div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }`}</style>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {filtered.map((r, i) => (
              <div key={`${r.ticker}-${r.pattern}-${i}`} style={{
                background: "#080d14", border: `1px solid ${r.score >= 70 ? r.color + "50" : "#0f2040"}`,
                borderRadius: 10, padding: "14px 16px",
                boxShadow: r.score >= 70 ? `0 0 24px ${r.color}18` : "none",
              }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", fontFamily: mono }}>{r.ticker}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: r.bg, color: r.color, border: `1px solid ${r.color}40`, fontFamily: mono, fontWeight: 700 }}>
                        {r.pattern === "Bull Pullback" ? "BULL PB" : "DBL BOT"}
                      </span>
                      {r.score >= 70 && <span style={{ fontSize: 9, color: "#fbbf24", fontFamily: mono }}>★ HIGH</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: mono }}>{r.label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", fontFamily: mono }}>${typeof r.price === "number" ? r.price.toFixed(2) : r.price}</div>
                    <ScoreBar score={r.score} color={r.color} />
                  </div>
                </div>

                {/* Sector badge */}
                {r.sector && r.sector !== "Other" && (() => {
                  const sd = SECTORS[r.sector];
                  return (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, background: sd?.bg || "#1f2937", color: sd?.color || "#64748b", border: `1px solid ${sd?.color || "#334155"}25`, fontFamily: mono }}>
                        {sd?.emoji} {r.sector}
                      </span>
                    </div>
                  );
                })()}

                {/* Details */}
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.7, fontFamily: mono, marginBottom: 10, borderTop: "1px solid #0f2040", paddingTop: 8 }}>
                  {r.details}
                </div>

                {/* Links */}
                <div style={{ display: "flex", gap: 12 }}>
                  <a href={`https://www.tradingview.com/chart/?symbol=${r.ticker}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none", fontFamily: mono, fontWeight: 700 }}>
                    TradingView ↗
                  </a>
                  <a href={`https://finviz.com/quote.ashx?t=${r.ticker}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#64748b", textDecoration: "none", fontFamily: mono }}>
                    Finviz ↗
                  </a>
                  <a href={`https://finance.yahoo.com/chart/${r.ticker}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#64748b", textDecoration: "none", fontFamily: mono }}>
                    Yahoo ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
