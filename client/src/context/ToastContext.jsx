import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '' });
  const timerRef = useRef(null);

  const showToast = useCallback((message = 'Copied!') => {
    clearTimeout(timerRef.current);
    setToast({ visible: true, message });
    timerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.message}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
