import { useState, useEffect } from "react";

const APC_DEFAULTS = {
  AVGO:14, CRWD:15, IBIT:25, IONQ:30, MSFT:15, NVDA:18, OKLO:35, PLTR:20,
  RKLB:32, SLV:12, SMR:28, SQQQ:20, TSLA:32, TSM:15, GLD:10, AMZN:12,
  META:14, CEG:20, QBTS:30, MSTR:25, PWR:12, GOOGL:12, AAPL:15, NFLX:18,
  MSTZ:30, NVDL:36, TQQQ:40, SOFI:20, COIN:35, HOOD:28, LAC:20,
};

const MACRO_DEFAULT = { season: "Bull", liquidity: "Rising", lateCount: 0 };

function calcLevels(e1, apcPct) {
  const sp = apcPct * 0.8 / 100;
  const fp = apcPct / 100;
  const levels = [];
  let prev = e1;
  for (let i = 1; i <= 6; i++) {
    const entry = i === 1 ? e1 : parseFloat((prev * (1 - sp)).toFixed(2));
    const tp = parseFloat((entry * (1 + fp)).toFixed(2));
    levels.push({ n: i, entry, tp });
    prev = entry;
  }
  const stop = parseFloat((levels[5].entry * (1 - fp)).toFixed(2));
  return { levels, stop };
}

function calcShares(accountSize, riskPct, e1, stopPrice) {
  const riskAmt = accountSize * riskPct / 100;
  const risk = Math.abs(e1 - stopPrice);
  return risk > 0 ? Math.floor(riskAmt / risk) : 0;
}

function pctDiff(a, b) { return ((b - a) / a * 100).toFixed(1); }

function CheckRow({ label, status, detail, warn }) {
  const color = status==="pass"?"#22c55e":status==="warn"?"#fbbf24":status==="fail"?"#ef4444":"#475569";
  const icon  = status==="pass"?"✓":status==="warn"?"◐":status==="fail"?"✗":"–";
  const bg    = status==="pass"?"#052e1610":status==="warn"?"#45180310":status==="fail"?"#450a0a20":"transparent";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:"1px solid #0f172a", background:bg }}>
      <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0, background:status==="idle"?"#1e293b":`${color}20`, color, border:`1.5px solid ${status==="idle"?"#334155":color}`, fontFamily:"monospace" }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color:"#cbd5e1", fontWeight:600 }}>{label}</div>
        {detail && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{detail}</div>}
      </div>
      {warn && <div style={{ fontSize:10, color:"#fbbf24", background:"#fbbf2415", padding:"2px 8px", borderRadius:4 }}>{warn}</div>}
    </div>
  );
}

function LevelBar({ level, currentPrice }) {
  const dist = currentPrice ? parseFloat(pctDiff(currentPrice, level.entry)) : null;
  const inZone = dist !== null && Math.abs(dist) <= 3;
  const labelColor = level.n<=3 ? ["#22c55e","#84cc16","#fbbf24"][level.n-1] : ["#f97316","#ef4444","#dc2626"][level.n-4];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:inZone?`${labelColor}12`:"transparent", border:`1px solid ${inZone?labelColor+"40":"#1e293b"}`, borderRadius:8, marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:700, color:labelColor, width:40, fontFamily:"monospace" }}>E{level.n}{level.n>=4?" FIX":""}</div>
      <div style={{ flex:1, display:"flex", gap:16, alignItems:"center" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", fontFamily:"monospace" }}>${level.entry.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        <span style={{ fontSize:11, color:"#475569" }}>→ TP</span>
        <span style={{ fontSize:12, color:"#22c55e", fontFamily:"monospace" }}>${level.tp.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
      </div>
      {dist!==null && <div style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:4, background:inZone?`${labelColor}20`:"#1e293b", color:inZone?labelColor:dist>3?"#64748b":"#94a3b8", fontFamily:"monospace" }}>{dist>0?"+":""}{dist}%</div>}
      {inZone && <div style={{ fontSize:10, color:labelColor, fontWeight:700 }}>◉ ZONE</div>}
    </div>
  );
}

