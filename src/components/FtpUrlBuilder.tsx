import React, { useState, useEffect } from 'react';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { isValidIP } from '../utils';
import StatusIndicator from './StatusIndicator';

const FtpUrlBuilder: React.FC = () => {
  const [protocol, setProtocol] = useState<'ftp' | 'ftps' | 'sftp'>('ftp');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('');
  const [path, setPath] = useState('');
  const [mode, setMode] = useState<'active' | 'passive'>('passive');
  const [includeCredentials, setIncludeCredentials] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [ftpUrl, setFtpUrl] = useState('');
  const [ftpCommand, setFtpCommand] = useState('');
  const [curlCommand, setCurlCommand] = useState('');
  const [wgetCommand, setWgetCommand] = useState('');
  
  const [isValidConfig, setIsValidConfig] = useState(false);
  const [ipType, setIpType] = useState<'ipv4' | 'ipv6' | null>(null);
  const { copyWithFeedback, isCopied } = useCopyFeedback();

  useEffect(() => {
    const ipInfo = isValidIP(hostname);
    const validHostname = /^[a-zA-Z0-9.-]+$/.test(hostname) || ipInfo.valid;
    const validPort = !port || (parseInt(port) >= 1 && parseInt(port) <= 65535);
    const hasRequiredFields = hostname.trim() !== '';
    
    setIpType(ipInfo.type);
    setIsValidConfig(validHostname && validPort && hasRequiredFields);

    if (hasRequiredFields && validHostname && validPort) {
      // Determine default port
      const defaultPorts = { ftp: 21, ftps: 990, sftp: 22 };
      const actualPort = port || defaultPorts[protocol].toString();
      
      // Build URL
      let url = `${protocol}://`;
      
      if (includeCredentials && username) {
        url += encodeURIComponent(username);
        if (password) {
          url += ':' + encodeURIComponent(password);
        }
        url += '@';
      }
      
      // Handle IPv6 addresses - wrap in brackets
      if (ipType === 'ipv6') {
        const cleanIP = hostname.replace(/^\[|\]$/g, '');
        url += `[${cleanIP}]`;
      } else {
        url += hostname;
      }
      
      if (port && port !== defaultPorts[protocol].toString()) {
        url += ':' + port;
      }
      
      if (path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        url += cleanPath;
      }
      
      setFtpUrl(url);

      // Build command-line examples
      let ftpCmd = '';
      if (protocol === 'ftp') {
        ftpCmd = `ftp ${hostname}`;
        if (port && port !== '21') {
          ftpCmd += ` ${port}`;
        }
        if (username) {
          ftpCmd += `\n# Login with: ${username}`;
          if (password) {
            ftpCmd += ` / ${password}`;
          }
        }
        if (path) {
          ftpCmd += `\n# Navigate to: ${path}`;
        }
        if (mode === 'passive') {
          ftpCmd += `\n# Set passive mode: quote PASV`;
        }
      } else if (protocol === 'sftp') {
        ftpCmd = `sftp`;
        if (port && port !== '22') {
          ftpCmd += ` -P ${port}`;
        }
        const hostForCommand = ipType === 'ipv6' ? `[${hostname.replace(/^\[|\]$/g, '')}]` : hostname;
        if (username) {
          ftpCmd += ` ${username}@${hostForCommand}`;
        } else {
          ftpCmd += ` ${hostForCommand}`;
        }
        if (path) {
          ftpCmd += `\n# Navigate to: cd ${path}`;
        }
      }
      setFtpCommand(ftpCmd);

      // Build curl command
      let curlCmd = `curl`;
      if (protocol === 'ftp' && mode === 'active') {
        curlCmd += ` --ftp-port -`;
      } else if (protocol === 'ftp' && mode === 'passive') {
        curlCmd += ` --ftp-pasv`;
      }
      
      if (username && password && includeCredentials) {
        curlCmd += ` -u "${username}:${password}"`;
      } else if (username && includeCredentials) {
        curlCmd += ` -u "${username}"`;
      }
      
      // Build URL without credentials for curl
      let urlForCurl = `${protocol}://`;
      if (ipType === 'ipv6') {
        const cleanIP = hostname.replace(/^\[|\]$/g, '');
        urlForCurl += `[${cleanIP}]`;
      } else {
        urlForCurl += hostname;
      }
      if (port && port !== defaultPorts[protocol].toString()) {
        urlForCurl += ':' + port;
      }
      if (path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        urlForCurl += cleanPath;
      }
      
      curlCmd += ` "${urlForCurl}"`;
      setCurlCommand(curlCmd);

      // Build wget command
      let wgetCmd = '';
      if (protocol === 'ftp') {
        wgetCmd = `wget`;
        if (mode === 'passive') {
          wgetCmd += ` --passive-ftp`;
        } else {
          wgetCmd += ` --no-passive-ftp`;
        }
        
        if (username && includeCredentials) {
          wgetCmd += ` --ftp-user="${username}"`;
          if (password) {
            wgetCmd += ` --ftp-password="${password}"`;
          }
        }
        
        // Build URL without credentials for wget
        let urlForWget = `ftp://`;
        if (ipType === 'ipv6') {
          const cleanIP = hostname.replace(/^\[|\]$/g, '');
          urlForWget += `[${cleanIP}]`;
        } else {
          urlForWget += hostname;
        }
        if (port && port !== '21') {
          urlForWget += ':' + port;
        }
        if (path) {
          const cleanPath = path.startsWith('/') ? path : '/' + path;
          urlForWget += cleanPath;
        }
        
        wgetCmd += ` "${urlForWget}"`;
      }
      setWgetCommand(wgetCmd);
    }
  }, [protocol, username, password, hostname, port, path, mode, includeCredentials]);

  const handleClear = () => {
    setUsername('');
    setPassword('');
    setHostname('');
    setPort('');
    setPath('');
    setProtocol('ftp');
    setMode('passive');
    setIncludeCredentials(true);
  };

  const getDefaultPort = () => {
    const defaults = { ftp: '21', ftps: '990', sftp: '22' };
    return defaults[protocol];
  };

  return (
    <section>
      <div className="row" style={{ marginBottom: '6px', alignItems: 'baseline' }}>
        <h2>FTP URL Builder</h2>
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
            <label>Protocol</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as 'ftp' | 'ftps' | 'sftp')}
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
              <option value="ftp">FTP (Plain)</option>
              <option value="ftps">FTPS (SSL/TLS)</option>
              <option value="sftp">SFTP (SSH)</option>
            </select>
          </div>
          
          <div>
            <label>Username (optional)</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="anonymous, user123"
              autoComplete="off"
            />
          </div>
          
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Password (optional)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '0'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              autoComplete="off"
            />
          </div>
          
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Hostname/IP</label>
              {hostname && <StatusIndicator isValid={/^[a-zA-Z0-9.-]+$/.test(hostname) || isValidIP(hostname).valid} size="small" />}
              {ipType && (
                <span className="tag" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  {ipType.toUpperCase()}
                </span>
              )}
            </div>
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="ftp.example.com, 192.168.1.10, [2001:db8::1]"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-4" style={{ marginTop: '12px' }}>
          <div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <label style={{ flex: 1 }}>Port (optional)</label>
              {port && <StatusIndicator isValid={parseInt(port) >= 1 && parseInt(port) <= 65535} size="small" />}
            </div>
            <input
              value={port}
              onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={`${getDefaultPort()} (default)`}
              autoComplete="off"
            />
          </div>
          
          <div>
            <label>Path (optional)</label>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/pub/files, /home/user"
              autoComplete="off"
            />
          </div>
          
          {protocol === 'ftp' && (
            <div>
              <label>Transfer Mode</label>
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
          )}
          
          <div>
            <label className="row" style={{ cursor: 'pointer', gap: '8px', alignItems: 'center', marginTop: '24px' }}>
              <input
                type="checkbox"
                checked={includeCredentials}
                onChange={(e) => setIncludeCredentials(e.target.checked)}
              />
              <span>Include credentials in URL</span>
            </label>
          </div>
        </div>
      </div>

      {isValidConfig && (
        <>
          {/* Generated URL */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Generated URL</h3>
              <button
                className="btn"
                onClick={() => copyWithFeedback(ftpUrl, 'ftp-url')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('ftp-url') ? '#10b981' : undefined
                }}
              >
                {isCopied('ftp-url') ? '✓ Copied!' : 'Copy URL'}
              </button>
            </div>
            <div className="result mono copyable" style={{ wordBreak: 'break-all' }}>
              {ftpUrl}
            </div>
          </div>

          {/* Command Line Examples */}
          {ftpCommand && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                  {protocol === 'sftp' ? 'SFTP' : 'FTP'} Command
                </h3>
                <button
                  className="btn"
                  onClick={() => copyWithFeedback(ftpCommand, 'ftp-command')}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '4px 8px',
                    backgroundColor: isCopied('ftp-command') ? '#10b981' : undefined
                  }}
                >
                  {isCopied('ftp-command') ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                {ftpCommand}
              </div>
            </div>
          )}

          {/* cURL Command */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>cURL Command</h3>
              <button
                className="btn"
                onClick={() => copyWithFeedback(curlCommand, 'curl-command')}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px',
                  backgroundColor: isCopied('curl-command') ? '#10b981' : undefined
                }}
              >
                {isCopied('curl-command') ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {curlCommand}
            </div>
          </div>

          {/* wget Command */}
          {protocol === 'ftp' && wgetCommand && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="row" style={{ marginBottom: '12px', alignItems: 'baseline' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>wget Command</h3>
                <button
                  className="btn"
                  onClick={() => copyWithFeedback(wgetCommand, 'wget-command')}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '4px 8px',
                    backgroundColor: isCopied('wget-command') ? '#10b981' : undefined
                  }}
                >
                  {isCopied('wget-command') ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {wgetCommand}
              </div>
            </div>
          )}
        </>
      )}

      <p className="small muted" style={{ marginTop: '12px' }}>
        <strong>Security Note:</strong> Avoid including passwords in URLs when possible. Use key-based authentication for SFTP. 
        URLs with credentials may be logged in browser history and server logs.
        <br />
        <strong>IPv6 Support:</strong> IPv6 addresses are automatically wrapped in brackets for URL compatibility. 
        Both IPv4 and IPv6 addresses are supported across all protocols.
      </p>
    </section>
  );
};

export default FtpUrlBuilder;