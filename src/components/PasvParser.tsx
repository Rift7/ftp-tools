import React, { useState, useEffect } from 'react';
import { parseTuple } from '../utils';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import StatusIndicator from './StatusIndicator';

const PasvParser: React.FC = () => {
  const [pasvInput, setPasvInput] = useState('');
  const [parsed, setParsed] = useState<{ ip: string; port: number; p1: number; p2: number } | null>(null);
  const { copyWithFeedback, isCopied } = useCopyFeedback();

  useEffect(() => {
    const result = parseTuple(pasvInput);
    setParsed(result);
  }, [pasvInput]);

  const handleCopyIPPort = () => {
    if (parsed) {
      copyWithFeedback(`${parsed.ip}:${parsed.port}`, 'pasv-ip-port');
    }
  };

  const handleCopyAsPORT = () => {
    if (parsed) {
      const portLine = `PORT ${parsed.ip.replace(/\./g, ',')},${Math.floor(parsed.port / 256)},${parsed.port % 256}`;
      copyWithFeedback(portLine, 'pasv-as-port');
    }
  };

  const handleClear = () => {
    setPasvInput('');
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>PASV / 227 response parser (passive mode)</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            className="btn" 
            onClick={handleClear}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="card grid grid-2">
        <div>
          <div className="row" style={{ alignItems: 'baseline' }}>
            <label style={{ flex: 1 }}>Paste 227 response or tuple</label>
            {pasvInput && <StatusIndicator isValid={!!parsed} size="small" />}
          </div>
          <textarea
            value={pasvInput}
            onChange={(e) => setPasvInput(e.target.value)}
            placeholder="227 Entering Passive Mode (93,184,216,34,195,44)."
          />
        </div>
        <div>
          <label>Parsed result</label>
          <div className="result mono" style={{ minHeight: '92px' }}>
            {parsed ? 
              `IP: ${parsed.ip}  Port: ${parsed.port} (p1=${parsed.p1}, p2=${parsed.p2})` : 
              'IP: —  Port: —'
            }
          </div>
          <div className="row" style={{ marginTop: '8px' }}>
            <button
              className="btn"
              disabled={!parsed}
              onClick={handleCopyIPPort}
              style={{ backgroundColor: isCopied('pasv-ip-port') ? '#10b981' : undefined }}
            >
              {isCopied('pasv-ip-port') ? '✓ Copied!' : 'Copy IP:Port'}
            </button>
            <button
              className="btn"
              disabled={!parsed}
              onClick={handleCopyAsPORT}
              style={{ backgroundColor: isCopied('pasv-as-port') ? '#10b981' : undefined }}
            >
              {isCopied('pasv-as-port') ? '✓ Copied!' : 'Copy as PORT'}
            </button>
          </div>
        </div>
      </div>
      <p className="small muted">In passive mode the server provides the address for the data connection.</p>
    </section>
  );
};

export default PasvParser;