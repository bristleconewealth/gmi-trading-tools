import { useState, useRef } from "react";

const INITIAL_STATE = {
  season: "Spring",
  seasonPct: 70,
  growthBucket: "Expansion",
  growthPct: 95,
  ism: 51.2,
  ismTrend: "Rising",
  globalLiquidity: "Rising",
  usLiquidity: "Recovering",
  pboc: "Easing",
  earningsRevisions: "Positive",
  sentiment: "Bearish",
  lateCount: 0,
  inflationStage: "Stage 1-2",
  btcVsGold: "Oversold (-2 SD)",
  btcVsNasdaq: "Oversold (-2 SD)",
  fearGreed: 25,
  fundingRate: "Negative",
  altsVsBtc: "Neutral",
  notes: "TGA drag reversing. ISM back above 50. Global M2 at new highs. Zero late-cycle warnings. Max contrarian buy signal on crypto.",
};

const SEASON_OPTIONS = ["Spring", "Summer", "Fall", "Winter"];
const TREND_OPTIONS = ["Rising", "Flat", "Falling"];
const LIQUIDITY_OPTIONS = ["Rising", "Recovering", "Flat", "Headwind", "Falling"];
const PBOC_OPTIONS = ["Easing", "Neutral", "Tightening"];
const REVISIONS_OPTIONS = ["Positive", "Neutral", "Negative"];
const SENTIMENT_OPTIONS = ["Bearish", "Neutral", "Bullish", "Euphoric"];
const INFLATION_OPTIONS = ["Stage 1 (Commodities)", "Stage 1-2", "Stage 2 (Goods)", "Stage 2-3", "Stage 3 (Services/Wages)", "Stage 4 (CPI broad)"];
const BTC_REL_OPTIONS = ["Oversold (-2 SD)", "Oversold (-1 SD)", "Neutral", "Overbought (+1 SD)", "Overbought (+2 SD)"];
const FUNDING_OPTIONS = ["Deeply Negative", "Negative", "Neutral", "Positive", "Deeply Positive"];
const ALTS_OPTIONS = ["Underperforming", "Neutral", "Outperforming", "Euphoric Outperformance"];

function scoreMacro(state) {
  let score = 0;
  let max = 0;

  // Season
  max += 2;
  if (state.season === "Spring") score += 2;
  else if (state.season === "Summer") score += 1;

  // Growth
  max += 2;
  if (state.growthBucket === "Expansion" && state.growthPct >= 70) score += 2;
  else if (state.growthBucket === "Expansion") score += 1;

  // ISM
  max += 2;
  if (state.ism >= 52 && state.ismTrend === "Rising") score += 2;
  else if (state.ism >= 50 && state.ismTrend !== "Falling") score += 1;

  // Global Liquidity
  max += 2;
  if (state.globalLiquidity === "Rising") score += 2;
  else if (state.globalLiquidity === "Recovering" || state.globalLiquidity === "Flat") score += 1;

  // US Liquidity
  max += 1;
  if (state.usLiquidity === "Rising") score += 1;
  else if (state.usLiquidity === "Recovering" || state.usLiquidity === "Headwind") score += 0.5;

  // PBOC
  max += 1;
  if (state.pboc === "Easing") score += 1;
  else if (state.pboc === "Neutral") score += 0.5;

  // Earnings
  max += 1;
  if (state.earningsRevisions === "Positive") score += 1;
  else if (state.earningsRevisions === "Neutral") score += 0.5;

  // Sentiment
  max += 1;
  if (state.sentiment === "Bearish") score += 1;
  else if (state.sentiment === "Neutral") score += 0.5;
  else if (state.sentiment === "Euphoric") score -= 1;

  // Late cycle
  max += 2;
  if (state.lateCount === 0) score += 2;
  else if (state.lateCount <= 2) score += 1;
  else if (state.lateCount >= 5) score -= 2;

  const pct = Math.max(0, Math.min(100, Math.round((score / max) * 100)));
  return pct;
}

function getBias(score, state) {
  if (state.season === "Winter" || state.lateCount >= 6) return { label: "NO NEW LONGS", color: "#ef4444", bg: "#450a0a", size: "0%" };
  if (score >= 80) return { label: "FULLY BULLISH", color: "#22c55e", bg: "#052e16", size: "100%" };
  if (score >= 65) return { label: "CAUTIOUSLY BULLISH", color: "#86efac", bg: "#14532d", size: "75%" };
  if (score >= 45) return { label: "NEUTRAL / REDUCE", color: "#fbbf24", bg: "#451a03", size: "50%" };
  return { label: "DEFENSIVE", color: "#f97316", bg: "#431407", size: "25%" };
}

function getCryptoSignal(state) {
  const signals = [];
  if (state.fearGreed < 15) signals.push({ text: "Fear & Greed: EXTREME FEAR — Contrarian BUY", type: "bull" });
  else if (state.fearGreed < 30) signals.push({ text: `Fear & Greed: ${state.fearGreed} (Fear) — Bullish lean`, type: "bull" });
  else if (state.fearGreed > 75) signals.push({ text: `Fear & Greed: ${state.fearGreed} (Greed) — CAUTION`, type: "bear" });

  if (state.fundingRate === "Deeply Negative") signals.push({ text: "Funding: DEEPLY NEGATIVE — Max shorts, contrarian bull", type: "bull" });
  else if (state.fundingRate === "Deeply Positive") signals.push({ text: "Funding: DEEPLY POSITIVE — Leverage flush risk", type: "bear" });

  if (state.btcVsGold === "Oversold (-2 SD)") signals.push({ text: "BTC/Gold: -2 SD oversold — historically marks major lows", type: "bull" });
  else if (state.btcVsGold === "Overbought (+2 SD)") signals.push({ text: "BTC/Gold: +2 SD — Late cycle caution, plan exits", type: "bear" });

  if (state.altsVsBtc === "Euphoric Outperformance") signals.push({ text: "Alts/BTC: Euphoric — Late cycle peak likely 3-6mo away", type: "bear" });
  else if (state.altsVsBtc === "Outperforming") signals.push({ text: "Alts/BTC: Outperforming — Risk-on building, constructive", type: "neutral" });

  return signals;
}

