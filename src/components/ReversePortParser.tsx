import React, { useState, useEffect } from 'react';
import { parseTuple } from '../utils';
import StatusIndicator from './StatusIndicator';

const ReversePortParser: React.FC = () => {
  const [portTupleInput, setPortTupleInput] = useState('');
  const [parsed, setParsed] = useState<{ ip: string; port: number; p1: number; p2: number } | null>(null);

  useEffect(() => {
    const result = parseTuple(portTupleInput);
    setParsed(result);
  }, [portTupleInput]);

  const handleClear = () => {
    setPortTupleInput('');
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>Reverse PORT tuple parser</h2>
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
            <label style={{ flex: 1 }}>Paste a PORT line or tuple</label>
            {portTupleInput && <StatusIndicator isValid={!!parsed} size="small" />}
          </div>
          <input
            value={portTupleInput}
            onChange={(e) => setPortTupleInput(e.target.value)}
            placeholder="PORT 192,168,1,50,203,211 or 192,168,1,50,203,211"
          />
        </div>
        <div>
          <label>Parsed result</label>
          <div className="result mono">
            {parsed ? 
              `IP: ${parsed.ip}  Port: ${parsed.port} (p1=${parsed.p1}, p2=${parsed.p2})` : 
              'IP: —  Port: —'
            }
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReversePortParser;