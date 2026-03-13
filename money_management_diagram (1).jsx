import { useState } from "react";

const mono = "'Space Mono', monospace";
const sans = "'DM Sans', sans-serif";

// Price levels (SVG y-coords — higher y = lower price)
// APC cycle = $10, entry spacing = 80% of cycle = $8
const Y = {
  t1:  30,  // $110 — E1 profit target
  e1: 100,  // $100 — Entry 1
  e2: 175,  // $92  — Entry 2
  e3: 250,  // $84  — Entry 3  / E4 target
  e4: 325,  // $76  — Entry 4  / E5 target
  e5: 375,  // $68  — Entry 5  / E6 target
  e6: 415,  // $60  — Entry 6  MAX
  sl: 453,  // $50  — HARD STOP: -1 APC below E6 → close ALL
};

// Color palette
const C = {
  e1:"#22c55e", e2:"#fbbf24", e3:"#f97316",
  e4:"#ef4444", e5:"#f87171", e6:"#fca5a5",
  be:"#a78bfa", go:"#22c55e", warn:"#ef4444",
};

// ── UNIVERSAL PEEL RULE (shown in sidebar) ───────────────────────────────────
const PEEL_RULES = [
  { icon:"▲", color:C.e1, text:"Always peel the HIGHEST active entry first — top down, always." },
  { icon:"½", color:C.be, text:"Partial peel counts. Bank it. Only re-deploy that slot once a FULL unit is peeled off." },
  { icon:"⟳", color:"#60a5fa", text:"A fully peeled slot reopens for re-entry. Max 6 active units at all times." },
  { icon:"✕", color:C.warn, text:"Once the ENTIRE position hits breakeven — close ALL remaining shares immediately." },
  { icon:"⊘", color:"#fbbf24", text:"TP fires at or above the entry level price — NEVER below. If price stalls short, hold and wait." },
  { icon:"↓", color:C.e3, text:"If price drops after a TP, re-enter at that level — same structure, same rules." },
];

