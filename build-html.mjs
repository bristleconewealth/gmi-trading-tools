// To rebuild: npm i esbuild react@18 react-dom@18, then: node build-html.mjs .
// Builds a double-click .html file for each tool (React bundled inline).
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
const dir = process.argv[2];
const tools = [
  ['entry_checklist.jsx', 'entry_checklist.html', 'GMI Entry Checklist'],
  ['macro_dashboard (1).jsx', 'macro_dashboard.html', 'GMI Macro Dashboard'],
  ['money_management_diagram (1).jsx', 'money_management_diagram.html', 'GMI Money Management'],
  ['pattern_scanner.jsx', 'pattern_scanner.html', 'GMI Pattern Scanner'],
];
for (const [src, out, title] of tools) {
  const entry = `import React from "react"; import { createRoot } from "react-dom/client";
import App from ${JSON.stringify(path.join(dir, src))};
createRoot(document.getElementById("root")).render(React.createElement(App));`;
  const r = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'jsx' },
    bundle: true, minify: true, write: false, format: 'iife', target: 'es2019',
    loader: { '.jsx': 'jsx' }, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
    nodePaths: [path.resolve('node_modules')],
  });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<!-- Built from ${src}. Don't edit this file; edit the .jsx and rebuild. -->
<style>html,body{margin:0;background:#050a0e}</style></head>
<body><div id="root"></div><script>${js}</script></body></html>
`;
  fs.writeFileSync(path.join(dir, out), html);
  console.log(out, Math.round(html.length / 1024) + ' KB');
}
