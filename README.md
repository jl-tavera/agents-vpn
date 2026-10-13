# agents-vpn

Lets AI agents (Claude Code, etc.) turn the [Bright VPN](https://brightvpn.com) Windows app on and off.

Bright VPN has no CLI. `brightvpn.mjs` launches the app with `--remote-debugging-port` and calls the same Electron IPC its UI uses (`connect` / `disconnect`) over the Chrome DevTools Protocol. There are no dependencies; it needs Node 22+.

## Install

1. Download and install the Bright VPN **Windows desktop app** from [brightvpn.com](https://brightvpn.com) (use the "Download for Windows" button). The browser extensions (Chrome, Edge, Firefox, Opera) won't work, because this script drives the desktop app.
2. Open it once and accept the terms, so it's ready to connect.
3. Install Node 22+.

## Usage

```
node brightvpn.mjs status [CC]   # "US 1.2.3.4 City (org)" — exit 0 if country == CC (default US)
node brightvpn.mjs on [CC]       # connect, wait until IP is in CC
node brightvpn.mjs off           # disconnect, wait until IP changes
```

Optional: run `npm link` to put `brightvpn` on your PATH.

Environment overrides: `BRIGHTVPN_EXE` (app path), `BRIGHTVPN_PORT` (DevTools port, default 9339).

## Agent skill

`skills/brightvpn/SKILL.md` is a Claude Code skill. Link it into your skills folder:

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\brightvpn" -Target "$PWD\skills\brightvpn"
```

If you cloned the repo somewhere else, update the script path in `SKILL.md`.

## Caveats

- The VPN is system-wide, so every process on the machine uses it.
- The first call restarts Bright VPN if it was started without the debug port. While that port is open, any local process can drive the app.
- This relies on internal IPC names, so a Bright VPN update could break it.