// ── PHASES ────────────────────────────────────────────────────────────────────
const PHASES = [
  {
    id:"p1", tab:"Phase 1", sub:"Clean Winner",
    color:C.e1, mode:"profit",
    desc:"Price goes straight up from E1. TP at +1 APC cycle ($110). No management needed.",
    steps:[
      { t:"entry", text:"Enter E1 @ $100" },
      { t:"up",    text:"Price rises +1 APC cycle → $110" },
      { t:"exit",  text:"TP E1 @ $110. Peel E1 (top level) fully. Done ✅" },
    ],
    rule:"Cleanest trade. One entry, one exit. Top level (E1) is fully peeled = slot closed profitably.",
    diag:{
      paths:[
        { d:`M 60,${Y.e1} L 130,${Y.e1} C 200,${Y.e1} 240,${Y.t1+15} 300,${Y.t1} L 500,${Y.t1}`, c:C.e1 },
      ],
      dots:[
        { x:60,  y:Y.e1, c:C.e1 },
        { x:500, y:Y.t1, c:C.e1 },
      ],
      notes:[
        { x:63,  y:Y.e1-8, text:"Enter E1 @$100", c:C.e1 },
        { x:505, y:Y.t1+4, text:"TP @$110 ✅ — peel E1", c:C.e1 },
      ],
      levels:[Y.t1,Y.e1],
    }
  },
  {
    id:"p2", tab:"Phase 2", sub:"E2 Added",
    color:C.e2, mode:"profit",
    desc:"Price drops 80% of cycle → add E2 @ $92. When price returns to $100, E2 profits peel E1 (top level) at cost. Hold E1 for next cycle.",
    steps:[
      { t:"entry", text:"Holding E1 @ $100" },
      { t:"entry", text:"Price drops 80% → Enter E2 @ $92" },
      { t:"up",    text:"Price rallies back to $100 (E1 level)" },
      { t:"exit",  text:"TP E2 @ $100 → peel as much E1 (TOP) at cost as profits allow" },
      { t:"hold",  text:"Hold E1 — target $110. E1 slot partially or fully freed." },
    ],
    rule:"E2 profits always directed at E1 (top level). If full unit peeled → E1 slot reopens. If partial → bank it, wait for full unit before re-deploying.",
    diag:{
      paths:[
        { d:`M 50,${Y.e1} L 110,${Y.e1} L 190,${Y.e2} L 300,${Y.e2} L 420,${Y.e1}`, c:C.e2 },
      ],
      dots:[
        { x:50,  y:Y.e1, c:C.e1 },
        { x:190, y:Y.e2, c:C.e2 },
        { x:420, y:Y.e1, c:C.e2 },
      ],
      closes:[{ x:420, y:Y.e1 }],
      notes:[
        { x:53,  y:Y.e1-8,  text:"E1 @$100",              c:C.e1 },
        { x:193, y:Y.e2+14, text:"E2 @$92",                c:C.e2 },
        { x:424, y:Y.e1-8,  text:"E2 TP → peel E1 (top)", c:C.e2 },
        { x:424, y:Y.e1+10, text:"Hold E1 → $110",         c:"#86efac" },
      ],
      levels:[Y.t1,Y.e1,Y.e2],
    }
  },
  {
    id:"p3", tab:"Phase 3", sub:"E3 Added",
    color:C.e3, mode:"profit",
    desc:"Price falls to E3 → add E3 @ $84. On bounce to E2 level ($92), exit E1 (loss) + E3 (profit) together. E3 profits peel E1 (TOP). Hold E2 alone.",
    steps:[
      { t:"entry", text:"Holding E1 @ $100 + E2 @ $92" },
      { t:"entry", text:"Price falls to $84 → Enter E3 @ $84" },
      { t:"up",    text:"Price bounces to $92 (E2 level)" },
      { t:"exit",  text:"Exit E1 (loss) + E3 (profit) together @ $92" },
      { t:"be",    text:"E3 profit peels E1 (TOP) at cost — net flat or +" },
      { t:"hold",  text:"Hold E2 only → price to $100: TP ✅ | price to $84: restart Phase 2 🔄" },
    ],
    rule:"E3 and E1 always exit together at E2 level. Profits always directed at TOP entry (E1). Hold E2 as the new working position.",
    diag:{
      paths:[
        { d:`M 40,${Y.e1} L 90,${Y.e1} L 155,${Y.e2} L 215,${Y.e2} L 280,${Y.e3} L 370,${Y.e3} L 450,${Y.e2}`, c:C.e3 },
      ],
      dots:[
        { x:40,  y:Y.e1, c:C.e1 },
        { x:155, y:Y.e2, c:C.e2 },
        { x:280, y:Y.e3, c:C.e3 },
        { x:450, y:Y.e2, c:C.warn },
      ],
      closes:[{ x:450, y:Y.e2 }],
      notes:[
        { x:43,  y:Y.e1-8,  text:"E1 @$100",                c:C.e1 },
        { x:158, y:Y.e2+14, text:"E2 @$92",                  c:C.e2 },
        { x:283, y:Y.e3+14, text:"E3 @$84",                  c:C.e3 },
        { x:454, y:Y.e2-8,  text:"Exit E1+E3 → peel E1",     c:C.warn },
        { x:454, y:Y.e2+10, text:"Hold E2 only →",            c:C.e2 },
      ],
      levels:[Y.t1,Y.e1,Y.e2,Y.e3],
    }
  },
  {
    id:"p4", tab:"Phase 4", sub:"E2 Fork",
    color:"#c084fc", mode:"profit",
    desc:"Holding E2 @ $92 only. Price to $100 → TP, peel E2 (top) fully, done. Price to $84 → add E3, restart Phase 2 with E2 as top level. Loop repeats as needed.",
    steps:[
      { t:"hold",  text:"Holding E2 @ $92 only (E1 fully peeled)" },
      { t:"up",    text:"OUTCOME A: Price → $100" },
      { t:"exit",  text:"→ TP E2 @ $100. Peel E2 (now top). Trade complete ✅" },
      { t:"down",  text:"OUTCOME B: Price → $84" },
      { t:"entry", text:"→ Add E3 @ $84. E2 is now top level." },
      { t:"hold",  text:"→ Repeat Phase 2 logic. Can loop indefinitely in 3-entry mode." },
    ],
    rule:"3-entry profit mode loops freely. E4 is only triggered when price breaks below the lowest active entry level. Peeled slots can re-open once full unit is banked.",
    diag:{
      paths:[
        { d:`M 50,${Y.e2} L 160,${Y.e2}`, c:C.e2 },
        { d:`M 160,${Y.e2} L 320,${Y.e1}`, c:C.e1, dash:"8,4" },
        { d:`M 160,${Y.e2} L 320,${Y.e3}`, c:C.e3, dash:"8,4" },
      ],
      dots:[
        { x:50,  y:Y.e2, c:C.e2 },
        { x:320, y:Y.e1, c:C.e1 },
        { x:320, y:Y.e3, c:C.e3 },
      ],
      notes:[
        { x:53,  y:Y.e2-8, text:"E2 only @$92",            c:C.e2 },
        { x:325, y:Y.e1-8, text:"A: TP → peel E2 ✅",      c:C.e1 },
        { x:325, y:Y.e3-8, text:"B: Add E3 → Phase 2 🔄",  c:C.e3 },
      ],
      levels:[Y.t1,Y.e1,Y.e2,Y.e3],
    }
  },
  {
    id:"p5", tab:"Phase 5", sub:"🚨 E4 — Fix Mode",
    color:C.e4, mode:"fix",
    desc:"Price breaks below E3 → E4 triggered. FIX MODE. E4 TP at E3 ($84) → peel TOP entry at cost. Price rises to E2 ($92) → E3 TP → peel TOP. Each cycle up peels one more layer. Peel & re-enter loop repeats until full position at breakeven → close ALL.",
    steps:[
      { t:"entry", text:"In E1+E2+E3. Price drops below E3 → Enter E4 @ $76" },
      { t:"warn",  text:"⚠ FIX MODE — TP fires at or above level price only. Always peel TOP first." },
      { t:"up",    text:"Price rises to $84 (E3 level)" },
      { t:"exit",  text:"TP E4 @ $84 → peel as much of TOP entry (E1) at cost as profits allow" },
      { t:"be",    text:"Partial peel: bank it. Full unit peeled: slot reopens for re-entry." },
      { t:"down",  text:"→ Price drops back: re-enter at that level, TP again → peel more TOP" },
      { t:"up",    text:"Price rises to $92 (E2 level)" },
      { t:"exit",  text:"TP E3 @ $92 → peel remaining TOP entry (E1/E2) at cost" },
      { t:"exit",  text:"→ TP all remaining when position hits breakeven ✅ Close ALL." },
    ],
    rule:"ALWAYS PEEL TOP FIRST. E4 profits → peel E1. E3 profits → peel remaining E1, then E2. Re-enter any peeled slot (once full unit freed) if price returns to that level.",
    diag:{
      paths:[
        // In E1-E3, drop to E4
        { d:`M 25,${Y.e3} L 70,${Y.e3} L 115,${Y.e4} L 185,${Y.e4} L 255,${Y.e3}`, c:C.e4 },
        // Drop back, re-enter E4 loop
        { d:`M 255,${Y.e3} L 300,${Y.e3} L 340,${Y.e4}`, c:C.e4, dash:"6,3" },
        { d:`M 340,${Y.e4} L 375,${Y.e4} L 415,${Y.e3}`, c:C.e4, dash:"4,3" },
        // Rise to E2 — E3 TP
        { d:`M 415,${Y.e3} L 455,${Y.e3} L 515,${Y.e2}`, c:C.e3 },
        // A: TP all at B/E
        { d:`M 515,${Y.e2} L 560,${Y.e2} L 610,${Y.e1}`, c:C.go, dash:"8,4" },
        // B: drops, re-enter E3
        { d:`M 515,${Y.e2} L 555,${Y.e2} L 600,${Y.e3}`, c:C.warn, dash:"6,3" },
        { d:`M 600,${Y.e3} L 635,${Y.e3} L 665,${Y.e2}`, c:C.be, dash:"4,3" },
      ],
      dots:[
        { x:25,  y:Y.e3, c:C.e3 },
        { x:115, y:Y.e4, c:C.e4 },
        { x:255, y:Y.e3, c:C.e4 },
        { x:340, y:Y.e4, c:C.e4 },
        { x:415, y:Y.e3, c:C.e4 },
        { x:515, y:Y.e2, c:C.e3 },
        { x:610, y:Y.e1, c:C.go },
        { x:600, y:Y.e3, c:C.warn },
        { x:665, y:Y.e2, c:C.be },
      ],
      closes:[
        { x:255, y:Y.e3 },
        { x:415, y:Y.e3 },
        { x:515, y:Y.e2 },
        { x:665, y:Y.e2 },
      ],
      notes:[
        { x:27,  y:Y.e3-10, text:"In E1–E3",                     c:C.e3 },
        { x:118, y:Y.e4+14, text:"E4 @$76",                       c:C.e4 },
        { x:258, y:Y.e3-10, text:"E4 TP @$84 → peel E1 (TOP)",    c:C.e4 },
        { x:343, y:Y.e4+14, text:"Re-enter E4 🔄",                c:C.e4 },
        { x:418, y:Y.e3-10, text:"E4 TP @$84 again",              c:C.e4 },
        { x:518, y:Y.e2-10, text:"E3 TP @$92 → peel TOP",         c:C.e3 },
        { x:614, y:Y.e1-10, text:"A: TP all @ B/E ✅",             c:C.go },
        { x:603, y:Y.e3+14, text:"B: Re-enter E3",                 c:C.warn },
        { x:610, y:Y.e2-10, text:"Close ALL @ B/E ✅",             c:C.be },
      ],
      levels:[Y.e1,Y.e2,Y.e3,Y.e4],
      fixBg:true,
    }
  },
  {
    id:"p6", tab:"Phase 6", sub:"🚨 E5 — Deeper Fix",
    color:C.e5, mode:"fix",
    desc:"Price breaks below E4 → E5 @ $68. TP rule: at or above $76 (entry level price). E5 TP fires at $76 → close E5, peel TOP. Price drops to $68 → re-enter E5. Price back to $76 → TP fires again → peel TOP again. Loop repeats as many times as needed. Price never TPs below $76 — if it stalls short, hold and wait.",
    steps:[
      { t:"entry", text:"In E1–E4. Price drops below E4 → Enter E5 @ $68" },
      { t:"warn",  text:"⚠ TP rule: at or above level price only. Never take profits below the level." },
      { t:"up",    text:"Price reaches $76 → E5 TP fires → close E5, peel TOP" },
      { t:"be",    text:"Partial peel → bank it. Full unit peeled → slot reopens for re-entry." },
      { t:"down",  text:"Price drops to $68 → re-enter E5 @ $68. TP again at $76 → peel TOP 🔄" },
      { t:"up",    text:"Price breaks above $76 and continues to $84 → E4 TP fires → peel TOP" },
      { t:"down",  text:"Price drops back to $76 → re-enter E4 @ $76. TP again at $84 → peel TOP 🔄" },
      { t:"up",    text:"Price breaks above $84 and continues to $92 → E3 TP fires → peel TOP" },
      { t:"exit",  text:"Each re-entry loop at any level repeats as many times as needed." },
      { t:"exit",  text:"When full position hits breakeven → close ALL immediately ✅" },
    ],
    rule:"TP fires at or above $76 — never below. Price short of $76 = hold and wait. Price drops after TP → re-enter E5 @ $68, same rule applies. Every TP at every level → peel TOP first.",
    diag:{
      paths:[
        // In E1-E4 @ $76, drop to E5 @ $68
        { d:`M 20,${Y.e4} L 50,${Y.e4} L 78,${Y.e5} L 128,${Y.e5} L 172,${Y.e4}`, c:C.e5 },
        // E5 re-entry loop: drop to $68, back to $76
        { d:`M 172,${Y.e4} L 202,${Y.e4} L 228,${Y.e5}`, c:C.e5, dash:"6,3" },
        { d:`M 228,${Y.e5} L 258,${Y.e5} L 288,${Y.e4}`, c:C.e5, dash:"4,3" },
        // Rise from $76 to $84 — E4 TP
        { d:`M 288,${Y.e4} L 318,${Y.e4} L 358,${Y.e3}`, c:C.e4 },
        // E4 re-entry loop: drop back to $76, re-enter E4, rise to $84 again
        { d:`M 358,${Y.e3} L 388,${Y.e3} L 418,${Y.e4}`, c:C.e4, dash:"6,3" },
        { d:`M 418,${Y.e4} L 448,${Y.e4} L 488,${Y.e3}`, c:C.e4, dash:"4,3" },
        // Continue rise to $92 — E3 TP
        { d:`M 488,${Y.e3} L 518,${Y.e3} L 558,${Y.e2}`, c:C.e3 },
        // A: TP all at B/E — price runs up
        { d:`M 558,${Y.e2} L 592,${Y.e2} L 632,${Y.e1}`, c:C.go, dash:"8,4" },
        // B: drops after E3 TP — re-enter, close all
        { d:`M 558,${Y.e2} L 590,${Y.e2} L 622,${Y.e3}`, c:C.warn, dash:"6,3" },
        { d:`M 622,${Y.e3} L 650,${Y.e3} L 675,${Y.e2}`, c:C.be, dash:"4,3" },
      ],
      dots:[
        { x:20,  y:Y.e4, c:C.e4 },   // start: in E1-E4
        { x:78,  y:Y.e5, c:C.e5 },   // E5 entry @ $68
        { x:172, y:Y.e4, c:C.e5 },   // E5 TP @ $76
        { x:228, y:Y.e5, c:C.e5 },   // re-enter E5 @ $68
        { x:288, y:Y.e4, c:C.e5 },   // E5 TP @ $76 again
        { x:358, y:Y.e3, c:C.e4 },   // E4 TP @ $84
        { x:418, y:Y.e4, c:C.e4 },   // re-enter E4 @ $76
        { x:488, y:Y.e3, c:C.e4 },   // E4 TP @ $84 again
        { x:558, y:Y.e2, c:C.e3 },   // E3 TP @ $92
        { x:632, y:Y.e1, c:C.go },   // A: close all at B/E
        { x:622, y:Y.e3, c:C.warn }, // B: re-enter
        { x:675, y:Y.e2, c:C.be },   // close all at B/E
      ],
      closes:[
        { x:172, y:Y.e4 },  // E5 TP
        { x:288, y:Y.e4 },  // E5 TP again
        { x:358, y:Y.e3 },  // E4 TP
        { x:488, y:Y.e3 },  // E4 TP again
        { x:558, y:Y.e2 },  // E3 TP
        { x:675, y:Y.e2 },  // close all
      ],
      notes:[
        { x:22,  y:Y.e4-10, text:"In E1–E4",                           c:C.e4 },
        { x:81,  y:Y.e5+13, text:"E5 @$68",                            c:C.e5 },
        { x:175, y:Y.e4-10, text:"E5 TP @$76 → peel TOP",              c:C.e5 },
        { x:231, y:Y.e5+13, text:"Re-enter E5 @$68 🔄",                c:C.e5 },
        { x:291, y:Y.e4-10, text:"E5 TP @$76 again → peel TOP",        c:C.e5 },
        { x:361, y:Y.e3-10, text:"E4 TP @$84 → peel TOP",              c:C.e4 },
        { x:421, y:Y.e4+13, text:"Price drops → Re-enter E4 @$76 🔄",  c:C.e4 },
        { x:491, y:Y.e3-10, text:"E4 TP @$84 again → peel TOP",        c:C.e4 },
        { x:561, y:Y.e2-10, text:"E3 TP @$92 → peel TOP",              c:C.e3 },
        { x:636, y:Y.e1-10, text:"A: TP all @ B/E ✅",                  c:C.go },
        { x:625, y:Y.e3+13, text:"B: Re-enter 🔄",                     c:C.warn },
        { x:628, y:Y.e2-10, text:"Close ALL @ B/E ✅",                  c:C.be },
      ],
      levels:[Y.e1,Y.e2,Y.e3,Y.e4,Y.e5],
      fixBg:true,
    }
  },
  {
    id:"p7", tab:"Phase 7", sub:"🚨 E6 — MAX Fix",
    color:C.e6, mode:"fix",
    desc:"E6 @ $60 is the MAX — no more entries. E6 TP at $68 → peel TOP. E5 TP at $76 → peel TOP. E4 TP at $84 → peel TOP. E3 TP at $92 → peel TOP. Close ALL the moment full position hits breakeven. Re-enter any freed slot if price returns.",
    steps:[
      { t:"entry", text:"In E1–E5. Price drops below E5 → Enter E6 @ $60 (LAST — no more entries)" },
      { t:"warn",  text:"⚠ E6 = MAX. TP at or above level price only. Every TP → peel TOP." },
      { t:"up",    text:"Price reaches $68 → E6 TP → peel TOP" },
      { t:"down",  text:"Price drops to $60 → re-enter E6. TP again at $68 → peel TOP 🔄" },
      { t:"up",    text:"Price reaches $76 → E5 TP → peel TOP" },
      { t:"down",  text:"Price drops to $68 → re-enter E5. TP again at $76 → peel TOP 🔄" },
      { t:"up",    text:"Price reaches $84 → E4 TP → peel TOP" },
      { t:"down",  text:"Price drops to $76 → re-enter E4. TP again at $84 → peel TOP 🔄" },
      { t:"up",    text:"Price reaches $92 → E3 TP → peel TOP" },
      { t:"exit",  text:"Each loop at each level repeats as many times as needed." },
      { t:"exit",  text:"Full position hits breakeven → close ALL immediately ✅" },
      { t:"warn",  text:"🛑 HARD STOP: If price drops 1 full APC cycle below E6 ($50) → STOP OUT entire position. No exceptions." },
    ],
    rule:"E6 is absolute MAX. Every TP → peel TOP. Re-enter freed slots as needed. Close ALL at breakeven. HARD STOP at $50 — one full APC cycle below E6. If price reaches $50, close everything immediately.",
    diag:{
      paths:[
        // In E1-E5 @ $68, drop to E6 @ $60
        { d:`M 15,${Y.e5} L 38,${Y.e5} L 58,${Y.e6} L 98,${Y.e6} L 132,${Y.e5}`, c:C.e6 },
        // E6 re-entry loop: drop to $60, back to $68
        { d:`M 132,${Y.e5} L 155,${Y.e5} L 175,${Y.e6}`, c:C.e6, dash:"6,3" },
        { d:`M 175,${Y.e6} L 198,${Y.e6} L 222,${Y.e5}`, c:C.e6, dash:"4,3" },
        // Rise from $68 to $76 — E5 TP
        { d:`M 222,${Y.e5} L 248,${Y.e5} L 278,${Y.e4}`, c:C.e5 },
        // E5 re-entry loop: drop to $68, back to $76
        { d:`M 278,${Y.e4} L 300,${Y.e4} L 322,${Y.e5}`, c:C.e5, dash:"6,3" },
        { d:`M 322,${Y.e5} L 345,${Y.e5} L 368,${Y.e4}`, c:C.e5, dash:"4,3" },
        // Rise from $76 to $84 — E4 TP
        { d:`M 368,${Y.e4} L 390,${Y.e4} L 418,${Y.e3}`, c:C.e4 },
        // E4 re-entry loop: drop to $76, back to $84
        { d:`M 418,${Y.e3} L 440,${Y.e3} L 462,${Y.e4}`, c:C.e4, dash:"6,3" },
        { d:`M 462,${Y.e4} L 484,${Y.e4} L 508,${Y.e3}`, c:C.e4, dash:"4,3" },
        // Rise from $84 to $92 — E3 TP
        { d:`M 508,${Y.e3} L 530,${Y.e3} L 558,${Y.e2}`, c:C.e3 },
        // A: price runs — close all at B/E
        { d:`M 558,${Y.e2} L 585,${Y.e2} L 618,${Y.e1}`, c:C.go, dash:"8,4" },
        // B: drops after E3 TP — re-enter, close all
        { d:`M 558,${Y.e2} L 582,${Y.e2} L 612,${Y.e3}`, c:C.warn, dash:"6,3" },
        { d:`M 612,${Y.e3} L 638,${Y.e3} L 662,${Y.e2}`, c:C.be, dash:"4,3" },
        // HARD STOP — price drops 1 APC below E6 to $50
        { d:`M 58,${Y.e6} L 90,${Y.e6} L 115,${Y.sl}`, c:"#ff0000", dash:"4,2", w:2 },
      ],
      dots:[
        { x:15,  y:Y.e5, c:C.e5 },   // start: in E1-E5
        { x:58,  y:Y.e6, c:C.e6 },   // E6 entry @ $60
        { x:132, y:Y.e5, c:C.e6 },   // E6 TP @ $68
        { x:175, y:Y.e6, c:C.e6 },   // re-enter E6 @ $60
        { x:222, y:Y.e5, c:C.e6 },   // E6 TP @ $68 again
        { x:278, y:Y.e4, c:C.e5 },   // E5 TP @ $76
        { x:322, y:Y.e5, c:C.e5 },   // re-enter E5 @ $68
        { x:368, y:Y.e4, c:C.e5 },   // E5 TP @ $76 again
        { x:418, y:Y.e3, c:C.e4 },   // E4 TP @ $84
        { x:462, y:Y.e4, c:C.e4 },   // re-enter E4 @ $76
        { x:508, y:Y.e3, c:C.e4 },   // E4 TP @ $84 again
        { x:558, y:Y.e2, c:C.e3 },   // E3 TP @ $92
        { x:618, y:Y.e1, c:C.go },   // A: close all at B/E
        { x:612, y:Y.e3, c:C.warn }, // B: re-enter
        { x:662, y:Y.e2, c:C.be },   // close all at B/E
        { x:115, y:Y.sl, c:"#ff0000" }, // HARD STOP @ $50
      ],
      closes:[
        { x:132, y:Y.e5 },  // E6 TP
        { x:222, y:Y.e5 },  // E6 TP again
        { x:278, y:Y.e4 },  // E5 TP
        { x:368, y:Y.e4 },  // E5 TP again
        { x:418, y:Y.e3 },  // E4 TP
        { x:508, y:Y.e3 },  // E4 TP again
        { x:558, y:Y.e2 },  // E3 TP
        { x:662, y:Y.e2 },  // close all
        { x:115, y:Y.sl },  // HARD STOP
      ],
      notes:[
        { x:17,  y:Y.e5-10, text:"In E1–E5",                          c:C.e5 },
        { x:61,  y:Y.e6+13, text:"E6 @$60 MAX",                       c:C.e6 },
        { x:135, y:Y.e5-10, text:"E6 TP @$68 → peel TOP",             c:C.e6 },
        { x:178, y:Y.e6+13, text:"Re-enter E6 @$60 🔄",               c:C.e6 },
        { x:225, y:Y.e5-10, text:"E6 TP @$68 again → peel TOP",       c:C.e6 },
        { x:281, y:Y.e4-10, text:"E5 TP @$76 → peel TOP",             c:C.e5 },
        { x:325, y:Y.e5+13, text:"Re-enter E5 @$68 🔄",               c:C.e5 },
        { x:371, y:Y.e4-10, text:"E5 TP @$76 again → peel TOP",       c:C.e5 },
        { x:421, y:Y.e3-10, text:"E4 TP @$84 → peel TOP",             c:C.e4 },
        { x:465, y:Y.e4+13, text:"Re-enter E4 @$76 🔄",               c:C.e4 },
        { x:511, y:Y.e3-10, text:"E4 TP @$84 again → peel TOP",       c:C.e4 },
        { x:561, y:Y.e2-10, text:"E3 TP @$92 → peel TOP",             c:C.e3 },
        { x:622, y:Y.e1-10, text:"A: Close ALL @ B/E ✅",              c:C.go },
        { x:615, y:Y.e3+13, text:"B: Re-enter 🔄",                    c:C.warn },
        { x:618, y:Y.e2-10, text:"Close ALL @ B/E ✅",                 c:C.be },
        { x:118, y:Y.sl-8,  text:"🛑 HARD STOP @$50",                 c:"#ff0000" },
        { x:118, y:Y.sl+12, text:"−1 APC below E6 → STOP OUT ALL",    c:"#ff6666" },
      ],
      levels:[Y.e1,Y.e2,Y.e3,Y.e4,Y.e5,Y.e6,Y.sl],
      fixBg:true,
    }
  },
];

