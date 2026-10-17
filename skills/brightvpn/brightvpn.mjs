#!/usr/bin/env node
// Control the Bright VPN desktop app (Windows) from the command line.
// Bright VPN has no CLI, so we start its Electron UI with a DevTools port and
// call the same IPC the UI uses: ipcRenderer.invoke('connect', CC) / ('disconnect').
import { spawn, execFileSync } from 'node:child_process';

const EXE = process.env.BRIGHTVPN_EXE ?? 'C:\\Program Files (x86)\\Bright VPN\\Bright VPN.exe';
const PORT = Number(process.env.BRIGHTVPN_PORT ?? 9339);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ipInfo() {
  const r = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(8000) });
  const { ip, country, city, org } = await r.json();
  return { ip, country, city, org };
}

async function pageWsUrl() {
  try {
    const pages = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    return pages.find(p => p.type === 'page')?.webSocketDebuggerUrl;
  } catch { return undefined; }
}

// Returns the app's DevTools WebSocket URL, (re)launching the app with the debug port if needed.
async function attach() {
  let url = await pageWsUrl();
  if (url) return url;
  // lazy: always kills a running instance to add the flag; the VPN reconnects on its own after launch.
  try { execFileSync('taskkill', ['/IM', 'Bright VPN.exe', '/F'], { stdio: 'ignore' }); await sleep(2000); } catch {}
  spawn(EXE, [`--remote-debugging-port=${PORT}`], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 30 && !url; i++) { await sleep(1000); url = await pageWsUrl(); }
  if (!url) throw new Error(`Bright VPN did not expose DevTools on port ${PORT}. Is it installed at ${EXE}?`);
  await sleep(3000); // let the renderer finish booting
  return url;
}

async function ipc(...args) {
  const ws = new WebSocket(await attach());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const expression = `require('electron').ipcRenderer.invoke(${args.map(a => JSON.stringify(a)).join(',')}).then(() => true)`;
  const reply = await new Promise(res => {
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id === 1) res(d); };
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  ws.close();
  const err = reply.error ?? reply.result?.exceptionDetails;
  if (err) throw new Error(`IPC ${args[0]} failed: ${JSON.stringify(err)}`);
}

async function waitFor(pred, what) {
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    try { const info = await ipInfo(); if (pred(info)) return info; } catch {} // network blips while the tunnel switches
  }
  throw new Error(`Timed out waiting for ${what}`);
}

const print = i => console.log(`${i.country} ${i.ip} ${i.city ?? ''} (${i.org ?? ''})`.replace(/\s+/g, ' '));
const [cmd = 'status', arg] = process.argv.slice(2);
const cc = (arg ?? 'US').toUpperCase();

try {
  if (cmd === 'on') {
    await ipc('connect', cc);
    print(await waitFor(i => i.country === cc, `country ${cc}`));
  } else if (cmd === 'off') {
    const before = await ipInfo();
    await ipc('disconnect');
    print(await waitFor(i => i.ip !== before.ip, 'IP to change'));
  } else if (cmd === 'status') {
    const info = await ipInfo();
    print(info);
    process.exitCode = info.country === cc ? 0 : 1;
  } else {
    console.log('usage: brightvpn on [CC=US] | off | status [CC=US]   (status exits 0 when country == CC)');
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
