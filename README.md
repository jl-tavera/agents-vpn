# agents-vpn

Lets AI agents (Claude Code, etc.) turn a VPN on and off to get a US (or other country) IP:

- **Windows**: the [Bright VPN](https://brightvpn.com) desktop app (`skills/brightvpn`).
- **Linux**: [Proton VPN](https://protonvpn.com) Free via its official CLI (`skills/protonvpn`). Bright VPN has no Linux app. See [Linux](#linux-proton-vpn-free).

## Windows (Bright VPN)

Bright VPN has no CLI. `brightvpn.mjs` launches the app with `--remote-debugging-port` and calls the same Electron IPC its UI uses (`connect` / `disconnect`) over the Chrome DevTools Protocol. There are no dependencies; it needs Node 22+.

### Install

1. Download and install the Bright VPN **Windows desktop app** from [brightvpn.com](https://brightvpn.com) (use the "Download for Windows" button). The browser extensions (Chrome, Edge, Firefox, Opera) won't work, because this script drives the desktop app.
2. Open it once and accept the terms, so it's ready to connect.
3. Install Node 22+.

### Usage

```
node skills/brightvpn/brightvpn.mjs status [CC]   # "US 1.2.3.4 City (org)" — exit 0 if country == CC (default US)
node skills/brightvpn/brightvpn.mjs on [CC]       # connect, wait until IP is in CC
node skills/brightvpn/brightvpn.mjs off           # disconnect, wait until IP changes
```

Optional: run `npm link` to put `brightvpn` on your PATH.

Environment overrides: `BRIGHTVPN_EXE` (app path), `BRIGHTVPN_PORT` (DevTools port, default 9339).

### Agent skill

`skills/brightvpn/` is a self-contained Claude Code skill (the script lives next to `SKILL.md`, which references it via `${CLAUDE_SKILL_DIR}`). Link it into your skills folder:

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\brightvpn" -Target "$PWD\skills\brightvpn"
```

Or just copy `skills/brightvpn` into `~/.claude/skills/`. Either way works from any location; nothing needs editing.

### Caveats

- The VPN is system-wide, so every process on the machine uses it.
- The first call restarts Bright VPN if it was started without the debug port. While that port is open, any local process can drive the app.
- This relies on internal IPC names, so a Bright VPN update could break it.

## Linux (Proton VPN Free)

Proton VPN has an official CLI and a free plan with unlimited data, so the skill is just `SKILL.md` and needs no script.

### Install (Arch / Omarchy)

1. `sudo pacman -S proton-vpn-cli` (Debian/Ubuntu: `sudo apt install proton-vpn-cli` from Proton's repo)
2. Create a free account at [proton.me](https://account.protonvpn.com/signup).
3. Sign in once: `protonvpn signin <username>` (add `--totp` if you use an authenticator app).
4. Link the skill: `ln -s "$PWD/skills/protonvpn" ~/.claude/skills/protonvpn`

### Usage

```
protonvpn connect              # fastest free server, system-wide
curl -s https://www.cloudflare.com/cdn-cgi/trace | grep loc=   # check where you exit
protonvpn disconnect
protonvpn status
```

### Caveats

- The free plan can't choose a country or server (`--country` is rejected). `connect` takes the fastest free server, which may not be in the US. The skill checks the exit country and reports it.
- ipinfo.io rate-limits shared VPN IPs (HTTP 429), so check the country with Cloudflare's trace instead.
- The VPN is system-wide, as on Windows.
