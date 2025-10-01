import React, { useState, useEffect } from 'react';
import { parseTuple, copyText } from '../utils';

const PasvParser: React.FC = () => {
  const [pasvInput, setPasvInput] = useState('');
  const [parsed, setParsed] = useState<{ ip: string; port: number; p1: number; p2: number } | null>(null);

  useEffect(() => {
    const result = parseTuple(pasvInput);
    setParsed(result);
  }, [pasvInput]);

  const handleCopyIPPort = () => {
    if (parsed) {
      copyText(`${parsed.ip}:${parsed.port}`);
    }
  };

  const handleCopyAsPORT = () => {
    if (parsed) {
      const portLine = `PORT ${parsed.ip.replace(/\./g, ',')},${Math.floor(parsed.port / 256)},${parsed.port % 256}`;
      copyText(portLine);
    }
  };

  return (
    <section>
      <h2>PASV / 227 response parser (passive mode)</h2>
      <div className="card grid grid-2">
        <div>
          <label>Paste 227 response or tuple</label>
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
            >
              Copy IP:Port
            </button>
            <button
              className="btn"
              disabled={!parsed}
              onClick={handleCopyAsPORT}
            >
              Copy as PORT
            </button>
          </div>
        </div>
      </div>
      <p className="small muted">In passive mode the server provides the address for the data connection.</p>
    </section>
  );
};

export default PasvParser;