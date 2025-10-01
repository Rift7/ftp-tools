import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export interface RecentValues {
  ips: string[];
  ports: string[];
}

export function useRecentValues() {
  const [recentValues, setRecentValues] = useLocalStorage<RecentValues>('ftp-tools-recent', {
    ips: [],
    ports: []
  });

  const addRecentIP = (ip: string) => {
    if (!ip.trim()) return;
    const updatedIPs = [ip, ...recentValues.ips.filter(i => i !== ip)].slice(0, 5);
    setRecentValues({ ...recentValues, ips: updatedIPs });
  };

  const addRecentPort = (port: string) => {
    if (!port.trim()) return;
    const updatedPorts = [port, ...recentValues.ports.filter(p => p !== port)].slice(0, 5);
    setRecentValues({ ...recentValues, ports: updatedPorts });
  };

  const clearAll = () => {
    setRecentValues({ ips: [], ports: [] });
  };

  return {
    recentIPs: recentValues.ips,
    recentPorts: recentValues.ports,
    addRecentIP,
    addRecentPort,
    clearAll
  };
}