export default function EntryChecklist() {
  const [ticker, setTicker]           = useState("");
  const [apc, setApc]                 = useState("");
  const [e1Price, setE1Price]         = useState("");
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError]   = useState("");
  const [accountSize, setAccountSize] = useState("315000");
  const [riskPct, setRiskPct]         = useState("1");
  const [pattern, setPattern]         = useState("");
  const [volumeOk, setVolumeOk]       = useState(null);
  const [atcDay, setAtcDay]           = useState("");
  const [macro, setMacro]             = useState(MACRO_DEFAULT);
  const [ghToken, setGhToken]         = useState(() => sessionStorage.getItem("gh_token") || "");
  const [saveStatus, setSaveStatus]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [notes, setNotes]             = useState("");
  const [entryDate, setEntryDate]     = useState(new Date().toISOString().slice(0,10));
  const [shares, setShares]           = useState("");

  const sym    = ticker.toUpperCase().trim();
  const apcVal = parseFloat(apc) || APC_DEFAULTS[sym] || 15;
  const e1Val  = parseFloat(e1Price) || 0;
  const { levels, stop } = e1Val > 0 ? calcLevels(e1Val, apcVal) : { levels:[], stop:0 };
  const suggestedShares  = e1Val > 0 && stop > 0 ? calcShares(parseFloat(accountSize)||315000, parseFloat(riskPct)||1, e1Val, stop) : 0;
  const sharesVal        = parseInt(shares) || suggestedShares;

  // Auto-fill APC for known symbols
  useEffect(() => {
    if (sym && APC_DEFAULTS[sym]) setApc(String(APC_DEFAULTS[sym]));
  }, [sym]);

  // Live price from Yahoo Finance public endpoint
  const fetchPrice = async () => {
    if (!sym) return;
    setPriceLoading(true);
    setPriceError("");
    setCurrentPrice(null);
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`);
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) {
        const p = parseFloat(price.toFixed(2));
        setCurrentPrice(p);
        if (!e1Price) setE1Price(p.toFixed(2));
      } else throw new Error("no price");
    } catch {
      try {
        const res2 = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`);
        const data2 = await res2.json();
        const price2 = data2?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price2) {
          const p = parseFloat(price2.toFixed(2));
          setCurrentPrice(p);
          if (!e1Price) setE1Price(p.toFixed(2));
        } else throw new Error("no price");
      } catch {
        setPriceError("Could not fetch — enter price manually");
      }
    }
    setPriceLoading(false);
  };

  // Checklist
  const macroPass = (macro.season==="Bull"||macro.season==="Spring"||macro.season==="Summer") && macro.liquidity==="Rising" && macro.lateCount<3;
  const macroWarn = !macroPass && macro.lateCount<5;
  const priceVsE1 = currentPrice && e1Val ? Math.abs(parseFloat(pctDiff(currentPrice,e1Val))) : null;
  const atcVal = parseInt(atcDay)||0;

  const checks = [
    { label:"Macro Gate", status:macroPass?"pass":macroWarn?"warn":"fail", detail:`GMI: ${macro.season} | Liquidity: ${macro.liquidity} | Late-cycle: ${macro.lateCount}`, warn:!macroPass&&macroWarn?"CAUTION":undefined },
    { label:"Pattern Confirmed", status:!pattern?"idle":(pattern==="Bull Pullback"||pattern==="Double Bottom")?"pass":"warn", detail:pattern||"Select pattern" },
    { label:"Price Near E1 Zone", status:!currentPrice||!e1Val?"idle":priceVsE1<=2?"pass":priceVsE1<=5?"warn":"fail", detail:currentPrice&&e1Val?`Current $${currentPrice} vs E1 $${e1Val} — ${pctDiff(currentPrice,e1Val)}% away`:"Fetch price and set E1", warn:priceVsE1>5?"OUT OF ZONE":priceVsE1>2?"NEAR ZONE":undefined },
    { label:"Volume — Low on Pullback", status:volumeOk===null?"idle":volumeOk?"pass":"fail", detail:volumeOk===null?"Confirm on chart":volumeOk?"Confirmed low/dry":"⚠ High volume — caution" },
    { label:"ATC Clock — Entering Early", status:!atcDay?"idle":atcVal<=20?"pass":atcVal<=35?"warn":"fail", detail:atcDay?`Day ${atcVal} of 53 (${Math.round(atcVal/53*100)}% used)`:"Enter ATC day estimate", warn:atcVal>35?"LATE CYCLE":atcVal>20?"MID CYCLE":undefined },
    { label:"Position Size Calculated", status:sharesVal>0?"pass":"idle", detail:sharesVal>0?`${sharesVal} shares × $${e1Val.toFixed(2)} = $${(sharesVal*e1Val).toLocaleString()}`:"Enter E1 price" },
    { label:"TP1 Pre-Calculated", status:levels.length>0?"pass":"idle", detail:levels.length>0?`TP1: $${levels[0].tp} | E2 TP: $${levels[1]?.tp??'—'}`:"Enter E1 price" },
    { label:"Hard Stop Pre-Set", status:stop>0?"pass":"idle", detail:stop>0?`Stop: $${stop} — $${(e1Val-stop).toFixed(2)}/share risk`:"Enter E1 price" },
    { label:"Lot Structure Planned", status:levels.length>0?"pass":"idle", detail:levels.length>0?`E1:$${levels[0].entry} → E2:$${levels[1].entry} → E3:$${levels[2].entry} (${(apcVal*0.8).toFixed(1)}% apart)`:"Enter APC %" },
  ];

  const passCount = checks.filter(c=>c.status==="pass").length;
  const allPass = passCount===checks.length;
  const gateColor = allPass?"#22c55e":passCount>=7?"#fbbf24":"#ef4444";

  const saveToGitHub = async () => {
    if (!ghToken||!sym||!e1Val||!sharesVal) { setSaveStatus("Fill in ticker, E1 price, and shares."); return; }
    setSaving(true); setSaveStatus("Loading config...");
    const REPO="bristleconewealth/gmi-morning-brief", FILE="config.json";
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`,{headers:{"Authorization":`token ${ghToken}`}});
      const data = await res.json();
      const cfg = JSON.parse(atob(data.content));
      const existing = cfg.positions?.find(p=>p.symbol===sym);
      if (existing) {
        const n=(existing.lots?.length||0)+1;
        existing.lots.push({lot:n,shares:sharesVal,entry_price:e1Val,entry_date:entryDate});
      } else {
        cfg.positions=cfg.positions||[];
        cfg.positions.push({symbol:sym,entry_date:entryDate,lots:[{lot:1,shares:sharesVal,entry_price:e1Val,entry_date:entryDate}],apc_pct:apcVal,atc_days:53,notes:notes||`E1 entry. ${pattern}`.trim()});
      }
      const content=btoa(unescape(encodeURIComponent(JSON.stringify(cfg,null,2))));
      await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`,{method:"PUT",headers:{"Authorization":`token ${ghToken}`,"Content-Type":"application/json"},body:JSON.stringify({message:`Entry: ${sym} @ $${e1Val}`,content,sha:data.sha})});
      setSaveStatus(`✅ ${sym} logged! Morning email updates tonight.`);
      sessionStorage.setItem("gh_token",ghToken);
    } catch { setSaveStatus("❌ Save failed. Check token."); }
    setSaving(false);
  };

  const inp = (extra={}) => ({ width:"100%", background:"#060f1e", border:"1px solid #1e293b", color:"#f1f5f9", padding:"9px 12px", borderRadius:8, fontSize:14, fontFamily:"monospace", boxSizing:"border-box", ...extra });
  const lbl = { fontSize:10, color:"#64748b", display:"block", marginBottom:4, fontFamily:"monospace", letterSpacing:"0.1em" };
  const card = { background:"#0b1528", border:"1px solid #1e293b", borderRadius:12, padding:18 };
  const sec  = { fontSize:10, color:"#475569", letterSpacing:"0.15em", fontFamily:"monospace", textTransform:"uppercase", marginBottom:14 };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#020817 0%,#040d1e 50%,#060412 100%)", fontFamily:"'DM Sans',sans-serif", color:"#f1f5f9", padding:"24px 20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box}input:focus,select:focus{outline:none!important;border-color:#3b82f6!important}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ maxWidth:940, margin:"0 auto" }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" }}/>
            <span style={{ fontSize:10, color:"#475569", letterSpacing:"0.2em", fontFamily:"monospace" }}>GMI TRADING SYSTEM</span>
          </div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700, letterSpacing:"-0.02em" }}>Entry Checklist</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#475569" }}>Run every check before pulling the trigger</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, alignItems:"start" }}>

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <div style={card}>
              <div style={sec}>Trade Setup</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>TICKER</label>
                  <input
                    value={ticker}
                    onChange={e => setTicker(e.target.value.toUpperCase())}
                    placeholder="NVDA"
                    autoComplete="off"
                    spellCheck={false}
                    style={inp({ fontSize:20, fontWeight:700 })}
                  />
                </div>
                <div>
                  <label style={lbl}>E1 ENTRY PRICE</label>
                  <input value={e1Price} onChange={e=>setE1Price(e.target.value)} placeholder="185.00" style={inp()} />
                </div>
                <div>
                  <label style={lbl}>APC %</label>
                  <input value={apc} onChange={e=>setApc(e.target.value)} placeholder={APC_DEFAULTS[sym]?String(APC_DEFAULTS[sym]):"15"} style={inp()} />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <button onClick={fetchPrice} disabled={!sym||priceLoading}
                  style={{ padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600, cursor:sym&&!priceLoading?"pointer":"not-allowed", background:sym?"#1e3a5f":"#0f172a", border:`1px solid ${sym?"#3b82f660":"#1e293b"}`, color:sym?"#60a5fa":"#334155", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                  {priceLoading?"Fetching...":"↻ Get Price"}
                </button>
                <div style={{ flex:1, padding:"9px 14px", background:"#060f1e", borderRadius:8, border:"1px solid #1e293b", display:"flex", alignItems:"center", gap:12, minHeight:42 }}>
                  {priceLoading ? (
                    <span style={{ fontSize:12, color:"#475569", fontFamily:"monospace" }}>Fetching live price...</span>
                  ) : currentPrice ? (
                    <>
                      <span style={{ fontSize:10, color:"#475569", fontFamily:"monospace" }}>LAST</span>
                      <span style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", fontFamily:"monospace" }}>${currentPrice.toLocaleString()}</span>
                      {e1Val>0 && <span style={{ fontSize:12, color:parseFloat(pctDiff(currentPrice,e1Val))>5?"#ef4444":parseFloat(pctDiff(currentPrice,e1Val))>0?"#fbbf24":"#22c55e", fontFamily:"monospace" }}>{pctDiff(currentPrice,e1Val)}% vs E1</span>}
                    </>
                  ) : (
                    <span style={{ fontSize:12, color:priceError?"#ef4444":"#334155", fontFamily:"monospace" }}>{priceError||"Enter ticker → click Get Price"}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={sec}>Manual Confirmation</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>PATTERN</label>
                  <select value={pattern} onChange={e=>setPattern(e.target.value)} style={{ ...inp(), fontFamily:"'DM Sans',sans-serif", color:pattern?"#f1f5f9":"#475569" }}>
                    <option value="">Select pattern...</option>
                    <option>Bull Pullback</option><option>Double Bottom</option><option>Breakout</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>VOLUME ON PULLBACK</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{v:true,l:"✓ Low/Dry"},{v:false,l:"✗ High"}].map(o=>(
                      <button key={String(o.v)} onClick={()=>setVolumeOk(o.v)}
                        style={{ flex:1, padding:"9px 8px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600, background:volumeOk===o.v?(o.v?"#052e16":"#450a0a"):"#060f1e", border:`1px solid ${volumeOk===o.v?(o.v?"#22c55e":"#ef4444"):"#1e293b"}`, color:volumeOk===o.v?(o.v?"#22c55e":"#ef4444"):"#475569", fontFamily:"'DM Sans',sans-serif" }}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>ATC DAY (estimate)</label>
                  <input type="number" min="1" max="53" value={atcDay} onChange={e=>setAtcDay(e.target.value)} placeholder="1" style={inp()} />
                </div>
                <div>
                  <label style={lbl}>ENTRY DATE</label>
                  <input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)} style={inp({ fontFamily:"'DM Sans',sans-serif" })} />
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={sec}>Macro Gate</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>GMI SEASON</label>
                  <select value={macro.season} onChange={e=>setMacro(m=>({...m,season:e.target.value}))} style={{ ...inp(), fontFamily:"'DM Sans',sans-serif" }}>
                    {["Bull","Spring","Summer","Fall","Winter","Bear"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>LIQUIDITY</label>
                  <select value={macro.liquidity} onChange={e=>setMacro(m=>({...m,liquidity:e.target.value}))} style={{ ...inp(), fontFamily:"'DM Sans',sans-serif" }}>
                    {["Rising","Recovering","Flat","Headwind","Falling"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>LATE-CYCLE COUNT</label>
                  <input type="number" min="0" max="10" value={macro.lateCount} onChange={e=>setMacro(m=>({...m,lateCount:parseInt(e.target.value)||0}))} style={inp()} />
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={sec}>Position Sizing</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div><label style={lbl}>ACCOUNT SIZE ($)</label><input type="number" value={accountSize} onChange={e=>setAccountSize(e.target.value)} style={inp()} /></div>
                <div><label style={lbl}>RISK PER TRADE (%)</label><input type="number" step="0.1" value={riskPct} onChange={e=>setRiskPct(e.target.value)} style={inp()} /></div>
                <div><label style={lbl}>SHARES (override)</label><input type="number" value={shares} onChange={e=>setShares(e.target.value)} placeholder={suggestedShares||"auto"} style={inp()} /></div>
              </div>
              {suggestedShares>0 && (
                <div style={{ marginTop:12, padding:"10px 14px", background:"#060f1e", borderRadius:8, border:"1px solid #22c55e30", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, textAlign:"center" }}>
                  {[{l:"SUGGESTED SHARES",v:suggestedShares},{l:"POSITION VALUE",v:`$${(sharesVal*e1Val).toLocaleString()}`},{l:"MAX RISK $",v:`$${Math.round((parseFloat(accountSize)||315000)*(parseFloat(riskPct)||1)/100).toLocaleString()}`}].map(item=>(
                    <div key={item.l}><div style={{ fontSize:9, color:"#475569", fontFamily:"monospace", marginBottom:2 }}>{item.l}</div><div style={{ fontSize:18, fontWeight:700, color:"#22c55e", fontFamily:"monospace" }}>{item.v}</div></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <div style={{ ...card, border:`1px solid ${gateColor}40`, boxShadow:`0 0 24px ${gateColor}12`, textAlign:"center" }}>
              <div style={sec}>Entry Gate</div>
              <div style={{ fontSize:56, fontWeight:700, color:gateColor, fontFamily:"monospace", lineHeight:1 }}>{passCount}</div>
              <div style={{ fontSize:13, color:"#475569", marginTop:4 }}>of {checks.length} checks</div>
              <div style={{ marginTop:12, padding:"8px 16px", borderRadius:8, background:`${gateColor}15`, border:`1px solid ${gateColor}30` }}>
                <span style={{ fontSize:13, fontWeight:700, color:gateColor, fontFamily:"monospace" }}>
                  {allPass?"✓ CLEAR TO ENTER":passCount>=7?"◐ PROCEED WITH CAUTION":"✗ DO NOT ENTER"}
                </span>
              </div>
            </div>

            <div style={{ ...card, padding:0, overflow:"hidden" }}>
              <div style={{ ...sec, margin:0, padding:"14px 14px 10px" }}>9-Point Checklist</div>
              {checks.map((c,i)=><CheckRow key={i} {...c} />)}
            </div>

            {levels.length>0 && (
              <div style={card}>
                <div style={sec}>MM Levels — {apcVal}% APC</div>
                {levels.map(l=><LevelBar key={l.n} level={l} currentPrice={currentPrice} />)}
                <div style={{ marginTop:8, padding:"8px 12px", background:"#450a0a20", border:"1px solid #ef444430", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#ef4444", fontFamily:"monospace" }}>🛑 HARD STOP</span>
                  <span style={{ fontSize:14, fontWeight:700, color:"#ef4444", fontFamily:"monospace" }}>${stop.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </div>
            )}

            <div style={card}>
              <div style={sec}>Log Trade → GitHub</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div><label style={lbl}>GITHUB TOKEN</label><input type="password" value={ghToken} onChange={e=>{setGhToken(e.target.value);sessionStorage.setItem("gh_token",e.target.value);}} placeholder="ghp_..." style={inp({fontSize:12})} /></div>
                <div><label style={lbl}>NOTES</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="E1 entry. Bull pullback." style={inp({fontSize:12,fontFamily:"'DM Sans',sans-serif"})} /></div>
                <button onClick={saveToGitHub} disabled={saving}
                  style={{ width:"100%", padding:"12px", borderRadius:10, fontSize:14, fontWeight:700, cursor:saving?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", background:allPass?"linear-gradient(135deg,#064e3b,#065f46)":"#0f172a", border:`1px solid ${allPass?"#10b98160":"#334155"}`, color:allPass?"#34d399":"#475569", boxShadow:allPass?"0 0 20px #10b98130":"none" }}>
                  {saving?"Saving...":`📋 Log ${sym||"Trade"} → Morning Email`}
                </button>
                {saveStatus && <div style={{ fontSize:12, color:saveStatus.startsWith("✅")?"#22c55e":"#ef4444", textAlign:"center" }}>{saveStatus}</div>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
