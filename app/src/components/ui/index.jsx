import { useState, useEffect, useContext, createContext } from 'react'
import { cn } from '../../lib/utils'

export function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500/40'
  const variants = {
    default:   'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200',
    outline:   'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50',
    ghost:     'text-gray-700 hover:bg-gray-100',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }
  return (
    <button className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.md, className)} {...props}>
      {children}
    </button>
  )
}

export const Card            = ({ className = '', children, ...p }) => <div className={cn('rounded-xl bg-white border border-gray-200 shadow-sm', className)} {...p}>{children}</div>
export const CardHeader      = ({ className = '', children }) => <div className={cn('p-6 pb-3', className)}>{children}</div>
export const CardTitle       = ({ className = '', children }) => <h3 className={cn('font-bold text-lg leading-tight', className)}>{children}</h3>
export const CardDescription = ({ className = '', children }) => <p className={cn('text-sm text-gray-500 mt-1', className)}>{children}</p>
export const CardContent     = ({ className = '', children }) => <div className={cn('p-6 pt-3', className)}>{children}</div>

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = { default: 'bg-blue-600 text-white', outline: 'border border-gray-300 text-gray-700 bg-white' }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant] || variants.default, className)}>{children}</span>
}

export const Input = ({ className = '', ...p }) => (
  <input className={cn('flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500', className)} {...p}/>
)
export const Label = ({ className = '', children, ...p }) => (
  <label className={cn('text-sm font-medium text-gray-800', className)} {...p}>{children}</label>
)

export function Progress({ value = 0, className = '' }) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-gray-100', className.includes('h-') ? className : cn('h-2', className))}>
      <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/>
    </div>
  )
}

const TabsCtx = createContext(null)
export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [v, setV] = useState(value ?? defaultValue)
  useEffect(() => { if (value !== undefined) setV(value) }, [value])
  const set = (nv) => { setV(nv); onValueChange?.(nv) }
  return <TabsCtx.Provider value={{ v, set }}><div className={className}>{children}</div></TabsCtx.Provider>
}
export const TabsList = ({ className = '', children }) => (
  <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-600', className)}>{children}</div>
)
export function TabsTrigger({ value, children, className = '' }) {
  const { v, set } = useContext(TabsCtx)
  return (
    <button onClick={() => set(value)} className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all flex-1',
      v === value ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900', className
    )}>{children}</button>
  )
}
export function TabsContent({ value, children, className = '' }) {
  const { v } = useContext(TabsCtx)
  if (v !== value) return null
  return <div className={className}>{children}</div>
}

export function Switch({ id, checked, onCheckedChange, defaultChecked }) {
  const [on, setOn] = useState(checked ?? defaultChecked ?? false)
  useEffect(() => { if (checked !== undefined) setOn(checked) }, [checked])
  const toggle = () => { const nv = !on; if (checked === undefined) setOn(nv); onCheckedChange?.(nv) }
  return (
    <button id={id} role="switch" aria-checked={on} onClick={toggle}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', on ? 'bg-blue-600' : 'bg-gray-300')}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', on ? 'translate-x-6' : 'translate-x-1')}/>
    </button>
  )
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }) {
  const v = Array.isArray(value) ? value[0] : (value ?? 0)
  return (
    <input type="range" min={min} max={max} step={step} value={v}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={cn('w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600', className)}/>
  )
}
