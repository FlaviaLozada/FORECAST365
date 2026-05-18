import { useState, useEffect, createContext } from 'react'
import { cn } from '../lib/utils'
import { _initToast } from '../lib/toast'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = (msg, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setItems(s => [...s, { id, msg, type }])
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 3200)
  }

  useEffect(() => { _initToast(push) }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map(t => (
          <div key={t.id} className={cn(
            'px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-slideIn pointer-events-auto',
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-white border-gray-200 text-gray-800'
          )}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
