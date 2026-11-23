# Trading Tools

Double-click an `.html` file to open a tool in your browser. Nothing to install.

| Tool | Open | Keys it asks for (pasted once per browser session) |
|---|---|---|
| Entry Checklist | `entry_checklist.html` | Finnhub (live price), GitHub token (log trade) |
| Macro Dashboard | `macro_dashboard.html` | GitHub token (positions), Anthropic (Update from Report) |
| Pattern Scanner | `pattern_scanner.html` | GitHub token (loads the nightly scan) |
| Money Management | `money_management_diagram.html` | none |

- **Pattern Scanner** shows results from the nightly **GMI Pattern Scan** in `gmi-morning-brief` (real Polygon daily candles, as of the last close). It doesn't scan live.
- **Keys** are kept only in that browser tab and cleared when it closes. They're never saved to these files.
- **GitHub token** needs Contents read & write on `bristleconewealth/gmi-morning-brief`.

The `.html` files are built from the `.jsx` source files by `build-html.mjs`. After changing a `.jsx`, rebuild the `.html` (or ask Claude to).
