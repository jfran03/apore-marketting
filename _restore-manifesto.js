const fs = require("fs");
const path = require("path");

const transcript = fs.readFileSync(
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-jerom-OneDrive-Desktop-apore-research/agent-transcripts/9076f798-4968-4151-ab9a-2e9309a3a843/9076f798-4968-4151-ab9a-2e9309a3a843.jsonl",
  ),
  "utf8",
);

const allow = [
  "manifesto.tsx",
  "nav.tsx",
  "app/page.tsx",
  "app/manifesto/page.tsx",
  "hero.tsx",
];

const siteRoot = __dirname;
const latest = new Map();

for (const line of transcript.split("\n")) {
  if (!line.includes('"Write"') && !line.includes('"StrReplace"')) continue;
  let payload;
  try {
    payload = JSON.parse(line);
  } catch {
    continue;
  }
  for (const tool of payload.message?.content?.filter((c) => c.type === "tool_use") ?? []) {
    const input = tool.input;
    if (!input?.path) continue;
    const rel = input.path.replace(/\\/g, "/");
    if (!allow.some((a) => rel.includes(a))) continue;
    if (tool.name === "Write" && input.contents) latest.set(rel, input.contents);
    if (tool.name === "StrReplace" && input.old_string && input.new_string) {
      const current = latest.get(rel);
      if (current?.includes(input.old_string)) {
        latest.set(rel, current.replace(input.old_string, input.new_string));
      }
    }
  }
}

for (const [rel, contents] of latest.entries()) {
  const idx = rel.toLowerCase().indexOf("/site/");
  const out = rel.slice(idx + "/site/".length);
  fs.mkdirSync(path.dirname(path.join(siteRoot, out)), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, out), contents);
  console.log("restored", out);
}
