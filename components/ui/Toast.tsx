"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ToastContext = createContext<(mensajen: string) => void>(() => {});

/** `const toast = useToast(); toast('Konta profesór kria ona ✓')` */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensajen, setMensajen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((texto: string) => {
    setMensajen(texto);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMensajen(null), 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {mensajen ? (
        <div
          role="status"
          className="fixed right-[22px] bottom-[22px] z-[60] animate-pop rounded-[10px] border border-accent border-l-4 border-l-accent bg-surface px-4 py-[11px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {mensajen}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