const SYSTEM_PROMPT = `You are a macro analyst assistant. The user will provide content from a macro framework report (MI2 / Julien Bittel / GMI / Raoul Pal). Extract the relevant data and return ONLY a valid JSON object with these exact keys (use null for any field not mentioned):

{
  "season": one of ["Spring","Summer","Fall","Winter"] or null,
  "seasonPct": number 0-100 or null,
  "growthBucket": one of ["Recovery","Expansion","Slowdown","Contraction"] or null,
  "growthPct": number 0-100 or null,
  "ism": number (e.g. 51.2) or null,
  "ismTrend": one of ["Rising","Flat","Falling"] or null,
  "globalLiquidity": one of ["Rising","Recovering","Flat","Headwind","Falling"] or null,
  "usLiquidity": one of ["Rising","Recovering","Flat","Headwind","Falling"] or null,
  "pboc": one of ["Easing","Neutral","Tightening"] or null,
  "earningsRevisions": one of ["Positive","Neutral","Negative"] or null,
  "sentiment": one of ["Bearish","Neutral","Bullish","Euphoric"] or null,
  "lateCount": number 0-10 or null,
  "inflationStage": one of ["Stage 1 (Commodities)","Stage 1-2","Stage 2 (Goods)","Stage 2-3","Stage 3 (Services/Wages)","Stage 4 (CPI broad)"] or null,
  "btcVsGold": one of ["Oversold (-2 SD)","Oversold (-1 SD)","Neutral","Overbought (+1 SD)","Overbought (+2 SD)"] or null,
  "btcVsNasdaq": one of ["Oversold (-2 SD)","Oversold (-1 SD)","Neutral","Overbought (+1 SD)","Overbought (+2 SD)"] or null,
  "fearGreed": number 1-99 or null,
  "fundingRate": one of ["Deeply Negative","Negative","Neutral","Positive","Deeply Positive"] or null,
  "altsVsBtc": one of ["Underperforming","Neutral","Outperforming","Euphoric Outperformance"] or null,
  "notes": 2-4 sentence summary of key macro takeaways or null,
  "month": string like "March 2026" for the report period or null
}

Return ONLY the JSON. No preamble, no markdown fences, no explanation.`;

const FIELD_LABELS = {
  season:"Season", seasonPct:"Season %", growthBucket:"Growth Bucket", growthPct:"Growth %",
  ism:"ISM Level", ismTrend:"ISM Trend", globalLiquidity:"Global Liquidity", usLiquidity:"US Liquidity",
  pboc:"PBOC", earningsRevisions:"Earnings Revisions", sentiment:"Sentiment", lateCount:"Late-Cycle Count",
  inflationStage:"Inflation Stage", btcVsGold:"BTC vs Gold", btcVsNasdaq:"BTC vs NASDAQ",
  fearGreed:"Fear & Greed", fundingRate:"Funding Rate", altsVsBtc:"Alts vs BTC",
  notes:"Notes", month:"Report Month"
};

