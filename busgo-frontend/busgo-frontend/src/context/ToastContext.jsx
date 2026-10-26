import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const icons = {
  success: <CheckCircle2 size={18} className="text-reflector shrink-0" />,
  error: <CircleAlert size={18} className="text-taillight shrink-0" />,
  info: <Info size={18} className="text-headlight shrink-0" />,
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4500);
  }, []);

  const toast = {
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast-in flex items-start gap-3 rounded-xl border border-line bg-kerb px-4 py-3 text-sm shadow-xl shadow-black/40">
            {icons[t.type]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
