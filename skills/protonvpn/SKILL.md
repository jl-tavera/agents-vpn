---
name: protonvpn
description: Turn Proton VPN (Linux, free plan) on or off, or check the current public IP and country. Use when a task needs a US (or other country) IP, hits geo-restricted content or region blocks, or the user asks to use, connect, or disconnect the VPN.
---

# Proton VPN (Linux)

```
curl -s https://www.cloudflare.com/cdn-cgi/trace | grep -E '^(ip|loc)='   # status: ip + country (loc)
protonvpn connect        # on: fastest free server (blocks until connected)
protonvpn disconnect     # off
protonvpn status         # connected server, if any
```

- Run status first. If it's already in the right country (default US), do nothing.
- Don't use ipinfo.io: it rate-limits (429) shared VPN IPs.
- The free plan can't choose a country (`--country` is rejected). After `connect`, check the country. If it's wrong, `disconnect` and `connect` once more. If it's still wrong, tell the user which country you got rather than looping.
- The VPN is **system-wide**: it affects every process and the user's own browsing. Only turn it off if you turned it on. If the user had it on before, leave it on.
- "Authentication required" means the user must sign in once: ask them to run `protonvpn signin <username>` in their own terminal (it prompts for a password, which the `!` prefix can't show). Report any other error rather than retrying.
