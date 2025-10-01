import React from 'react';
import PortBuilder from './components/PortBuilder';
import PasvParser from './components/PasvParser';
import ReversePortParser from './components/ReversePortParser';
import CommandReference from './components/CommandReference';
import Tips from './components/Tips';

const App: React.FC = () => {
  return (
    <div className="container">
      <header>
        <h1>
          FTP Command Reference & Calculators <span className="tag">React</span>
        </h1>
        <p className="small">
          Quick‑copy the basics (<span className="mono">USER</span>, <span className="mono">PASS</span>, <span className="mono">LIST</span>, …) and build or parse <span className="mono">PORT</span>/<span className="mono">PASV</span>.
        </p>
      </header>

      <PortBuilder />
      <PasvParser />
      <ReversePortParser />
      <CommandReference />
      <Tips />

      <footer className="small muted">
        React TypeScript app. No external libraries. All logic runs locally.
      </footer>
    </div>
  );
};

export default App;