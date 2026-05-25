const fs = require("fs");
const path = require("path");

const transcript = fs.readFileSync(
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-jerom-OneDrive-Desktop-apore-research/agent-transcripts/a9cc3a2d-0321-4669-bd1e-bfe5e6364a47/a9cc3a2d-0321-4669-bd1e-bfe5e6364a47.jsonl",
  ),
  "utf8",
);

const targets = [
  "waitlist-form.tsx",
  "validate-email.ts",
  "waitlist/route.ts",
  "waitlist-notify.ts",
  "nav.tsx",
  "layout.tsx",
  "hero.tsx",
  "manifesto.tsx",
  "cta-band.tsx",
  ".env.example",
  "README.md",
];

const latest = new Map();
let stop = false;

for (const line of transcript.split("\n")) {
  if (line.includes("Replacing the custom waitlist with Clerk")) {
    stop = true;
    break;
  }

  if (!line.includes('"Write"') && !line.includes('"StrReplace"')) continue;

  let payload;
  try {
    payload = JSON.parse(line);
  } catch {
    continue;
  }

  const tools = payload.message?.content?.filter((c) => c.type === "tool_use") ?? [];
  for (const tool of tools) {
    const input = tool.input;
    if (!input?.path) continue;
    const rel = input.path.replace(/\\/g, "/");
    if (!targets.some((t) => rel.includes(t.replace(/^\./, "")))) continue;

    if (tool.name === "Write" && input.contents) {
      latest.set(rel, input.contents);
    }
    if (tool.name === "StrReplace" && input.old_string && input.new_string) {
      const current = latest.get(rel);
      if (current && current.includes(input.old_string)) {
        latest.set(rel, current.replace(input.old_string, input.new_string));
      }
    }
  }
}

const siteRoot = __dirname;
for (const [rel, contents] of latest.entries()) {
  const idx = rel.toLowerCase().indexOf("/site/");
  if (idx === -1) continue;
  const out = rel.slice(idx + "/site/".length);
  const full = path.join(siteRoot, out);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
  console.log("restored", out);
}

console.log("stopped before clerk:", stop);
