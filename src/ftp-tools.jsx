import React, { useMemo, useState } from "react";

// Simple, single-file React tool with Tailwind styling
// - Quick-copy FTP command reference (USER, PASS, LIST, RETR, STOR, TYPE I, etc.)
// - PORT command builder (IPv4 + port → PORT h1,h2,h3,h4,p1,p2)
// - PASV / 227 response parser (h1..h4,p1,p2 → IP:port)
// - Reverse PORT parser (PORT tuple → IP:port)
// - EPRT helper for IPv4 (|1|ip|port|)
// Notes: No external deps; copy uses navigator.clipboard

const CommandRow = ({ label, template }) => {
  const [args, setArgs] = useState("");
  const text = useMemo(() => {
    if (!args) return template;
    return template.replace(/\{args\}/g, args);
  }, [template, args]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      alert("Clipboard copy failed. Select and copy manually.\n\n" + text);
    }
  };

  const hasArgs = template.includes("{args}");

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/50 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-mono text-sm md:text-base break-all select-all">{text}</div>
      </div>
      {hasArgs && (
        <input
          className="w-full md:w-56 font-mono text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
          placeholder="args (e.g., alice)"
          value={args}
          onChange={(e) => setArgs(e.target.value)}
        />
      )}
      <button
        onClick={copy}
        className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm hover:opacity-90"
        title="Copy"
      >
        Copy
      </button>
    </div>
  );
};

function isValidIPv4(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^(\d|\d\d|1\d\d|2[0-4]\d|25[0-5])$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function toPortTuple(ip, port) {
  const [h1, h2, h3, h4] = ip.split(".");
  const p1 = Math.floor(port / 256);
  const p2 = port % 256;
  return `${h1},${h2},${h3},${h4},${p1},${p2}`;
}

function parseTuple(tupleLike) {
  // Accept "h1,h2,h3,h4,p1,p2" or any string containing that (e.g., 227 response)
  const m = tupleLike.match(/(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3})/);
  if (!m) return null;
  const [, a, b, c, d, p1s, p2s] = m;
  const octets = [a, b, c, d].map(Number);
  if (octets.some((n) => n < 0 || n > 255)) return null;
  const p1 = Number(p1s), p2 = Number(p2s);
  if (p1 < 0 || p1 > 255 || p2 < 0 || p2 > 255) return null;
  const port = p1 * 256 + p2;
  return { ip: `${octets.join(".")}`, port, p1, p2 };
}

