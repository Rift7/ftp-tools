export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => /^(\d|\d\d|1\d\d|2[0-4]\d|25[0-5])$/.test(p) && +p >= 0 && +p <= 255);
}

export function toPortTuple(ip: string, port: number): { tuple: string; p1: number; p2: number } {
  const [h1, h2, h3, h4] = ip.split('.');
  const p1 = Math.floor(port / 256);
  const p2 = port % 256;
  return { tuple: `${h1},${h2},${h3},${h4},${p1},${p2}`, p1, p2 };
}

export function parseTuple(str: string): { ip: string; port: number; p1: number; p2: number } | null {
  if (!str) return null;
  const m = String(str).match(/(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3})/);
  if (!m) return null;
  const [, a, b, c, d, p1s, p2s] = m;
  const oct = [a, b, c, d].map(Number);
  if (oct.some(n => n < 0 || n > 255)) return null;
  const p1 = +p1s;
  const p2 = +p2s;
  if (p1 < 0 || p1 > 255 || p2 < 0 || p2 > 255) return null;
  return { ip: `${oct.join('.')}`, port: p1 * 256 + p2, p1, p2 };
}

export async function copyText(txt: string): Promise<void> {
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
  } catch (e) {
    alert('Clipboard copy failed. Select and copy manually.\n\n' + txt);
  }
}