# MEMORY.md

## Preferences
- Ryland wants direct, no-fluff help.
- Use a compact "MISSION CONTROL" routing block at the top of replies showing which model/tool handled what.

## OpenClaw / Model setup
- OpenRouter is configured for this workspace/OpenClaw setup.
- Preferred default/brain model: `openrouter/moonshotai/kimi-k2`.
- Preferred coding mode model: `openrouter/deepseek/deepseek-chat-v3`.
- Preferred heartbeat model: `openrouter/anthropic/claude-haiku-4.5`.
- Preferred web-search model: `deepseek/deepseek-chat-v3` via Perplexity/OpenRouter.
- Preferred image-understanding model: `google/gemini-2.5-flash`.
- Voice model setup was deferred/skipped for now.

## Mission Control app
- Mission Control app lives at `~/.openclaw/workspace/mission-control`.
- The app is a Linear-style Triumph Homes operations dashboard with:
  - Overview/dashboard
  - Calendar page
  - Clickable job detail pages
  - Sample job/task/schedule data
  - House filtering and attention queue
- A one-click launcher exists at `~/Desktop/Mission Control.command`.