// ── SVG DIAGRAM ───────────────────────────────────────────────────────────────
function Diagram({ phase }) {
  const sw = 700, sh = 460;
  if (!phase?.diag) return null;
  const d = phase.diag;

  const allLines = [
    { y:Y.t1, label:"$110", sub:"E1 Target",         color:C.e1,   dash:true  },
    { y:Y.e1, label:"$100", sub:"Entry 1",            color:C.e1,   dash:false },
    { y:Y.e2, label:"$92",  sub:"Entry 2",            color:C.e2,   dash:false },
    { y:Y.e3, label:"$84",  sub:"E3 / E4 Target",     color:C.e3,   dash:false },
    { y:Y.e4, label:"$76",  sub:"E4 / E5 Target 🚨",  color:C.e4,   dash:false },
    { y:Y.e5, label:"$68",  sub:"E5 / E6 Target 🚨",  color:C.e5,   dash:false },
    { y:Y.e6, label:"$60",  sub:"Entry 6 MAX 🚨",      color:C.e6,   dash:false },
    { y:Y.sl, label:"$50",  sub:"HARD STOP — close ALL", color:"#ff0000", dash:true  },
  ];
  const shown = d.levels || [Y.t1, Y.e1];
  const gridLines = allLines.filter(l => shown.includes(l.y));

  return (
    <svg width={sw} height={sh} style={{ display:"block", overflow:"visible" }}>
      {d.fixBg && <rect x={0} y={0} width={sw} height={sh} fill="#ef444406" rx={6}/>}

      {/* Grid lines */}
      {gridLines.map((l,i) => (
        <g key={i}>
          <line x1={0} y1={l.y} x2={sw} y2={l.y}
            stroke={l.color} strokeWidth={l.dash ? 1 : 1.5}
            strokeDasharray={l.dash ? "5,4" : "none"} opacity={0.28}/>
          <rect x={0} y={l.y-13} width={34} height={13} fill="#060a10" opacity={0.85}/>
          <text x={3} y={l.y-2} fill={l.color} fontSize={9} fontFamily={mono} opacity={0.9}>{l.label}</text>
          <text x={sw-3} y={l.y-2} fill={l.color} fontSize={9} fontFamily={mono} opacity={0.5} textAnchor="end">{l.sub}</text>
        </g>
      ))}

      {/* Paths */}
      {d.paths?.map((p,i) => (
        <path key={i} d={p.d} fill="none" stroke={p.c} strokeWidth={p.w||2.5}
          strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={p.dash||"none"} opacity={0.92}/>
      ))}

      {/* X close markers */}
      {d.closes?.map((c,i) => (
        <g key={i}>
          <line x1={c.x-8} y1={c.y-8} x2={c.x+8} y2={c.y+8} stroke={C.warn} strokeWidth={2.5} strokeLinecap="round"/>
          <line x1={c.x+8} y1={c.y-8} x2={c.x-8} y2={c.y+8} stroke={C.warn} strokeWidth={2.5} strokeLinecap="round"/>
        </g>
      ))}

      {/* Dots */}
      {d.dots?.map((pt,i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={9} fill={pt.c} opacity={0.15}/>
          <circle cx={pt.x} cy={pt.y} r={4} fill={pt.c}/>
          <circle cx={pt.x} cy={pt.y} r={2} fill="#fff" opacity={0.9}/>
        </g>
      ))}

      {/* Annotations */}
      {d.notes?.map((n,i) => (
        <text key={i} x={n.x} y={n.y} fill={n.c} fontSize={10} fontFamily={mono}
          style={{ filter:"drop-shadow(0 1px 3px #000c)" }}>{n.text}</text>
      ))}

      <text x={6} y={sh-5} fill="#1e3a5f" fontSize={9} fontFamily={mono}>TIME →</text>
    </svg>
  );
}

