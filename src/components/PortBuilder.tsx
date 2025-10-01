import React, { useState, useEffect } from 'react';
import { isValidIPv4, isValidIP, toPortTuple, toEPRTCommand } from '../utils';
import { useRecentValues } from '../hooks/useLocalStorage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import StatusIndicator from './StatusIndicator';

const PortBuilder: React.FC = () => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [portCmd, setPortCmd] = useState('PORT h1,h2,h3,h4,p1,p2');
  const [eprtCmd, setEprtCmd] = useState('EPRT |1|192.168.1.50|52163|');
  const [tupleLine, setTupleLine] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isValidIPState, setIsValidIPState] = useState(false);
  const [isValidPort, setIsValidPort] = useState(false);
  const [ipType, setIpType] = useState<'ipv4' | 'ipv6' | null>(null);
  
  const { recentIPs, recentPorts, addRecentIP, addRecentPort, clearAll } = useRecentValues();
  const { copyWithFeedback, isCopied } = useCopyFeedback();

  useEffect(() => {
    const portNum = /^\d+$/.test(port.trim()) ? +port.trim() : NaN;
    const ipInfo = isValidIP(ip);
    const portValid = portNum >= 1 && portNum <= 65535;
    const ok = ipInfo.valid && portValid;

    setIsValidIPState(ipInfo.valid);
    setIsValidPort(portValid);
    setIsValid(ok);
    setIpType(ipInfo.type);

    if (ok && ipInfo.type) {
      if (ipInfo.type === 'ipv4') {
        const { tuple, p1, p2 } = toPortTuple(ip, portNum);
        const portCommand = `PORT ${tuple}`;
        setPortCmd(portCommand);
        setTupleLine(`Tuple: ${tuple}  (p1=${p1}, p2=${p2})`);
      } else {
        setPortCmd('PORT not supported for IPv6 (use EPRT)');
        setTupleLine('IPv6 addresses use EPRT instead of PORT');
      }
      
      const eprtCommand = toEPRTCommand(ip, portNum);
      setEprtCmd(eprtCommand);
      
      // Save to recent values when valid
      addRecentIP(ip);
      addRecentPort(port);
    } else {
      setPortCmd('PORT h1,h2,h3,h4,p1,p2');
      setEprtCmd('EPRT |1|192.168.1.50|52163|');
      setTupleLine('');
    }
  }, [ip, port, addRecentIP, addRecentPort]);

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPort(value);
  };

  const handleClearAll = () => {
    setIp('');
    setPort('');
  };

  const handleClearAllData = () => {
    handleClearAll();
    clearAll();
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>PORT command builder (active mode)</h2>
        <span className="tag">Most useful</span>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            className="btn" 
            onClick={handleClearAll}
            style={{ fontSize: '0.8rem', padding: '6px 12px', marginRight: '8px' }}
          >
            Clear Fields
          </button>
          <button 
            className="btn" 
            onClick={handleClearAllData}
            style={{ fontSize: '0.8rem', padding: '6px 12px', opacity: 0.7 }}
          >
            Clear All Data
          </button>
        </div>
      </div>
      <div className="card">
        <div className="grid grid-4">
          <div className="grid-item">
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Your IP address (IPv4/IPv6)</label>
              {ip && <StatusIndicator isValid={isValidIPState} size="small" />}
              {ipType && (
                <span className="tag" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  {ipType.toUpperCase()}
                </span>
              )}
            </div>
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.50 or 2001:db8::1"
              autoComplete="off"
              list="recent-ips"
            />
            {recentIPs.length > 0 && (
              <datalist id="recent-ips">
                {recentIPs.map((recentIP, index) => (
                  <option key={index} value={recentIP} />
                ))}
              </datalist>
            )}
          </div>
          <div className="grid-item">
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Client data port</label>
              {port && <StatusIndicator isValid={isValidPort} size="small" />}
            </div>
            <input
              value={port}
              onChange={handlePortChange}
              placeholder="e.g., 52163"
              autoComplete="off"
              list="recent-ports"
            />
            {recentPorts.length > 0 && (
              <datalist id="recent-ports">
                {recentPorts.map((recentPort, index) => (
                  <option key={index} value={recentPort} />
                ))}
              </datalist>
            )}
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
              disabled={!isValid || ipType === 'ipv6'}
              onClick={() => copyWithFeedback(portCmd, 'port-cmd')}
              style={{ backgroundColor: isCopied('port-cmd') ? '#10b981' : undefined }}
              title={ipType === 'ipv6' ? 'PORT command not supported for IPv6. Use EPRT instead.' : ''}
            >
              {isCopied('port-cmd') ? '✓ Copied!' : 'Copy PORT'}
            </button>
          </div>
          <div className="row">
            <div className={`result mono grow copyable ${!isValid ? 'muted' : ''}`}>
              {eprtCmd}
            </div>
            <button
              className="btn"
              disabled={!isValid}
              onClick={() => copyWithFeedback(eprtCmd, 'eprt-cmd')}
              style={{ backgroundColor: isCopied('eprt-cmd') ? '#10b981' : undefined }}
            >
              {isCopied('eprt-cmd') ? '✓ Copied!' : 'Copy EPRT'}
            </button>
          </div>
          <div className="muted small" aria-live="polite">
            {tupleLine}
          </div>
        </div>
      </div>
      <p className="small muted">
        The 6‑tuple encodes port as <span className="mono">p1*256 + p2</span>. 
        <strong>IPv6 support:</strong> EPRT uses |2| for IPv6 addresses. PORT command only works with IPv4.
      </p>
    </section>
  );
};

export default PortBuilder;