const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");

function stripModuleSyntax(file) {
  let source = fs.readFileSync(path.join(root, file), "utf8");
  source = source.replace(/import[\s\S]*?from\s+["'][^"']+["'];\s*/g, "");
  source = source.replace(/export\s+/g, "");
  return source.trim();
}

const bundle = `(() => {
"use strict";

${stripModuleSyntax("sudoku.js")}

${stripModuleSyntax("game-state.js")}

${stripModuleSyntax("app.js")}
})();
`;

fs.writeFileSync(path.join(root, "bundle.js"), bundle);
