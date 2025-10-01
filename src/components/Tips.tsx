import React from 'react';

const Tips: React.FC = () => {
  return (
    <section className="tips">
      <h2>Tips</h2>
      <ul>
        <li>
          <span className="mono">PORT</span> = Active mode (server connects to you).{' '}
          <span className="mono">PASV</span> = Passive mode (you connect to server).
        </li>
        <li>
          Port math: <span className="mono">port = p1*256 + p2</span>. Example:{' '}
          <span className="mono">203,211 → 203*256+211 = 52139</span>.
        </li>
        <li>
          Use <span className="mono">TYPE I</span> for binary transfers to avoid newline conversions in files.
        </li>
        <li>
          Extended commands for modern stacks: <span className="mono">EPRT</span> /{' '}
          <span className="mono">EPSV</span>.
        </li>
        <li>
          Copy via keyboard with <span className="kbd">Ctrl/Cmd+C</span> after selecting any field if your clipboard blocks programmatic copy.
        </li>
      </ul>
    </section>
  );
};

export default Tips;