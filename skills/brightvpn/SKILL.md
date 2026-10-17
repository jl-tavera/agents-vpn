---
name: brightvpn
description: Turn the Bright VPN desktop app on or off, or check the current public IP and country. Use when a task needs a US (or other country) IP, hits geo-restricted content or region blocks, or the user asks to use, connect, or disconnect the VPN.
---

# Bright VPN

```
node "${CLAUDE_SKILL_DIR}/brightvpn.mjs" status [CC]  # prints "COUNTRY IP city (org)"; exit 0 if country == CC (default US)
node "${CLAUDE_SKILL_DIR}/brightvpn.mjs" on [CC]      # connect (default US); waits until the IP is in CC
node "${CLAUDE_SKILL_DIR}/brightvpn.mjs" off          # disconnect; waits until the IP changes
```

- Run `status` first. If it's already in the right country, do nothing.
- The VPN is **system-wide**: it affects every process and the user's own browsing. Only turn it `off` if you turned it `on`. If the user had it on before, leave it on.
- The first `on`/`off` may restart the Bright VPN app so it gets a DevTools port. That's expected.
- Exit code 2 means an error (the message is on stderr). Report it rather than retrying in a loop.