function UploadModal({ onClose, onApply }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | preview | success | error
  const [statusMsg, setStatusMsg] = useState("");
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const pasteRef = useRef();

  const analyze = async (messages) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });
    const data = await res.json();
    const raw = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setPhase("loading");
    setStatusMsg(`Analyzing ${file.name}...`);
    try {
      const toB64 = (f) => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
      });

      let messages;
      const type = file.type;

      if (type === "application/pdf") {
        const b64 = await toB64(file);
        messages = [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
          { type: "text", text: "Extract macro framework data from this PDF report." }
        ]}];
      } else if (type.startsWith("image/")) {
        const b64 = await toB64(file);
        messages = [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: type, data: b64 } },
          { type: "text", text: "Extract macro framework data from this image/screenshot." }
        ]}];
      } else {
        // text / transcript
        const text = await file.text();
        messages = [{ role: "user", content: `Extract macro framework data from this report:\n\n${text}` }];
      }

      const parsed = await analyze(messages);
      setPreview(parsed);
      setPhase("preview");
    } catch (err) {
      console.error(err);
      setPhase("error");
      setStatusMsg("Could not parse this file. Try a PDF, screenshot (PNG/JPG), or paste text below.");
    }
  };

  const handlePaste = async () => {
    const text = pasteRef.current?.value?.trim();
    if (!text) return;
    setPhase("loading");
    setStatusMsg("Analyzing text...");
    try {
      const parsed = await analyze([{ role: "user", content: `Extract macro framework data from this report:\n\n${text}` }]);
      setPreview(parsed);
      setPhase("preview");
    } catch (err) {
      setPhase("error");
      setStatusMsg("Could not parse the text. Make sure it contains macro report content.");
    }
  };

  const applyUpdates = () => {
    const updates = {};
    Object.entries(preview).forEach(([k, v]) => { if (v !== null && v !== undefined) updates[k] = v; });
    onApply(updates);
    setPhase("success");
    setTimeout(onClose, 1000);
  };

  const mono = "'Space Mono', monospace";
  const sans = "'DM Sans', sans-serif";

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#0f172a", border:"1px solid #374151", borderRadius:16, width:"100%", maxWidth:500, maxHeight:"90vh", overflow:"auto", padding:28, display:"flex", flexDirection:"column", gap:18 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f9fafb", marginBottom:3 }}>Update from Report</div>
            <div style={{ fontSize:12, color:"#6b7280" }}>Upload or paste your MI2 / GMI report — AI will extract and update all fields</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#6b7280", fontSize:20, cursor:"pointer", lineHeight:1, padding:"2px 4px" }}>✕</button>
        </div>

        {/* IDLE / ERROR */}
        {(phase === "idle" || phase === "error") && (<>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${dragOver ? "#3b82f6" : "#374151"}`,
              borderRadius:12, padding:"28px 20px", textAlign:"center", cursor:"pointer",
              background: dragOver ? "#1e3a5f20" : "transparent", transition:"all 0.15s"
            }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
            <div style={{ fontSize:14, color:"#d1d5db", marginBottom:4, fontWeight:500 }}>Drop file here or click to browse</div>
            <div style={{ fontSize:11, color:"#4b5563" }}>PDF reports · PNG/JPG screenshots · TXT transcripts</div>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" style={{ display:"none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:1, background:"#1f2937" }} />
            <span style={{ fontSize:11, color:"#4b5563", fontFamily:mono }}>OR PASTE TEXT</span>
            <div style={{ flex:1, height:1, background:"#1f2937" }} />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <textarea ref={pasteRef} rows={5}
              style={{ background:"#111827", border:"1px solid #374151", color:"#f9fafb", padding:"10px 12px", borderRadius:8, fontSize:12, fontFamily:sans, resize:"vertical", outline:"none", lineHeight:1.5 }}
              placeholder="Paste transcript, notes, or any text from the MI2 video or GMI Flash Update..." />
            <button onClick={handlePaste}
              style={{ padding:"9px 0", background:"#1d4ed8", border:"none", color:"#fff", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:sans }}>
              Analyze Text
            </button>
          </div>

          {phase === "error" && (
            <div style={{ padding:"10px 14px", background:"#450a0a", border:"1px solid #ef444440", borderRadius:8, fontSize:12, color:"#fca5a5" }}>
              ⚠ {statusMsg}
            </div>
          )}
        </>)}

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:36, marginBottom:14, display:"inline-block", animation:"spin 0.9s linear infinite" }}>⟳</div>
            <div style={{ fontSize:13, color:"#9ca3af" }}>{statusMsg}</div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* PREVIEW */}
        {phase === "preview" && preview && (<>
          <div style={{ padding:"10px 14px", background:"#052e16", border:"1px solid #16a34a30", borderRadius:8, fontSize:12, color:"#86efac" }}>
            ✓ AI extracted {Object.values(preview).filter(v => v !== null).length} fields. Fields not found in the report are skipped — your current values are kept.
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:280, overflowY:"auto" }}>
            {Object.entries(preview).map(([k, v]) => {
              if (v === null || v === undefined) return null;
              return (
                <div key={k} style={{ display:"flex", gap:10, padding:"6px 10px", background:"#111827", borderRadius:6, alignItems:"flex-start" }}>
                  <span style={{ fontSize:10, color:"#6b7280", fontFamily:mono, minWidth:120, paddingTop:2, flexShrink:0 }}>{FIELD_LABELS[k] || k}</span>
                  <span style={{ fontSize:12, color:"#d1d5db", lineHeight:1.5 }}>{String(v)}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setPhase("idle")}
              style={{ flex:1, padding:"9px 0", background:"transparent", border:"1px solid #374151", color:"#9ca3af", borderRadius:7, fontSize:13, cursor:"pointer" }}>
              ← Back
            </button>
            <button onClick={applyUpdates}
              style={{ flex:2, padding:"9px 0", background:"linear-gradient(135deg,#1d4ed8,#2563eb)", border:"none", color:"#fff", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Apply to Dashboard
            </button>
          </div>
        </>)}

        {/* SUCCESS */}
        {phase === "success" && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:42, marginBottom:12 }}>✓</div>
            <div style={{ fontSize:14, color:"#86efac", fontWeight:600 }}>Dashboard updated!</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Select({ value, options, onChange, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: "#111827", border: "1px solid #374151", color: "#f9fafb",
          padding: "6px 10px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer", outline: "none"
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Pill({ color, bg, children }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}40`,
      padding: "2px 10px", borderRadius: 999, fontSize: 11,
      fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'Space Mono', monospace"
    }}>{children}</span>
  );
}

function ScoreGauge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 65 ? "#86efac" : score >= 45 ? "#fbbf24" : "#f97316";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform="rotate(135 70 70)" />
        {/* Fill */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform="rotate(135 70 70)"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x="70" y="66" textAnchor="middle" fill={color}
          style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>{score}</text>
        <text x="70" y="84" textAnchor="middle" fill="#6b7280"
          style={{ fontSize: 10, fontFamily: "'Space Mono', monospace" }}>/ 100</text>
      </svg>
    </div>
  );
}

function PillarRow({ label, value, green, yellow }) {
  const isGreen = green(value);
  const isYellow = !isGreen && yellow && yellow(value);
  const color = isGreen ? "#22c55e" : isYellow ? "#fbbf24" : "#ef4444";
  const dot = isGreen ? "●" : isYellow ? "◐" : "○";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", borderBottom: "1px solid #1f2937"
    }}>
      <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#f9fafb", fontFamily: "'DM Sans', sans-serif", textAlign: "right" }}>{value}</span>
        <span style={{ color, fontSize: 14 }}>{dot}</span>
      </div>
    </div>
  );
}