// ── STEP ROW ──────────────────────────────────────────────────────────────────
function Step({ s }) {
  const cfg = {
    entry:{ icon:"▶", c:C.e1  },
    exit: { icon:"✓", c:"#60a5fa" },
    up:   { icon:"↑", c:C.e1  },
    down: { icon:"↓", c:C.e3  },
    be:   { icon:"½", c:C.be  },
    hold: { icon:"◉", c:C.e2  },
    warn: { icon:"⚠", c:C.warn },
  }[s.t] || { icon:"•", c:"#64748b" };
  return (
    <div style={{ display:"flex", gap:9, padding:"6px 10px", background:"#0a1020", borderRadius:6,
      border:`1px solid ${s.t==="warn"?"#ef444435":s.t==="be"?"#a78bfa20":"#0f2040"}` }}>
      <span style={{ color:cfg.c, fontSize:13, minWidth:16, flexShrink:0, marginTop:1 }}>{cfg.icon}</span>
      <span style={{ fontSize:11, lineHeight:1.5,
        color:s.t==="warn"?"#fca5a5":s.t==="be"?"#c4b5fd":"#d1d5db" }}>{s.text}</span>
    </div>
  );
}

// ── PEEL TRACKER (visual unit counter) ───────────────────────────────────────
function PeelTracker() {
  const entries = [
    { label:"E1", price:"$100", color:C.e1, bg:"#052e16" },
    { label:"E2", price:"$92",  color:C.e2, bg:"#451a03" },
    { label:"E3", price:"$84",  color:C.e3, bg:"#431407" },
    { label:"E4", price:"$76",  color:C.e4, bg:"#450a0a" },
    { label:"E5", price:"$68",  color:C.e5, bg:"#450a0a" },
    { label:"E6", price:"$60",  color:C.e6, bg:"#450a0a" },
  ];
  return (
    <div style={{ background:"#0a1020", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 14px" }}>
      <div style={{ fontSize:9, color:"#475569", fontFamily:mono, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
        Universal Peel Rules — Applied Every Phase
      </div>
      {PEEL_RULES.map((r,i) => (
        <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
          <span style={{ fontSize:14, color:r.color, minWidth:20, fontFamily:mono }}>{r.icon}</span>
          <span style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5 }}>{r.text}</span>
        </div>
      ))}
      <div style={{ marginTop:12, borderTop:"1px solid #0f2040", paddingTop:10 }}>
        <div style={{ fontSize:9, color:"#475569", fontFamily:mono, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
          Peel Direction — Always Top Down ▼
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {entries.map((e,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, padding:"2px 0", textAlign:"center", borderRadius:4,
                background:e.bg, border:`1px solid ${e.color}40`,
                fontSize:9, fontWeight:700, color:e.color, fontFamily:mono }}>{e.label}</div>
              <div style={{ fontSize:9, color:e.color, fontFamily:mono }}>{e.price}</div>
              {i === 0 && <div style={{ fontSize:9, color:"#22c55e", fontFamily:mono }}>← PEEL FIRST (top)</div>}
              {i === 5 && <div style={{ fontSize:9, color:"#fca5a5", fontFamily:mono }}>← TP here, profits go UP ↑</div>}
              {i > 0 && i < 5 && (
                <div style={{ fontSize:8, color:"#334155", fontFamily:mono }}>
                  {i <= 2 ? "← peel next after E" + i : "← generates profits → peel above"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("p1");
  const phase = PHASES.find(p => p.id === active) || PHASES[0];

  return (
    <div style={{ minHeight:"100vh", background:"#060a10", color:"#e2e8f0", fontFamily:sans, padding:"20px 24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:"#475569", fontFamily:mono, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:3 }}>
          6-Entry Money Management System
        </div>
        <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em" }}>
          Entry, Exit &amp; Trade Fix — Visual Diagram
        </h1>
        <p style={{ margin:"3px 0 0", fontSize:11, color:"#64748b" }}>
          APC cycle = $10 · Entry spacing = $8 (80%) · Profits always peel TOP entry first · Max 6 units
        </p>
      </div>

      {/* Phase tabs */}
      <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
        {PHASES.map(p => {
          const on = active === p.id;
          const fix = p.mode === "fix";
          return (
            <button key={p.id} onClick={() => setActive(p.id)} style={{
              padding:"6px 13px", borderRadius:8, cursor:"pointer", fontFamily:mono,
              border:`1px solid ${on ? p.color : fix ? "#ef444440" : "#1e3a5f"}`,
              background: on ? `${p.color}18` : fix ? "#450a0a50" : "transparent",
              color: on ? p.color : fix ? "#ef4444aa" : "#475569",
              fontSize:11, fontWeight:700,
              boxShadow: on ? `0 0 14px ${p.color}35` : "none",
              transition:"all 0.15s"
            }}>
              {p.tab}
              <span style={{ display:"block", fontSize:8, fontWeight:400, opacity:0.65, marginTop:1 }}>
                {p.sub.replace("🚨 ","")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fix mode banner */}
      {phase.mode === "fix" && (
        <div style={{ marginBottom:12, padding:"8px 14px", background:"#450a0a",
          border:"1px solid #ef444450", borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🚨</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#ef4444", fontFamily:mono }}>FIX MODE — Goal is BREAKEVEN · Always peel TOP entry first</div>
            <div style={{ fontSize:11, color:"#fca5a5" }}>
              Every TP profit → directed at highest active entry. Partial peel banked. Full unit freed → slot reopens.
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, marginBottom:14 }}>

        {/* Chart */}
        <div style={{ background:"#0a1020", border:`1px solid ${phase.color}30`, borderRadius:12, padding:"12px 12px 8px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:phase.color, fontFamily:mono, marginBottom:2 }}>{phase.sub}</div>
          <div style={{ fontSize:10, color:"#475569", marginBottom:10, lineHeight:1.5 }}>{phase.desc}</div>
          <Diagram phase={phase}/>
          {/* Legend */}
          <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap", borderTop:"1px solid #0f2040", paddingTop:7 }}>
            {[
              { c:C.e1, l:"E1 $100" },{ c:C.e2, l:"E2 $92" },{ c:C.e3, l:"E3 $84" },
              { c:C.e4, l:"E4 $76" },{ c:C.e5, l:"E5 $68" },{ c:C.e6, l:"E6 $60 MAX" },
              { c:"#6b7280", l:"Dashed = outcome / re-entry" },
            ].map((lg,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:12, height:2, background:lg.c, borderRadius:1 }}/>
                <span style={{ fontSize:9, color:"#475569", fontFamily:mono }}>{lg.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps + rule */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, overflow:"auto", maxHeight:520 }}>
          <div style={{ fontSize:9, color:"#475569", fontFamily:mono, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>
            Step-by-Step
          </div>
          {phase.steps.map((s,i) => <Step key={i} s={s}/>)}
          <div style={{ marginTop:4, padding:"9px 12px", background:`${phase.color}10`,
            borderRadius:8, border:`1px solid ${phase.color}30` }}>
            <div style={{ fontSize:9, color:"#475569", fontFamily:mono, textTransform:"uppercase", marginBottom:4 }}>Key Rule</div>
            <div style={{ fontSize:11, color:phase.color, lineHeight:1.55 }}>{phase.rule}</div>
          </div>
        </div>
      </div>

      {/* Universal peel rules */}
      <PeelTracker/>

      {/* Ladder */}
      <div style={{ marginTop:14, background:"#0a1020", borderRadius:12, border:"1px solid #1e3a5f", padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ fontSize:9, color:"#475569", fontFamily:mono, textTransform:"uppercase", letterSpacing:"0.12em" }}>
            Complete 6-Entry Ladder
          </span>
          <div style={{ flex:1, height:1, background:"#0f2040" }}/>
          <span style={{ fontSize:9, color:C.e1, fontFamily:mono }}>E1–E3: Profit Mode</span>
          <div style={{ width:1, height:14, background:"#1e3a5f" }}/>
          <span style={{ fontSize:9, color:C.e4, fontFamily:mono }}>E4–E6: Fix Mode → peel TOP always</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
          {[
            { e:"E1", price:"$100", note:"Primary entry",        goal:"TP +1 cycle ($110) → peel E1",             c:C.e1, bg:"#052e16", ph:"p1" },
            { e:"E2", price:"$92",  note:"−80% of cycle",        goal:"TP @E1 ($100) → peel TOP (E1)",            c:C.e2, bg:"#451a03", ph:"p2" },
            { e:"E3", price:"$84",  note:"−80% of cycle",        goal:"TP @E2 ($92) with E1 → peel TOP",          c:C.e3, bg:"#431407", ph:"p3" },
            { e:"E4", price:"$76",  note:"−80% of cycle 🚨",     goal:"TP @E3 ($84) → peel TOP always",           c:C.e4, bg:"#450a0a", ph:"p5" },
            { e:"E5", price:"$68",  note:"−80% of cycle 🚨",     goal:"TP @E4 ($76) → peel TOP always",           c:C.e5, bg:"#450a0a", ph:"p6" },
            { e:"E6", price:"$60",  note:"MAX — no more 🚨",     goal:"TP @E5 ($68) → peel TOP always",           c:C.e6, bg:"#450a0a", ph:"p7" },
          ].map((r,i) => (
            <div key={i} onClick={() => setActive(r.ph)} style={{
              padding:"9px 11px", background:r.bg, borderRadius:8, cursor:"pointer",
              border:`1px solid ${active===r.ph ? r.c : r.c+"30"}`,
              boxShadow: active===r.ph ? `0 0 12px ${r.c}40` : "none",
              transition:"all 0.15s"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:800, color:r.c, fontFamily:mono }}>{r.e}</span>
                <span style={{ fontSize:11, color:r.c, fontFamily:mono }}>{r.price}</span>
              </div>
              <div style={{ fontSize:9, color:"#64748b", marginBottom:3 }}>{r.note}</div>
              <div style={{ fontSize:9, color:"#94a3b8", lineHeight:1.4 }}>{r.goal}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, padding:"7px 12px", background:"#060a10", borderRadius:6,
          border:"1px solid #0f2040", fontSize:10, color:"#334155", fontFamily:mono, lineHeight:1.6 }}>
          UNIVERSAL RULE: Every TP at every level → peel TOP entry first. Partial peels are banked until a full unit is freed.
          Freed slots reopen for re-entry. Close ALL the moment full position = breakeven. Max 6 active units at any time.
        </div>
      </div>
    </div>
  );
}
