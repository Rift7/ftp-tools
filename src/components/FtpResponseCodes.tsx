import React, { useState } from 'react';
import { copyText } from '../utils';

interface ResponseCode {
  code: string;
  description: string;
  category: 'success' | 'intermediate' | 'error' | 'permanent';
}

const responseCodes: ResponseCode[] = [
  { code: '150', description: 'File status okay; about to open data connection', category: 'intermediate' },
  { code: '200', description: 'Command okay', category: 'success' },
  { code: '202', description: 'Command not implemented, superfluous at this site', category: 'success' },
  { code: '211', description: 'System status, or system help reply', category: 'success' },
  { code: '212', description: 'Directory status', category: 'success' },
  { code: '213', description: 'File status', category: 'success' },
  { code: '214', description: 'Help message', category: 'success' },
  { code: '215', description: 'NAME system type', category: 'success' },
  { code: '220', description: 'Service ready for new user', category: 'success' },
  { code: '221', description: 'Service closing control connection', category: 'success' },
  { code: '225', description: 'Data connection open; no transfer in progress', category: 'success' },
  { code: '226', description: 'Closing data connection; transfer complete', category: 'success' },
  { code: '227', description: 'Entering Passive Mode (h1,h2,h3,h4,p1,p2)', category: 'success' },
  { code: '229', description: 'Entering Extended Passive Mode (|||port|)', category: 'success' },
  { code: '230', description: 'User logged in, proceed', category: 'success' },
  { code: '250', description: 'Requested file action okay, completed', category: 'success' },
  { code: '257', description: 'PATHNAME created', category: 'success' },
  { code: '331', description: 'User name okay, need password', category: 'intermediate' },
  { code: '332', description: 'Need account for login', category: 'intermediate' },
  { code: '350', description: 'Requested file action pending further information', category: 'intermediate' },
  { code: '421', description: 'Service not available, closing control connection', category: 'error' },
  { code: '425', description: 'Cannot open data connection', category: 'error' },
  { code: '426', description: 'Connection closed; transfer aborted', category: 'error' },
  { code: '450', description: 'Requested file action not taken; file unavailable', category: 'error' },
  { code: '451', description: 'Requested action aborted; local error in processing', category: 'error' },
  { code: '452', description: 'Requested action not taken; insufficient storage space', category: 'error' },
  { code: '500', description: 'Syntax error, command unrecognized', category: 'permanent' },
  { code: '501', description: 'Syntax error in parameters or arguments', category: 'permanent' },
  { code: '502', description: 'Command not implemented', category: 'permanent' },
  { code: '503', description: 'Bad sequence of commands', category: 'permanent' },
  { code: '504', description: 'Command not implemented for that parameter', category: 'permanent' },
  { code: '530', description: 'Not logged in', category: 'permanent' },
  { code: '532', description: 'Need account for storing files', category: 'permanent' },
  { code: '550', description: 'Requested action not taken; file unavailable', category: 'permanent' },
  { code: '551', description: 'Requested action aborted; page type unknown', category: 'permanent' },
  { code: '552', description: 'Requested file action aborted; exceeded storage allocation', category: 'permanent' },
  { code: '553', description: 'Requested action not taken; file name not allowed', category: 'permanent' },
];

const FtpResponseCodes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCodes = responseCodes.filter(code => {
    const matchesSearch = code.code.includes(searchTerm) || 
                         code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: ResponseCode['category']) => {
    switch (category) {
      case 'success': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'permanent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const handleCopyCode = (code: string, description: string) => {
    copyText(`${code} ${description}`);
  };

  return (
    <section>
      <h2>FTP Response Code Reference</h2>
      <div className="card">
        <div className="grid grid-2" style={{ marginBottom: '16px' }}>
          <div>
            <label>Search codes or descriptions</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., 227, passive, login"
              autoComplete="off"
            />
          </div>
          <div>
            <label>Filter by category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              <option value="all">All Categories</option>
              <option value="success">Success (2xx)</option>
              <option value="intermediate">Intermediate (3xx)</option>
              <option value="error">Temporary Error (4xx)</option>
              <option value="permanent">Permanent Error (5xx)</option>
            </select>
          </div>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredCodes.map((code, index) => (
            <div
              key={index}
              className="row"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '4px',
                background: 'var(--card)'
              }}
            >
              <div
                className="mono"
                style={{
                  fontWeight: 'bold',
                  color: getCategoryColor(code.category),
                  minWidth: '40px',
                  flexShrink: 0
                }}
              >
                {code.code}
              </div>
              <div className="grow" style={{ marginLeft: '12px' }}>
                {code.description}
              </div>
              <button
                className="btn"
                onClick={() => handleCopyCode(code.code, code.description)}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
        
        {filteredCodes.length === 0 && (
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            No response codes found matching your search.
          </div>
        )}
      </div>
      <p className="small muted">
        <strong>Categories:</strong> 2xx = Success, 3xx = Intermediate (need more info), 4xx = Temporary error, 5xx = Permanent error
      </p>
    </section>
  );
};

export default FtpResponseCodes;