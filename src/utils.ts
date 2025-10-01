export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => /^(\d|\d\d|1\d\d|2[0-4]\d|25[0-5])$/.test(p) && +p >= 0 && +p <= 255);
}

export function isValidIPv6(ip: string): boolean {
  // Remove brackets if present
  const cleanIP = ip.replace(/^\[|\]$/g, '');
  
  // Basic IPv6 regex pattern
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
  
  // Handle compressed notation (::)
  if (cleanIP.includes('::')) {
    const parts = cleanIP.split('::');
    if (parts.length > 2) return false;
    
    const leftParts = parts[0] ? parts[0].split(':').filter(p => p) : [];
    const rightParts = parts[1] ? parts[1].split(':').filter(p => p) : [];
    
    if (leftParts.length + rightParts.length >= 8) return false;
    
    return [...leftParts, ...rightParts].every(part => 
      part === '' || /^[0-9a-fA-F]{1,4}$/.test(part)
    );
  }
  
  // Handle full notation
  const parts = cleanIP.split(':');
  return parts.length === 8 && parts.every(part => /^[0-9a-fA-F]{1,4}$/.test(part));
}

export function isValidIP(ip: string): { valid: boolean; type: 'ipv4' | 'ipv6' | null } {
  if (isValidIPv4(ip)) return { valid: true, type: 'ipv4' };
  if (isValidIPv6(ip)) return { valid: true, type: 'ipv6' };
  return { valid: false, type: null };
}

export function toPortTuple(ip: string, port: number): { tuple: string; p1: number; p2: number } {
  const [h1, h2, h3, h4] = ip.split('.');
  const p1 = Math.floor(port / 256);
  const p2 = port % 256;
  return { tuple: `${h1},${h2},${h3},${h4},${p1},${p2}`, p1, p2 };
}

export function toEPRTCommand(ip: string, port: number): string {
  const ipInfo = isValidIP(ip);
  if (!ipInfo.valid) return '';
  
  if (ipInfo.type === 'ipv4') {
    return `EPRT |1|${ip}|${port}|`;
  } else {
    // IPv6 - use protocol 2
    const cleanIP = ip.replace(/^\[|\]$/g, '');
    return `EPRT |2|${cleanIP}|${port}|`;
  }
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