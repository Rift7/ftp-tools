import React, { useState, useEffect } from 'react';
import { isValidIPv4, toPortTuple, copyText } from '../utils';

const PortBuilder: React.FC = () => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [portCmd, setPortCmd] = useState('PORT h1,h2,h3,h4,p1,p2');
  const [eprtCmd, setEprtCmd] = useState('EPRT |1|192.168.1.50|52163|');
  const [tupleLine, setTupleLine] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const portNum = /^\d+$/.test(port.trim()) ? +port.trim() : NaN;
    const ok = isValidIPv4(ip) && portNum >= 1 && portNum <= 65535;

    if (ok) {
      const { tuple, p1, p2 } = toPortTuple(ip, portNum);
      const portCommand = `PORT ${tuple}`;
      const eprtCommand = `EPRT |1|${ip}|${portNum}|`;
      setPortCmd(portCommand);
      setEprtCmd(eprtCommand);
      setTupleLine(`Tuple: ${tuple}  (p1=${p1}, p2=${p2})`);
      setIsValid(true);
    } else {
      setPortCmd('PORT h1,h2,h3,h4,p1,p2');
      setEprtCmd('EPRT |1|192.168.1.50|52163|');
      setTupleLine('');
      setIsValid(false);
    }
  }, [ip, port]);

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPort(value);
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>PORT command builder (active mode)</h2>
        <span className="tag">Most useful</span>
      </div>
      <div className="card">
        <div className="grid grid-4">
          <div className="grid-item">
            <label>Your IPv4 address</label>
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g., 192.168.1.50"
              autoComplete="off"
            />
          </div>
          <div className="grid-item">
            <label>Client data port</label>
            <input
              value={port}
              onChange={handlePortChange}
              placeholder="e.g., 52163"
              autoComplete="off"
            />
            <p className="small">Range 1–65535. Ensure inbound rules/NAT permit the port.</p>
          </div>
        </div>
        <div className="grid" style={{ marginTop: '8px' }}>
          <div className="row">
            <div className={`result mono grow copyable ${!isValid ? 'muted' : ''}`}>
              {portCmd}
            </div>
            <button
              className="btn"
              disabled={!isValid}
              onClick={() => copyText(portCmd)}
            >
              Copy PORT
            </button>
          </div>
          <div className="row">
            <div className={`result mono grow copyable ${!isValid ? 'muted' : ''}`}>
              {eprtCmd}
            </div>
            <button
              className="btn"
              disabled={!isValid}
              onClick={() => copyText(eprtCmd)}
            >
              Copy EPRT
            </button>
          </div>
          <div className="muted small" aria-live="polite">
            {tupleLine}
          </div>
        </div>
      </div>
      <p className="small muted">The 6‑tuple encodes port as <span className="mono">p1*256 + p2</span>.</p>
    </section>
  );
};

export default PortBuilder;