const APC_DEFAULTS = {
  AVGO:14,CRWD:15,IBIT:25,IONQ:30,MSFT:15,NVDA:18,OKLO:35,PLTR:20,
  RKLB:32,SLV:12,SMR:28,SQQQ:20,TSLA:32,TSM:15,GLD:10,AMZN:12,
  META:14,CEG:20,QBTS:30,MSTR:25,PWR:12,GOOGL:12,AAPL:15,NFLX:18,
};

function PositionModal({ onClose }) {
  const REPO = "bristleconewealth/gmi-morning-brief";
  const FILE = "config.json";

  const [token, setToken] = useState(() => sessionStorage.getItem("gh_token") || "");
  const [tokenSaved, setTokenSaved] = useState(!!sessionStorage.getItem("gh_token"));
  const [cfg, setCfg] = useState(null);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [view, setView] = useState("positions"); // positions | addTrade | addLot | close
  const [selectedSym, setSelectedSym] = useState(null);

  // New trade form
  const [form, setForm] = useState({ symbol:"", shares:"", price:"", date: new Date().toISOString().slice(0,10), apc:"", notes:"" });

  // New lot form
  const [lotForm, setLotForm] = useState({ shares:"", price:"", date: new Date().toISOString().slice(0,10) });

  const mono = "'Space Mono', monospace";
  const sans = "'DM Sans', sans-serif";

  const headers = { "Authorization": `token ${token}`, "Content-Type": "application/json" };

  const saveToken = () => {
    sessionStorage.setItem("gh_token", token);
    setTokenSaved(true);
    fetchConfig(token);
  };

  const fetchConfig = async (t) => {
    setLoading(true);
    setStatus("Loading config from GitHub...");
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        headers: { "Authorization": `token ${t || token}` }
      });
      const data = await res.json();
      const decoded = JSON.parse(atob(data.content));
      setCfg(decoded);
      setSha(data.sha);
      setStatus("");
    } catch(e) {
      setStatus("❌ Could not load config. Check your token.");
    }
    setLoading(false);
  };

  const pushConfig = async (newCfg) => {
    setLoading(true);
    setStatus("Saving to GitHub...");
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newCfg, null, 2))));
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: "Update positions via dashboard", content, sha })
      });
      const data = await res.json();
      setSha(data.content.sha);
      setCfg(newCfg);
      setStatus("✅ Saved! Morning email will reflect this tomorrow.");
      setView("positions");
    } catch(e) {
      setStatus("❌ Save failed. Check token permissions.");
    }
    setLoading(false);
  };

  const handleAddTrade = () => {
    if (!form.symbol || !form.shares || !form.price) { setStatus("Fill in symbol, shares, and price."); return; }
    const sym = form.symbol.toUpperCase().trim();
    const newPos = {
      symbol: sym,
      entry_date: form.date,
      lots: [{ lot: 1, shares: parseInt(form.shares), entry_price: parseFloat(form.price), entry_date: form.date }],
      apc_pct: parseFloat(form.apc) || APC_DEFAULTS[sym] || 15.0,
      atc_days: 53,
      notes: form.notes || "E1 entry."
    };
    const newCfg = { ...cfg, positions: [...(cfg.positions || []), newPos] };
    pushConfig(newCfg);
  };

  const handleAddLot = () => {
    if (!lotForm.shares || !lotForm.price) { setStatus("Fill in shares and price."); return; }
    const newCfg = {
      ...cfg,
      positions: cfg.positions.map(p => {
        if (p.symbol !== selectedSym) return p;
        const nextLot = (p.lots?.length || 0) + 1;
        return { ...p, lots: [...(p.lots||[]), { lot: nextLot, shares: parseInt(lotForm.shares), entry_price: parseFloat(lotForm.price), entry_date: lotForm.date }] };
      })
    };
    pushConfig(newCfg);
  };

  const handleClose = (sym) => {
    if (!window.confirm(`Remove ${sym} from positions? This cannot be undone.`)) return;
    const newCfg = { ...cfg, positions: cfg.positions.filter(p => p.symbol !== sym) };
    pushConfig(newCfg);
  };

  const inputStyle = { background:"#0a0f1e", border:"1px solid #374151", color:"#f9fafb", padding:"8px 12px", borderRadius:6, fontSize:13, fontFamily:sans, outline:"none", width:"100%" };
  const labelStyle = { fontSize:11, color:"#6b7280", marginBottom:4, display:"block", fontFamily:mono };
  const btnPrimary = { background:"linear-gradient(135deg,#1d4ed8,#2563eb)", border:"1px solid #3b82f660", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", padding:"9px 18px", fontFamily:sans };
  const btnGhost = { background:"transparent", border:"1px solid #374151", borderRadius:8, color:"#9ca3af", fontSize:13, cursor:"pointer", padding:"9px 14px", fontFamily:sans };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#0f172a", border:"1px solid #374151", borderRadius:16, width:"100%", maxWidth:560, maxHeight:"90vh", overflow:"auto", padding:28 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f9fafb", fontFamily:sans }}>
              {view === "positions" && "📋 Manage Positions"}
              {view === "addTrade" && "➕ Add New Trade"}
              {view === "addLot" && `➕ Add Lot — ${selectedSym}`}
            </div>
            <div style={{ fontSize:11, color:"#6b7280", marginTop:2, fontFamily:mono }}>GITHUB: {REPO}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#6b7280", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        {/* Token gate */}
        {!tokenSaved ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:12, fontSize:12, color:"#94a3b8", fontFamily:sans }}>
              Paste your GitHub Personal Access Token to connect. It stays in your browser session only — never sent anywhere except GitHub.
            </div>
            <div>
              <label style={labelStyle}>GITHUB TOKEN</label>
              <input type="password" value={token} onChange={e=>setToken(e.target.value)}
                placeholder="ghp_..." style={inputStyle} />
            </div>
            <button onClick={saveToken} style={btnPrimary}>Connect to GitHub</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign:"center", padding:40, color:"#6b7280", fontFamily:mono, fontSize:13 }}>
            {status || "Loading..."}
          </div>
        ) : !cfg ? (
          <div style={{ textAlign:"center", padding:20 }}>
            <button onClick={() => fetchConfig()} style={btnPrimary}>Load Positions</button>
            {status && <div style={{ marginTop:10, fontSize:12, color:"#ef4444" }}>{status}</div>}
          </div>
        ) : (

          <>
            {/* Status bar */}
            {status && (
              <div style={{ background: status.startsWith("✅") ? "#052e16" : "#1a0505", border:`1px solid ${status.startsWith("✅") ? "#22c55e" : "#ef4444"}40`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color: status.startsWith("✅") ? "#22c55e" : "#ef4444", fontFamily:sans }}>
                {status}
              </div>
            )}

            {/* POSITIONS LIST */}
            {view === "positions" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {(cfg.positions || []).map(p => {
                  const avgCost = p.lots ? (p.lots.reduce((s,l)=>s+l.entry_price*l.shares,0) / p.lots.reduce((s,l)=>s+l.shares,0)).toFixed(2) : "—";
                  const totalShares = p.lots ? p.lots.reduce((s,l)=>s+l.shares,0) : "—";
                  const phaseColors = ["","#22c55e","#84cc16","#fbbf24","#f97316","#ef4444","#dc2626","#7f1d1d"];
                  const lotCount = p.lots?.length || 1;
                  return (
                    <div key={p.symbol} style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:16, fontWeight:700, color:"#f1f5f9", fontFamily:mono }}>{p.symbol}</span>
                          <span style={{ fontSize:10, background:"#1e3a5f", padding:"2px 7px", borderRadius:4, color: phaseColors[lotCount] || "#94a3b8", fontFamily:mono }}>
                            {lotCount} LOT{lotCount>1?"S":""}
                          </span>
                          <span style={{ fontSize:11, color:"#64748b", fontFamily:sans }}>{totalShares} sh @ ${avgCost} avg</span>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => { setSelectedSym(p.symbol); setLotForm({shares:"",price:"",date:new Date().toISOString().slice(0,10)}); setView("addLot"); }}
                            style={{ ...btnGhost, padding:"5px 10px", fontSize:11 }}>+ Lot</button>
                          <button onClick={() => handleClose(p.symbol)}
                            style={{ ...btnGhost, padding:"5px 10px", fontSize:11, color:"#ef4444", borderColor:"#ef444440" }}>Close</button>
                        </div>
                      </div>
                      <div style={{ marginTop:6, fontSize:11, color:"#475569", fontFamily:sans }}>
                        APC {p.apc_pct}% · Entry {p.entry_date} · {p.notes}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setForm({symbol:"",shares:"",price:"",date:new Date().toISOString().slice(0,10),apc:"",notes:""}); setView("addTrade"); }}
                  style={{ ...btnPrimary, marginTop:6, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  ➕ Add New Trade
                </button>
              </div>
            )}

            {/* ADD TRADE FORM */}
            {view === "addTrade" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={labelStyle}>SYMBOL</label>
                    <input value={form.symbol} onChange={e=>setForm(f=>({...f,symbol:e.target.value.toUpperCase()}))} placeholder="NVDA" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>APC % <span style={{color:"#475569"}}>(auto-fills if known)</span></label>
                    <input value={form.apc || APC_DEFAULTS[form.symbol] || ""} onChange={e=>setForm(f=>({...f,apc:e.target.value}))} placeholder={APC_DEFAULTS[form.symbol] || "15"} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SHARES</label>
                    <input type="number" value={form.shares} onChange={e=>setForm(f=>({...f,shares:e.target.value}))} placeholder="50" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ENTRY PRICE</label>
                    <input type="number" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="185.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ENTRY DATE</label>
                    <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>NOTES</label>
                    <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="E1 entry. Bull pullback." style={inputStyle} />
                  </div>
                </div>
                {form.price && form.symbol && (
                  <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:10, fontSize:11, color:"#94a3b8", fontFamily:mono }}>
                    {(() => {
                      const apc = parseFloat(form.apc) || APC_DEFAULTS[form.symbol] || 15;
                      const e1 = parseFloat(form.price);
                      const sp = apc * 0.8 / 100;
                      const tp1 = (e1 * (1 + apc/100)).toFixed(2);
                      const e2 = (e1 * (1 - sp)).toFixed(2);
                      return `TP1: $${tp1}  |  E2 zone: $${e2}  |  APC: ${apc}%`;
                    })()}
                  </div>
                )}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={handleAddTrade} style={btnPrimary}>Save Trade → GitHub</button>
                  <button onClick={() => { setView("positions"); setStatus(""); }} style={btnGhost}>Cancel</button>
                </div>
              </div>
            )}

            {/* ADD LOT FORM */}
            {view === "addLot" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {(() => {
                  const pos = cfg.positions.find(p=>p.symbol===selectedSym);
                  const apc = pos?.apc_pct || 15;
                  const e1 = pos?.lots?.[0]?.entry_price;
                  const nextLotNum = (pos?.lots?.length||0)+1;
                  const sp = apc * 0.8 / 100;
                  let expectedEntry = e1;
                  for(let i=1;i<nextLotNum;i++) expectedEntry *= (1-sp);
                  return (
                    <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:10, fontSize:11, color:"#94a3b8", fontFamily:mono }}>
                      Adding Lot {nextLotNum} · Expected E{nextLotNum} zone: ${expectedEntry.toFixed(2)} · APC {apc}%
                    </div>
                  );
                })()}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div>
                    <label style={labelStyle}>SHARES</label>
                    <input type="number" value={lotForm.shares} onChange={e=>setLotForm(f=>({...f,shares:e.target.value}))} placeholder="50" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ENTRY PRICE</label>
                    <input type="number" step="0.01" value={lotForm.price} onChange={e=>setLotForm(f=>({...f,price:e.target.value}))} placeholder="170.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>DATE</label>
                    <input type="date" value={lotForm.date} onChange={e=>setLotForm(f=>({...f,date:e.target.value}))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={handleAddLot} style={btnPrimary}>Save Lot → GitHub</button>
                  <button onClick={() => { setView("positions"); setStatus(""); }} style={btnGhost}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MacroDashboard() {
  const [state, setState] = useState(INITIAL_STATE);
  const [month, setMonth] = useState("March 2026");
  const [showUpload, setShowUpload] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [importFlash, setImportFlash] = useState(false);
  const importRef = useRef();
  const set = (key) => (val) => setState(s => ({ ...s, [key]: val }));

  const handleAIUpdate = (updates) => {
    if (updates.month) { setMonth(updates.month); delete updates.month; }
    setState(s => ({ ...s, ...updates }));
    setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const handleExport = () => {
    const snapshot = { state, month, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `macro-dashboard-${month.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const snapshot = JSON.parse(ev.target.result);
        if (snapshot.state) setState(snapshot.state);
        if (snapshot.month) setMonth(snapshot.month);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setImportFlash(true);
        setTimeout(() => setImportFlash(false), 2000);
      } catch { alert("Could not read file — make sure it's a dashboard JSON export."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const score = scoreMacro(state);
  const bias = getBias(score, state);
  const cryptoSignals = getCryptoSignal(state);

  const seasonColor = { Spring: "#22c55e", Summer: "#fbbf24", Fall: "#f97316", Winter: "#ef4444" }[state.season];
  const seasonBg = { Spring: "#052e16", Summer: "#451a03", Fall: "#431407", Winter: "#450a0a" }[state.season];

  return (
    <div style={{
      minHeight: "100vh", background: "#030712",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f9fafb",
      padding: "0 0 40px 0"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onApply={handleAIUpdate} />}
      {showPositions && <PositionModal onClose={() => setShowPositions(false)} />}

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0a0f1e 100%)",
        borderBottom: "1px solid #1f2937",
        padding: "20px 32px 16px"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.15em", fontFamily: "'Space Mono', monospace", textTransform: "uppercase" }}>MI2 / GMI Macro Framework</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#f9fafb" }}>
              Macro Dashboard
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>Top-down filter for US equity position trading</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* IMPORT (hidden file input) */}
            <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />

            {/* EXPORT */}
            <button
              onClick={handleExport}
              title="Save current dashboard state to a JSON file"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid #374151",
                borderRadius: 8, color: "#9ca3af", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6b7280"; e.currentTarget.style.color = "#f9fafb"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              <span style={{ fontSize: 14 }}>⬇</span> Export
            </button>

            {/* IMPORT */}
            <button
              onClick={() => importRef.current?.click()}
              title="Load a previously saved dashboard JSON"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px",
                background: importFlash ? "#052e16" : "transparent",
                border: `1px solid ${importFlash ? "#22c55e" : "#374151"}`,
                borderRadius: 8, color: importFlash ? "#22c55e" : "#9ca3af", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { if (!importFlash) { e.currentTarget.style.borderColor = "#6b7280"; e.currentTarget.style.color = "#f9fafb"; }}}
              onMouseLeave={e => { if (!importFlash) { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.color = "#9ca3af"; }}}
            >
              <span style={{ fontSize: 14 }}>⬆</span> {importFlash ? "✓ Loaded!" : "Import"}
            </button>

            {/* MANAGE POSITIONS */}
            <button
              onClick={() => setShowPositions(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px",
                background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
                border: "1px solid #10b98160",
                borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 20px #10b98140",
                transition: "box-shadow 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px #10b98180"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px #10b98140"}
            >
              <span style={{ fontSize: 16 }}>📋</span>
              Manage Positions
            </button>

            {/* UPDATE FROM REPORT */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 18px",
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  border: "1px solid #3b82f660",
                  borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 0 20px #3b82f640",
                  transition: "box-shadow 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px #3b82f680"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px #3b82f640"}
              >
                <span style={{ fontSize: 16 }}>✦</span>
                Update from Report
              </button>
              {lastUpdated && (
                <span style={{ fontSize: 10, color: "#22c55e", fontFamily: "'Space Mono', monospace" }}>
                  ✓ updated {lastUpdated}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <input
                value={month}
                onChange={e => setMonth(e.target.value)}
                style={{
                  background: "#111827", border: "1px solid #374151", color: "#f9fafb",
                  padding: "6px 12px", borderRadius: 6, fontSize: 13,
                  fontFamily: "'Space Mono', monospace", textAlign: "right", outline: "none", width: 160
                }}
                placeholder="Month Year"
              />
              <span style={{ fontSize: 10, color: "#4b5563", fontFamily: "'Space Mono', monospace" }}>LAST UPDATED</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* LEFT — SCORE + BIAS */}
        <div style={{ gridColumn: "1", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Score Card */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>Macro Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ScoreGauge score={score} />
              <div style={{ flex: 1 }}>
                <div style={{
                  background: bias.bg, border: `1px solid ${bias.color}30`,
                  borderRadius: 8, padding: "10px 12px", marginBottom: 10
                }}>
                  <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>OVERALL BIAS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: bias.color, fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>{bias.label}</div>
                </div>
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Position Size Multiplier</div>
                <div style={{ background: "#111827", borderRadius: 6, padding: "4px 8px", border: "1px solid #1f2937" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: bias.color, fontFamily: "'Space Mono', monospace" }}>{bias.size}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Season Card */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>Macro Season</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {SEASON_OPTIONS.map(s => {
                const colors = { Spring: "#22c55e", Summer: "#fbbf24", Fall: "#f97316", Winter: "#ef4444" };
                const bgs = { Spring: "#052e16", Summer: "#451a03", Fall: "#431407", Winter: "#450a0a" };
                const active = state.season === s;
                return (
                  <button key={s} onClick={() => set("season")(s)} style={{
                    flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${active ? colors[s] : "#374151"}`,
                    background: active ? bgs[s] : "transparent", color: active ? colors[s] : "#6b7280",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono', monospace",
                    transition: "all 0.15s"
                  }}>{s}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>% of countries:</span>
              <input type="range" min={0} max={100} value={state.seasonPct}
                onChange={e => set("seasonPct")(+e.target.value)}
                style={{ flex: 1, accentColor: seasonColor }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: seasonColor, fontFamily: "'Space Mono', monospace", minWidth: 36 }}>{state.seasonPct}%</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>Monthly Notes</div>
            <textarea
              value={state.notes}
              onChange={e => set("notes")(e.target.value)}
              style={{
                width: "100%", background: "#111827", border: "1px solid #374151",
                color: "#d1d5db", padding: "8px 10px", borderRadius: 6, fontSize: 12,
                fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 80,
                outline: "none", boxSizing: "border-box", lineHeight: 1.5
              }}
              placeholder="Key takeaways from this month's MI2 video..."
            />
          </div>
        </div>

        {/* MIDDLE — PILLARS */}
        <div style={{ gridColumn: "2", display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #1f2937" }}>
              <span style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>Five Pillars</span>
            </div>

            <PillarRow label="Growth Momentum"
              value={`${state.growthBucket} (${state.growthPct}%)`}
              green={v => v.includes("Expansion") && state.growthPct >= 70}
              yellow={v => v.includes("Expansion")} />
            <PillarRow label="ISM"
              value={`${state.ism} — ${state.ismTrend}`}
              green={v => state.ism >= 52 && state.ismTrend === "Rising"}
              yellow={v => state.ism >= 50} />
            <PillarRow label="Global Liquidity"
              value={state.globalLiquidity}
              green={v => v === "Rising"}
              yellow={v => v === "Recovering" || v === "Flat"} />
            <PillarRow label="US Net Liquidity"
              value={state.usLiquidity}
              green={v => v === "Rising"}
              yellow={v => v === "Recovering" || v === "Headwind"} />
            <PillarRow label="PBOC"
              value={state.pboc}
              green={v => v === "Easing"}
              yellow={v => v === "Neutral"} />
            <PillarRow label="Earnings Revisions"
              value={state.earningsRevisions}
              green={v => v === "Positive"}
              yellow={v => v === "Neutral"} />
            <PillarRow label="Sentiment"
              value={state.sentiment}
              green={v => v === "Bearish"}
              yellow={v => v === "Neutral"} />
            <PillarRow label="Late-Cycle Signals"
              value={`${state.lateCount} / 10`}
              green={v => state.lateCount === 0}
              yellow={v => state.lateCount <= 2} />
          </div>

          {/* Controls */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>Update Readings</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Select label="ISM Trend" value={state.ismTrend} options={TREND_OPTIONS} onChange={set("ismTrend")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>ISM Level</label>
                <input type="number" step="0.1" min={40} max={70} value={state.ism}
                  onChange={e => set("ism")(+e.target.value)}
                  style={{ background: "#111827", border: "1px solid #374151", color: "#f9fafb", padding: "6px 10px", borderRadius: 6, fontSize: 13, fontFamily: "'Space Mono', monospace", outline: "none" }} />
              </div>
              <Select label="Global Liquidity" value={state.globalLiquidity} options={LIQUIDITY_OPTIONS} onChange={set("globalLiquidity")} />
              <Select label="US Liquidity" value={state.usLiquidity} options={LIQUIDITY_OPTIONS} onChange={set("usLiquidity")} />
              <Select label="PBOC" value={state.pboc} options={PBOC_OPTIONS} onChange={set("pboc")} />
              <Select label="Earnings" value={state.earningsRevisions} options={REVISIONS_OPTIONS} onChange={set("earningsRevisions")} />
              <Select label="Sentiment" value={state.sentiment} options={SENTIMENT_OPTIONS} onChange={set("sentiment")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>Late-Cycle Count</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => set("lateCount")(Math.max(0, state.lateCount - 1))}
                    style={{ background: "#111827", border: "1px solid #374151", color: "#f9fafb", width: 28, height: 28, borderRadius: 4, cursor: "pointer", fontSize: 16 }}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 16, color: state.lateCount >= 5 ? "#ef4444" : state.lateCount >= 3 ? "#fbbf24" : "#22c55e" }}>{state.lateCount}</span>
                  <button onClick={() => set("lateCount")(Math.min(10, state.lateCount + 1))}
                    style={{ background: "#111827", border: "1px solid #374151", color: "#f9fafb", width: 28, height: 28, borderRadius: 4, cursor: "pointer", fontSize: 16 }}>+</button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Growth %</span>
              <input type="range" min={0} max={100} value={state.growthPct}
                onChange={e => set("growthPct")(+e.target.value)}
                style={{ flex: 1, accentColor: "#2563eb" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", fontFamily: "'Space Mono', monospace", minWidth: 36 }}>{state.growthPct}%</span>
            </div>
            <Select label="Growth Bucket" value={state.growthBucket} options={["Recovery", "Expansion", "Slowdown", "Contraction"]} onChange={set("growthBucket")} />
          </div>
        </div>

        {/* RIGHT — CRYPTO + INFLATION */}
        <div style={{ gridColumn: "3", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Crypto Panel */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>Crypto Risk Signal</span>
              <span style={{ fontSize: 10, color: "#4b5563" }}>Equity confirmation only</span>
            </div>

            <div style={{ padding: "10px 12px" }}>
              {/* Fear & Greed */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>CMC Fear & Greed</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    color: state.fearGreed < 25 ? "#22c55e" : state.fearGreed > 75 ? "#ef4444" : "#fbbf24" }}>
                    {state.fearGreed}
                  </span>
                </div>
                <input type="range" min={1} max={99} value={state.fearGreed}
                  onChange={e => set("fearGreed")(+e.target.value)}
                  style={{ width: "100%", accentColor: state.fearGreed < 25 ? "#22c55e" : state.fearGreed > 75 ? "#ef4444" : "#fbbf24" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#4b5563", fontFamily: "'Space Mono', monospace" }}>
                  <span>Extreme Fear</span><span>Extreme Greed</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <Select label="BTC/Gold" value={state.btcVsGold} options={BTC_REL_OPTIONS} onChange={set("btcVsGold")} />
                <Select label="BTC/NASDAQ" value={state.btcVsNasdaq} options={BTC_REL_OPTIONS} onChange={set("btcVsNasdaq")} />
                <Select label="Funding Rate" value={state.fundingRate} options={FUNDING_OPTIONS} onChange={set("fundingRate")} />
                <Select label="Alts vs BTC" value={state.altsVsBtc} options={ALTS_OPTIONS} onChange={set("altsVsBtc")} />
              </div>

              {/* Signals */}
              {cryptoSignals.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {cryptoSignals.map((s, i) => (
                    <div key={i} style={{
                      padding: "6px 10px", borderRadius: 6, fontSize: 11,
                      background: s.type === "bull" ? "#052e16" : s.type === "bear" ? "#450a0a" : "#1c1917",
                      border: `1px solid ${s.type === "bull" ? "#16a34a30" : s.type === "bear" ? "#dc262630" : "#44403c30"}`,
                      color: s.type === "bull" ? "#86efac" : s.type === "bear" ? "#fca5a5" : "#d6d3d1",
                      fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4
                    }}>{s.text}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inflation Stage */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>Inflation Domino</div>
            <Select label="Current Stage" value={state.inflationStage} options={INFLATION_OPTIONS} onChange={set("inflationStage")} />
            <div style={{ marginTop: 10, padding: "8px 10px", background: "#111827", borderRadius: 6, border: "1px solid #1f2937", fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
              {state.inflationStage.includes("Stage 1") && "Commodities rising. Early cycle. Services still benign. Fed not engaged."}
              {state.inflationStage.includes("Stage 2") && !state.inflationStage.includes("2-3") && "Goods inflation building. Fed watching. Runway remains but narrowing."}
              {state.inflationStage.includes("2-3") && "Transition to services. Watch Dallas/Richmond Fed wage composites closely."}
              {state.inflationStage.includes("Stage 3") && "Services/wage inflation. Fed likely to engage. Reduce risk in late-cycle names."}
              {state.inflationStage.includes("Stage 4") && "CPI broad re-acceleration. Fed hiking. Defensive posture. Late cycle confirmed."}
            </div>
          </div>

          {/* Pre-Trade Gate */}
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>Pre-Trade Macro Gate</div>
            {[
              {
                q: "Macro season Spring or Summer?",
                ok: state.season === "Spring" || state.season === "Summer",
                warn: state.season === "Fall"
              },
              {
                q: "Global liquidity rising?",
                ok: state.globalLiquidity === "Rising",
                warn: state.globalLiquidity === "Recovering" || state.globalLiquidity === "Flat"
              },
              {
                q: "Late-cycle count < 3?",
                ok: state.lateCount < 3,
                warn: state.lateCount < 5
              }
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: i < 2 ? "1px solid #111827" : "none"
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: item.ok ? "#22c55e" : item.warn ? "#fbbf24" : "#ef4444",
                  boxShadow: item.ok ? "0 0 6px #22c55e80" : item.warn ? "0 0 6px #fbbf2480" : "0 0 6px #ef444480"
                }} />
                <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.3 }}>{item.q}</span>
              </div>
            ))}
            <div style={{
              marginTop: 10, padding: "8px 10px", borderRadius: 6, textAlign: "center",
              background: bias.bg, border: `1px solid ${bias.color}30`
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: bias.color, fontFamily: "'Space Mono', monospace" }}>
                {bias.size} SIZE — {bias.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
