import React, { useState, useEffect } from 'react';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { isValidIP } from '../utils';
import StatusIndicator from './StatusIndicator';

interface FirewallRule {
  iptables: string[];
  ip6tables: string[];
  windowsFirewall: string[];
  ufw: string[];
}

const FirewallRuleGenerator: React.FC = () => {
  const [serverIP, setServerIP] = useState('');
  const [portStart, setPortStart] = useState('21000');
  const [portEnd, setPortEnd] = useState('21100');
  const [mode, setMode] = useState<'active' | 'passive'>('passive');
  const [direction, setDirection] = useState<'inbound' | 'outbound' | 'both'>('both');
  
  const [rules, setRules] = useState<FirewallRule>({
    iptables: [],
    ip6tables: [],
    windowsFirewall: [],
    ufw: []
  });
  
  const [ipType, setIpType] = useState<'ipv4' | 'ipv6' | null>(null);
  
  const [isValidConfig, setIsValidConfig] = useState(false);
  const { copyWithFeedback, isCopied } = useCopyFeedback();

  useEffect(() => {
    const portStartNum = parseInt(portStart);
    const portEndNum = parseInt(portEnd);
    const validPorts = portStartNum >= 1 && portStartNum <= 65535 && 
                      portEndNum >= 1 && portEndNum <= 65535 && 
                      portStartNum <= portEndNum;
    
    const ipInfo = serverIP ? isValidIP(serverIP) : { valid: true, type: null };
    setIpType(ipInfo.type);
    setIsValidConfig(validPorts && ipInfo.valid);

    if (validPorts && ipInfo.valid) {
      const portRange = portStart === portEnd ? portStart : `${portStart}:${portEnd}`;
      
      // Generate iptables rules (IPv4)
      const iptablesRules = [];
      const ip6tablesRules = [];
      
      // Helper function to generate rules for a specific IP version
      const generateRules = (cmd: string, isIPv6: boolean = false) => {
        const rules = [];
        
        // Control connection (port 21)
        if (direction === 'inbound' || direction === 'both') {
          rules.push(`${cmd} -A INPUT -p tcp --dport 21 -j ACCEPT`);
        }
        if (direction === 'outbound' || direction === 'both') {
          rules.push(`${cmd} -A OUTPUT -p tcp --sport 21 -j ACCEPT`);
        }
        
        // Data connections
        if (mode === 'passive') {
          if (direction === 'inbound' || direction === 'both') {
            let sourceFilter = '';
            if (serverIP) {
              if (ipInfo.type === 'ipv4' && !isIPv6) {
                sourceFilter = ` -s ${serverIP}`;
              } else if (ipInfo.type === 'ipv6' && isIPv6) {
                const cleanIP = serverIP.replace(/^\[|\]$/g, '');
                sourceFilter = ` -s ${cleanIP}`;
              }
            }
            rules.push(`${cmd} -A INPUT -p tcp --dport ${portRange}${sourceFilter} -j ACCEPT`);
          }
          if (direction === 'outbound' || direction === 'both') {
            rules.push(`${cmd} -A OUTPUT -p tcp --sport ${portRange} -j ACCEPT`);
          }
        } else {
          // Active mode
          if (direction === 'outbound' || direction === 'both') {
            rules.push(`${cmd} -A OUTPUT -p tcp --dport 20 -j ACCEPT`);
            rules.push(`${cmd} -A OUTPUT -p tcp --sport ${portRange} -j ACCEPT`);
          }
          if (direction === 'inbound' || direction === 'both') {
            rules.push(`${cmd} -A INPUT -p tcp --sport 20 -j ACCEPT`);
            let sourceFilter = '';
            if (serverIP) {
              if (ipInfo.type === 'ipv4' && !isIPv6) {
                sourceFilter = ` -s ${serverIP}`;
              } else if (ipInfo.type === 'ipv6' && isIPv6) {
                const cleanIP = serverIP.replace(/^\[|\]$/g, '');
                sourceFilter = ` -s ${cleanIP}`;
              }
            }
            rules.push(`${cmd} -A INPUT -p tcp --dport ${portRange}${sourceFilter} -j ACCEPT`);
          }
        }
        
        return rules;
      };
      
      // Generate rules for both IPv4 and IPv6
      iptablesRules.push(...generateRules('iptables', false));
      ip6tablesRules.push(...generateRules('ip6tables', true));

      // Generate Windows Firewall rules
      const windowsRules = [];
      const ruleName = mode === 'passive' ? 'FTP-Passive' : 'FTP-Active';
      const ipVersion = ipInfo.type ? `-${ipInfo.type}` : '';
      
      // Control connection
      windowsRules.push(`netsh advfirewall firewall add rule name="FTP-Control${ipVersion}" dir=in action=allow protocol=TCP localport=21`);
      
      if (mode === 'passive') {
        windowsRules.push(`netsh advfirewall firewall add rule name="${ruleName}-Data${ipVersion}" dir=in action=allow protocol=TCP localport=${portRange}`);
        if (serverIP) {
          const cleanIP = ipInfo.type === 'ipv6' ? serverIP.replace(/^\[|\]$/g, '') : serverIP;
          windowsRules.push(`netsh advfirewall firewall add rule name="${ruleName}-Data-Specific${ipVersion}" dir=in action=allow protocol=TCP localport=${portRange} remoteip=${cleanIP}`);
        }
      } else {
        windowsRules.push(`netsh advfirewall firewall add rule name="${ruleName}-Data-Out${ipVersion}" dir=out action=allow protocol=TCP remoteport=20`);
        windowsRules.push(`netsh advfirewall firewall add rule name="${ruleName}-Data-In${ipVersion}" dir=in action=allow protocol=TCP localport=${portRange}`);
      }

      // Generate UFW rules (Ubuntu Firewall)
      const ufwRules = [];
      ufwRules.push(`ufw allow 21/tcp`);
      
      if (mode === 'passive') {
        if (portStart === portEnd) {
          ufwRules.push(`ufw allow ${portStart}/tcp`);
        } else {
          ufwRules.push(`ufw allow ${portStart}:${portEnd}/tcp`);
        }
        if (serverIP) {
          const cleanIP = ipInfo.type === 'ipv6' ? serverIP.replace(/^\[|\]$/g, '') : serverIP;
          ufwRules.push(`ufw allow from ${cleanIP} to any port ${portRange} proto tcp`);
        }
      } else {
        ufwRules.push(`ufw allow out 20/tcp`);
        ufwRules.push(`ufw allow ${portRange}/tcp`);
      }

      setRules({
        iptables: iptablesRules,
        ip6tables: ip6tablesRules,
        windowsFirewall: windowsRules,
        ufw: ufwRules
      });
    }
  }, [serverIP, portStart, portEnd, mode, direction]);

  const handleClear = () => {
    setServerIP('');
    setPortStart('21000');
    setPortEnd('21100');
    setMode('passive');
    setDirection('both');
  };

  const copyAllRules = (ruleType: keyof FirewallRule) => {
    const allRules = rules[ruleType].join('\n');
    copyWithFeedback(allRules, `firewall-${ruleType}`);
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>Firewall Rule Generator</h2>
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
      
      <div className="card">
        <div className="grid grid-4">
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Server IP (optional)</label>
              {serverIP && <StatusIndicator isValid={isValidIP(serverIP).valid} size="small" />}
              {ipType && (
                <span className="tag" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  {ipType.toUpperCase()}
                </span>
              )}
            </div>
            <input
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              placeholder="192.168.1.10 or 2001:db8::1 (leave empty for any)"
              autoComplete="off"
            />
          </div>
          
          <div>
            <label>FTP Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'active' | 'passive')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontFamily: 'inherit'
              }}
            >
              <option value="passive">Passive (PASV)</option>
              <option value="active">Active (PORT)</option>
            </select>
          </div>
          
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Port Start</label>
              {portStart && <StatusIndicator isValid={parseInt(portStart) >= 1 && parseInt(portStart) <= 65535} size="small" />}
            </div>
            <input
              value={portStart}
              onChange={(e) => setPortStart(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="21000"
              autoComplete="off"
            />
          </div>
          
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Port End</label>
              {portEnd && <StatusIndicator isValid={parseInt(portEnd) >= 1 && parseInt(portEnd) <= 65535 && parseInt(portEnd) >= parseInt(portStart)} size="small" />}
            </div>
            <input
              value={portEnd}
              onChange={(e) => setPortEnd(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="21100"
              autoComplete="off"
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label>Rule Direction</label>
          <div className="row" style={{ marginTop: '8px', gap: '16px' }}>
            {(['inbound', 'outbound', 'both'] as const).map((dir) => (
              <label key={dir} className="row" style={{ cursor: 'pointer', gap: '4px' }}>
                <input
                  type="radio"
                  name="direction"
                  value={dir}
                  checked={direction === dir}
                  onChange={(e) => setDirection(e.target.value as any)}
                />
                <span style={{ textTransform: 'capitalize' }}>{dir}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {isValidConfig && (
        <>
          {/* iptables Rules */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>iptables (Linux IPv4)</h3>
              <button
                className="btn"
                onClick={() => copyAllRules('iptables')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('firewall-iptables') ? '#10b981' : undefined
                }}
              >
                {isCopied('firewall-iptables') ? '✓ Copied!' : 'Copy All'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {rules.iptables.map((rule, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* ip6tables Rules */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>ip6tables (Linux IPv6)</h3>
              <button
                className="btn"
                onClick={() => copyAllRules('ip6tables')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('firewall-ip6tables') ? '#10b981' : undefined
                }}
              >
                {isCopied('firewall-ip6tables') ? '✓ Copied!' : 'Copy All'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {rules.ip6tables.map((rule, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Windows Firewall Rules */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Windows Firewall</h3>
              <button
                className="btn"
                onClick={() => copyAllRules('windowsFirewall')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('firewall-windowsFirewall') ? '#10b981' : undefined
                }}
              >
                {isCopied('firewall-windowsFirewall') ? '✓ Copied!' : 'Copy All'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {rules.windowsFirewall.map((rule, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* UFW Rules */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>UFW (Ubuntu)</h3>
              <button
                className="btn"
                onClick={() => copyAllRules('ufw')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('firewall-ufw') ? '#10b981' : undefined
                }}
              >
                {isCopied('firewall-ufw') ? '✓ Copied!' : 'Copy All'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {rules.ufw.map((rule, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="small muted" style={{ marginTop: '12px' }}>
        <strong>Note:</strong> Always review generated rules before applying. Passive mode requires server-side port range configuration. 
        Active mode may require NAT/port forwarding configuration.
        <br />
        <strong>IPv6 Support:</strong> ip6tables rules are generated for IPv6 traffic. Use both iptables and ip6tables for dual-stack environments.
      </p>
    </section>
  );
};

export default FirewallRuleGenerator;