import React from 'react';

interface StatusIndicatorProps {
  isValid: boolean;
  size?: 'small' | 'medium';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isValid, size = 'medium' }) => {
  const sizeClass = size === 'small' ? '12px' : '16px';
  
  return (
    <span
      style={{
        display: 'inline-block',
        width: sizeClass,
        height: sizeClass,
        borderRadius: '50%',
        backgroundColor: isValid ? '#10b981' : '#ef4444',
        marginLeft: '8px',
        flexShrink: 0
      }}
      title={isValid ? 'Valid' : 'Invalid'}
    />
  );
};

export default StatusIndicator;