export default function FTPReference() {
  // PORT builder state
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");

  const portNum = useMemo(() => {
    if (!/^[0-9]+$/.test(port)) return NaN;
    const n = Number(port);
    return n >= 1 && n <= 65535 ? n : NaN;
  }, [port]);

  const portValid = isValidIPv4(ip) && !Number.isNaN(portNum);
  const tuple = useMemo(() => (portValid ? toPortTuple(ip, portNum) : ""), [ip, portNum, portValid]);
  const portCmd = tuple ? `PORT ${tuple}` : "";
  const eprtCmd = portValid ? `EPRT |1|${ip}|${portNum}|` : ""; // IPv4 only for simplicity

  // Reverse parsers
  const [pasv, setPasv] = useState("");
  const parsedPasv = useMemo(() => parseTuple(pasv), [pasv]);

  const [portTupleInput, setPortTupleInput] = useState("");
  const parsedPortTuple = useMemo(() => parseTuple(portTupleInput), [portTupleInput]);

  const quickCommands = [
    { label: "Username", template: "USER {args}" },
    { label: "Password", template: "PASS {args}" },
    { label: "System type", template: "SYST" },
    { label: "Features", template: "FEAT" },
    { label: "Print working dir", template: "PWD" },
    { label: "Binary mode", template: "TYPE I" },
    { label: "ASCII mode", template: "TYPE A" },
    { label: "List (simple)", template: "LIST" },
    { label: "List (detailed)", template: "LIST -al" },
    { label: "Change dir", template: "CWD {args}" },
    { label: "Make dir", template: "MKD {args}" },
    { label: "Remove dir", template: "RMD {args}" },
    { label: "Delete file", template: "DELE {args}" },
    { label: "Rename from", template: "RNFR {args}" },
    { label: "Rename to", template: "RNTO {args}" },
    { label: "Retrieve file → client", template: "RETR {args}" },
    { label: "Store file → server", template: "STOR {args}" },
    { label: "Quit", template: "QUIT" },
  ];

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      alert("Clipboard copy failed. Select and copy manually.\n\n" + text);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">FTP Command Reference & Calculators</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
            Quick-copy common FTP commands, plus helpers for <span className="font-mono">PORT</span> (active) and <span className="font-mono">PASV</span> (passive) data connections.
          </p>
        </header>

        {/* PORT builder */}
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xl font-medium">PORT command builder (active mode)</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">Most useful</span>
          </div>
          <div className="grid md:grid-cols-4 gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/50 shadow-sm">
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-sm">Your IPv4 address</label>
              <input
                className="font-mono px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
                placeholder="e.g., 192.168.1.50"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </div>
            <div className="md:col-span-1 flex flex-col gap-2">
              <label className="text-sm">Client data port</label>
              <input
                className="font-mono px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
                placeholder="e.g., 52163"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <p className="text-xs text-gray-500">Range 1–65535. Avoid privileged & blocked ports; ensure firewall/NAT allows inbound from server.</p>
            </div>
            <div className="md:col-span-4 flex flex-col gap-2">
              <label className="text-sm">Result</label>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 font-mono text-sm md:text-base px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 select-all">
                  {portCmd || <span className="text-gray-400">PORT h1,h2,h3,h4,p1,p2</span>}
                </div>
                <button
                  onClick={() => copyText(portCmd)}
                  disabled={!portCmd}
                  className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-40"
                >
                  Copy PORT
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 font-mono text-sm md:text-base px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 select-all">
                  {eprtCmd || <span className="text-gray-400">EPRT |1|192.168.1.50|52163|</span>}
                </div>
                <button
                  onClick={() => copyText(eprtCmd)}
                  disabled={!eprtCmd}
                  className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-40"
                >
                  Copy EPRT
                </button>
              </div>
              {portValid && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tuple: <span className="font-mono">{tuple}</span> (p1={Math.floor(portNum/256)}, p2={portNum%256})
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            The <span className="font-mono">PORT</span> command tells the server to connect back to your client at <span className="font-mono">IP:port</span> for the data channel.
            The 6-tuple encodes the port as <span className="font-mono">p1*256 + p2</span>.
          </p>
        </section>

        {/* PASV parser */}
        <section className="mb-10">
          <h2 className="text-xl font-medium mb-3">PASV / 227 response parser (passive mode)</h2>
          <div className="grid md:grid-cols-2 gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/50 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Paste 227 response or tuple</label>
              <textarea
                className="min-h-[84px] font-mono px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
                placeholder="227 Entering Passive Mode (93,184,216,34,195,44)."
                value={pasv}
                onChange={(e) => setPasv(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Parsed result</label>
              <div className="font-mono px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 min-h-[84px]">
                {parsedPasv ? (
                  <div>
                    <div>IP: {parsedPasv.ip}</div>
                    <div>Port: {parsedPasv.port} (p1={parsedPasv.p1}, p2={parsedPasv.p2})</div>
                  </div>
                ) : (
                  <span className="text-gray-400">IP: —  Port: —</span>
                )}
              </div>
              {parsedPasv && (
                <div className="flex gap-2">
                  <button
                    onClick={() => copyText(`${parsedPasv.ip}:${parsedPasv.port}`)}
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm"
                  >
                    Copy IP:Port
                  </button>
                  <button
                    onClick={() => copyText(`PORT ${parsedPasv.ip.replaceAll('.', ',')},${Math.floor(parsedPasv.port/256)},${parsedPasv.port%256}`)}
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm"
                  >
                    Copy as PORT
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">In passive mode, the server replies with where the client should connect for data. The tuple maps to <span className="font-mono">IP</span> and <span className="font-mono">p1*256+p2</span>.</p>
        </section>

        {/* Reverse PORT tuple parser */}
        <section className="mb-10">
          <h2 className="text-xl font-medium mb-3">Reverse PORT tuple parser</h2>
          <div className="grid md:grid-cols-2 gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/50 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Paste a PORT line or tuple</label>
              <input
                className="font-mono px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
                placeholder="PORT 192,168,1,50,203,211 or 192,168,1,50,203,211"
                value={portTupleInput}
                onChange={(e) => setPortTupleInput(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Parsed result</label>
              <div className="font-mono px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700">
                {parsedPortTuple ? (
                  <div>
                    <div>IP: {parsedPortTuple.ip}</div>
                    <div>Port: {parsedPortTuple.port} (p1={parsedPortTuple.p1}, p2={parsedPortTuple.p2})</div>
                  </div>
                ) : (
                  <span className="text-gray-400">IP: —  Port: —</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick reference */}
        <section className="mb-10">
          <h2 className="text-xl font-medium mb-3">Quick-copy command reference</h2>
          <div className="grid gap-3">
            {quickCommands.map((c, i) => (
              <CommandRow key={i} label={c.label} template={c.template} />
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-2">Tips</h2>
          <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li><span className="font-mono">PORT</span> = Active mode (server connects back to you). Ensure your IP is routable to the server and inbound rules/NAT allow the chosen port.</li>
            <li><span className="font-mono">PASV</span> = Passive mode (you connect to server-provided IP:port via 227 response).</li>
            <li>Port math: <span className="font-mono">port = p1*256 + p2</span>. Example: p1=203, p2=211 → 203*256 + 211 = 52139.</li>
            <li>Use <span className="font-mono">TYPE I</span> for binary transfers to avoid newline conversions.</li>
            <li>For IPv6 or NAT edge cases, extended commands <span className="font-mono">EPRT</span> / <span className="font-mono">EPSV</span> are usually safer.</li>
          </ul>
        </section>

        <footer className="text-xs text-gray-500">Built as a single-file React component. No data leaves your browser.</footer>
      </div>
    </div>
  );
}
