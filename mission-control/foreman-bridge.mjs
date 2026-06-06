import http from "node:http";

const PORT = Number(process.env.FOREMAN_BRIDGE_PORT || 8787);
const TOKEN = process.env.OPENCLAW_BRIDGE_TOKEN || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = process.env.FOREMAN_BRIDGE_MODEL || "moonshotai/kimi-k2";

const system = `You are Foreman, AI operations assistant for Triumph Homes in Grand Bay, Alabama.
Style: direct, practical, no fluff. Focus on scheduling, job-costs, estimates, subs, and client comms.
If asked to do app actions, give exact short steps in Mission Control.`;

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (TOKEN) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${TOKEN}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    try {
      const body = JSON.parse(raw || "{}");
      const text = String(body?.text || "").trim();
      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Message required" }));
        return;
      }

      if (!OPENROUTER_API_KEY) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "OPENROUTER_API_KEY missing on bridge host" }));
        return;
      }

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://triumph-mission-control.vercel.app",
          "X-Title": "Triumph Mission Control Foreman Bridge",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        }),
      });

      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content;
      const reply = typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((p) => p?.text || "").join("\n").trim()
          : "No reply.";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, reply }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Foreman bridge listening on http://127.0.0.1:${PORT}/chat`);
});
