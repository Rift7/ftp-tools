import React, { useState } from 'react';
import { useCopyFeedback } from '../hooks/useCopyFeedback';

interface Command {
  label: string;
  template: string;
}

const commands: Command[] = [
  { label: 'Username', template: 'USER {args}' },
  { label: 'Password', template: 'PASS {args}' },
  { label: 'Binary mode', template: 'TYPE I' },
  { label: 'ASCII mode', template: 'TYPE A' },
  { label: 'Print working dir', template: 'PWD' },
  { label: 'Change dir', template: 'CWD {args}' },
  { label: 'Make dir', template: 'MKD {args}' },
  { label: 'Remove dir', template: 'RMD {args}' },
  { label: 'Delete file', template: 'DELE {args}' },
  { label: 'List (simple)', template: 'LIST' },
  { label: 'List (detailed)', template: 'LIST -al' },
  { label: 'Retrieve → client', template: 'RETR {args}' },
  { label: 'Store → server', template: 'STOR {args}' },
  { label: 'Rename from', template: 'RNFR {args}' },
  { label: 'Rename to', template: 'RNTO {args}' },
  { label: 'Features', template: 'FEAT' },
  { label: 'System type', template: 'SYST' },
  { label: 'Quit', template: 'QUIT' },
];

interface CommandRowProps {
  command: Command;
}

const CommandRow: React.FC<CommandRowProps> = ({ command }) => {
  const [args, setArgs] = useState('');
  const { copyWithFeedback, isCopied } = useCopyFeedback();

  const renderCommand = () => {
    return command.template.includes('{args}') 
      ? command.template.replace(/\{args\}/g, args || '{args}') 
      : command.template;
  };

  const handleCopy = () => {
    const commandText = renderCommand().replace('{args}', '');
    copyWithFeedback(commandText, `cmd-${command.label}`);
  };

  return (
    <div className="ref-row">
      <div className="head">
        <div className="muted">{command.label}</div>
      </div>
      <div className="row">
        <div className="grow">
          <div className="mono copyable" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderCommand()}</div>
        </div>
        {command.template.includes('{args}') && (
          <input
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            placeholder="args (e.g., alice)"
          />
        )}
        <button 
          className="btn" 
          onClick={handleCopy}
          style={{ backgroundColor: isCopied(`cmd-${command.label}`) ? '#10b981' : undefined }}
        >
          {isCopied(`cmd-${command.label}`) ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const CommandReference: React.FC = () => {
  return (
    <section>
      <h2>Quick‑copy command reference</h2>
      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        {commands.map((command, index) => (
          <CommandRow key={index} command={command} />
        ))}
      </div>
    </section>
  );
};

export default CommandReference;