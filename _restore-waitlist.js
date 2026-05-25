const fs = require("fs");
const path = require("path");

const transcripts = [
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-jerom-OneDrive-Desktop-apore-research/agent-transcripts/f3c4d24b-34a5-4ef5-9ea5-010088b6754e/f3c4d24b-34a5-4ef5-9ea5-010088b6754e.jsonl",
  ),
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-jerom-OneDrive-Desktop-apore-research/agent-transcripts/a9cc3a2d-0321-4669-bd1e-bfe5e6364a47/a9cc3a2d-0321-4669-bd1e-bfe5e6364a47.jsonl",
  ),
];

const siteRoot = __dirname;
const latest = new Map();

function applyTool(tool) {
  const input = tool.input;
  if (!input?.path) return;
  const rel = input.path.replace(/\\/g, "/");
  if (!rel.toLowerCase().includes("/site/")) return;

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

for (const file of transcripts) {
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (line.includes("Replacing the custom waitlist with Clerk")) break;
    if (!line.includes('"Write"') && !line.includes('"StrReplace"')) continue;

    let payload;
    try {
      payload = JSON.parse(line);
    } catch {
      continue;
    }

    const tools =
      payload.message?.content?.filter((c) => c.type === "tool_use") ?? [];
    for (const tool of tools) applyTool(tool);
  }
}

for (const [rel, contents] of latest.entries()) {
  const idx = rel.toLowerCase().indexOf("/site/");
  const out = rel.slice(idx + "/site/".length);
  if (
    out.includes("clerk") ||
    out.includes("waitlist-cta") ||
    out.includes("sign-in") ||
    out.includes("sign-up") ||
    out.includes("middleware.ts")
  ) {
    continue;
  }
  const full = path.join(siteRoot, out);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
  console.log("restored", out);
}
