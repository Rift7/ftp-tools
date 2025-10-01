import { useState, useCallback } from 'react';
import { copyText } from '../utils';

export function useCopyFeedback() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyWithFeedback = useCallback(async (text: string, itemId: string) => {
    await copyText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000); // Clear feedback after 2 seconds
  }, []);

  const isCopied = useCallback((itemId: string) => copiedItem === itemId, [copiedItem]);

  return { copyWithFeedback, isCopied };
}