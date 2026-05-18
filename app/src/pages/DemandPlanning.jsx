import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '../components/ui'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ComposedChart, Area,
} from 'recharts'
import { RefreshCw, Download, AlertTriangle, X, ChevronRight } from '../icons'
import { calcForecast } from '../lib/dataEngine'
import { toast } from '../lib/toast'
import * as XLSX from 'xlsx'

const SS_FACTOR = { A: 1.8, B: 1.4, C: 1.1 }

const BUCKETS = [
  { label: '< 7 días',   name: 'Crítico',    color: '#ef4444', min: 0,   max: 7          },
  { label: '7 – 15 d',   name: 'Ajustado',   color: '#f97316', min: 7,   max: 15         },
  { label: '15 – 30 d',  name: 'Saludable',  color: '#22c55e', min: 15,  max: 30         },
  { label: '30 – 60 d',  name: 'Cómodo',     color: '#16a34a', min: 30,  max: 60         },
  { label: '60 – 120 d', name: 'Holgado',    color: '#a78bfa', min: 60,  max: 120        },
  { label: '> 120 días', name: 'Sobrestock', color: '#dc2626', min: 120, max: Infinity   },
]

const ABC_STYLE = {
  A: { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
  B: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  C: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
}

const ML = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function hashNum(str, i) {
  let h = 0
  for (let j = 0; j < str.length; j++) h = (h * 31 + str.charCodeAt(j)) & 0xffff
  return ((h * (i + 7)) % 100) / 100
}

const EX = 6.97

function getMetric(p, mode) {
  switch (mode) {
    case 'rotación': return p.avgDemand || 0
    case 'margen':   return Math.max(0, (p.currentPrice || 0) - (p.costUSD || 0) * EX)
    default:         return (p.currentPrice || 0) * (p.avgDemand || 0)
  }
}

const MODE_LABEL = {
  'rotación': { y: '% demanda acumulada', x: '% SKUs (por rotación)'    },
  'margen':   { y: '% margen acumulado',  x: '% SKUs (por margen)'      },
  'combinado':{ y: '% valor acumulado',   x: '% SKUs (por importancia)' },
}

function MiniSparkline({ product }) {
  const base = product.avgDemand || 10
  const pts = Array.from({ length: 8 }, (_, i) => base * (0.75 + 0.5 * hashNum(product.id, i)))
  const W = 72, H = 28
  const min = Math.min(...pts), rng = Math.max(...pts) - min || 1
  const coords = pts.map((v, i) => [
    (i / (pts.length - 1)) * W,
    H - ((v - min) / rng) * H * 0.82 - H * 0.09,
  ])
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`sp-${product.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4D17FC" stopOpacity={0.2}/>
          <stop offset="100%" stopColor="#4D17FC" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#sp-${product.id})`}/>
      <path d={d} fill="none" stroke="#4D17FC" strokeWidth={1.5} strokeLinejoin="round"/>
    </svg>
  )
}

function CircularGauge({ value, size = 84 }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={9}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#4D17FC" strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight={800} fill="#1e293b">{value}%</text>
    </svg>
  )
}

function ProductDrawer({ product, onClose }) {
  const leadDays = parseInt(product.leadTime) || 45
  const ss = Math.round(product.avgDemand * (leadDays / 30) * (SS_FACTOR[product.abc] || 1.2))
  const coverageDays = product.avgDemand > 0
    ? Math.round((product.currentStock / product.avgDemand) * 30) : 0
  const orderQty = Math.max(0, product.optimalStock - product.currentStock)
  const stockPct = product.optimalStock > 0
    ? Math.min(100, Math.round((product.currentStock / product.optimalStock) * 100)) : 0

  const now = new Date()
  const baseVals = Array.from({ length: 12 }, (_, i) =>
    Math.round(product.avgDemand * (0.8 + 0.4 * hashNum(product.id, i)))
  )
  const fcast = calcForecast(baseVals, 6)
  const chartData = [
    ...baseVals.map((v, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 12 + i, 1)
      return { month: ML[d.getMonth()], real: v, forecast: null, upper: null, lower: null }
    }),
    ...fcast.map((v, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      return { month: ML[d.getMonth()], real: null, forecast: v, upper: Math.round(v*1.15), lower: Math.round(v*0.85) }
    }),
  ]

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, zIndex: 60,
        background: 'white', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', overflowY: 'auto',
      }}
    >
      <div style={{ padding: '20px 20px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{
                fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6,
                background: ABC_STYLE[product.abc]?.bg, color: ABC_STYLE[product.abc]?.color,
              }}>Clase {product.abc}</span>
              <span style={{ fontSize:12, color:'#94a3b8' }}>{product.id}</span>
            </div>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1e293b', lineHeight:1.3, maxWidth:300 }}>
              {product.name}
            </h3>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{product.category}</p>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:'1.5px solid #e2e8f0',
            background:'white', cursor:'pointer', display:'grid', placeItems:'center',
          }}>
            <X style={{ width:14, height:14, color:'#64748b' }}/>
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Stock actual', value: product.currentStock, sub:`Óptimo: ${product.optimalStock}` },
            { label:'Cobertura',    value: `${coverageDays}d`,   sub:`Lead time: ${leadDays}d`          },
            { label:'Stock seg.',   value: ss,                   sub:`×${SS_FACTOR[product.abc]||1.2}`  },
          ].map((m, i) => (
            <div key={i} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ fontSize:10, color:'#94a3b8', marginBottom:3 }}>{m.label}</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#1e293b', lineHeight:1 }}>{m.value}</p>
              <p style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:12, color:'#64748b' }}>Nivel de inventario</span>
            <span style={{ fontSize:12, fontWeight:700 }}>{stockPct}%</span>
          </div>
          <div style={{ height:7, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${stockPct}%`, borderRadius:99,
              background: stockPct < 50 ? '#ef4444' : stockPct < 85 ? '#f97316' : '#22c55e',
            }}/>
          </div>
        </div>

        <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', marginBottom:8 }}>Proyección de demanda</p>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top:4, right:4, left:-22, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="month" tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false}/>
            <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false}/>
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }}/>
            <Area type="monotone" dataKey="upper" fill="#ede9fe" stroke="none" name="Banda sup."/>
            <Area type="monotone" dataKey="lower" fill="#f8fafc" stroke="none" name="Banda inf."/>
            <Line type="monotone" dataKey="real" stroke="#4D17FC" strokeWidth={2}
              dot={{ r:2, fill:'#4D17FC' }} name="Historial" connectNulls={false}/>
            <Line type="monotone" dataKey="forecast" stroke="#4D17FC" strokeWidth={2}
              strokeDasharray="5 3" dot={{ r:2, fill:'#4D17FC' }} name="Pronóstico" connectNulls={false}/>
          </ComposedChart>
        </ResponsiveContainer>

        {orderQty > 0 && (
          <div style={{
            marginTop:16, background:'#fef2f2', border:'1.5px solid #fca5a5',
            borderRadius:12, padding:'12px 16px',
          }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:4 }}>⚠ Reposición recomendada</p>
            <p style={{ fontSize:12, color:'#dc2626' }}>
              Pedir <strong>{orderQty}</strong> unidades · Lead time {leadDays}d ·
              USD {(orderQty * (product.costUSD || 0)).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function DemandPlanning() {
  const { products } = useAppContext()
  const [paretoMode, setParetoMode]     = useState('combinado')
  const [skuFilter, setSkuFilter]       = useState('todos')
  const [selected, setSelected]         = useState(null)
  const [recalculating, setRecalculating] = useState(false)

  const classified = useMemo(() => {
    if (!products.length) return []
    const sorted = [...products]
      .map(p => ({ ...p, _metric: getMetric(p, paretoMode) }))
      .sort((a, b) => b._metric - a._metric)
    const totalMetric = sorted.reduce((s, p) => s + p._metric, 0)
    let cum = 0
    return sorted.map(p => {
      cum += p._metric
      const revPct = totalMetric ? cum / totalMetric : 0
      const abc = revPct <= 0.70 ? 'A' : revPct <= 0.90 ? 'B' : 'C'
      const leadDays = parseInt(p.leadTime) || 45
      const coverageDays = p.avgDemand > 0 ? Math.round((p.currentStock / p.avgDemand) * 30) : 0
      const ss = Math.round(p.avgDemand * (leadDays / 30) * (SS_FACTOR[abc] || 1.2))
      return { ...p, abc, revPct, coverageDays, ss, leadDays }
    })
  }, [products, paretoMode])

  const paretoData = useMemo(() => {
    const n = classified.length
    if (!n) return []
    const raw = [{ x:0, y:0, eq:0 }]
    classified.forEach((p, i) => {
      raw.push({ x: Math.round(((i+1)/n)*100), y: Math.round(p.revPct*100), eq: Math.round(((i+1)/n)*100) })
    })
    if (n <= 8) {
      const smooth = [{ x:0, y:0, eq:0 }]
      for (let x = 5; x <= 100; x += 5) {
        const after  = raw.find(p => p.x >= x) || raw[raw.length-1]
        const before = [...raw].reverse().find(p => p.x <= x) || raw[0]
        const t = before.x === after.x ? 1 : (x - before.x) / (after.x - before.x)
        smooth.push({ x, y: Math.round(before.y + t*(after.y - before.y)), eq: x })
      }
      return smooth
    }
    return raw
  }, [classified, paretoMode])

  const abcGroups = useMemo(() => {
    const total = classified.reduce((s, p) => s + p._metric, 0)
    return ['A','B','C'].reduce((acc, cls) => {
      const items = classified.filter(p => p.abc === cls)
      const val   = items.reduce((s, p) => s + p._metric, 0)
      acc[cls] = { count: items.length, revPct: total ? Math.round(val/total*100) : 0 }
      return acc
    }, {})
  }, [classified])

  const aZonePct = classified.length ? Math.round((abcGroups.A?.count||0) / classified.length * 100) : 20
  const bZonePct = classified.length ? Math.round(((abcGroups.A?.count||0)+(abcGroups.B?.count||0)) / classified.length * 100) : 50

  const coverageGroups = useMemo(() =>
    BUCKETS.map(b => {
      const items = classified.filter(p => p.coverageDays >= b.min && p.coverageDays < b.max)
      return { ...b, count: items.length, a: items.filter(p=>p.abc==='A').length, b2: items.filter(p=>p.abc==='B').length, c: items.filter(p=>p.abc==='C').length }
    }), [classified])

  const maxCovCount   = Math.max(...coverageGroups.map(g => g.count), 1)
  const criticalCount = classified.filter(p => p.coverageDays < 15).length

  const purchasePlan = useMemo(() => {
    const toOrder  = classified.filter(p => p.status==='critical'||p.status==='warning')
    const totalUSD = toOrder.reduce((s,p) => s + Math.max(0, p.optimalStock-p.currentStock)*(p.costUSD||0), 0)
    return { orders: toOrder.length, totalUSD, totalBOB: totalUSD*6.96, products: toOrder }
  }, [classified])

  const actions = useMemo(() => ({
    acelerar: classified.filter(p => p.coverageDays < 7).length,
    mantener: classified.filter(p => p.coverageDays >= 7 && p.coverageDays <= 90).length,
    reducir:  classified.filter(p => p.coverageDays > 120).length,
  }), [classified])

  const serviceLevel = useMemo(() => {
    if (!classified.length) return 95
    const ok = classified.filter(p => p.status==='optimal'||p.status==='overstock').length
    return Math.round((ok / classified.length) * 100)
  }, [classified])

  const filteredSKUs = useMemo(() => {
    switch (skuFilter) {
      case 'a':        return classified.filter(p => p.abc==='A')
      case 'b':        return classified.filter(p => p.abc==='B')
      case 'c':        return classified.filter(p => p.abc==='C')
      case 'criticos': return classified.filter(p => p.status==='critical')
      case 'bajo-ss':  return classified.filter(p => p.currentStock < p.ss)
      default:         return classified
    }
  }, [classified, skuFilter])

  const handleRecalcular = () => {
    setRecalculating(true)
    setTimeout(() => {
      setRecalculating(false)
      toast.success(`✓ Pronósticos recalculados · ${classified.length} SKUs · modelo actualizado`)
    }, 1400)
  }

  const downloadPlan = () => {
    const wb   = XLSX.utils.book_new()
    const fecha = new Date().toISOString().slice(0,10)

    const toOrder = classified.filter(p => p.status==='critical' || p.status==='warning')

    const wsResumen = XLSX.utils.aoa_to_sheet([
      ['PLAN DE COMPRAS — ' + nowLabel.toUpperCase()],
      [],
      ['Métrica','Valor'],
      ['SKUs a reponer',      toOrder.length],
      ['Inversión total USD', Math.round(purchasePlan.totalUSD)],
      ['Inversión total BOB', Math.round(purchasePlan.totalBOB)],
      ['SKUs Clase A',        toOrder.filter(p=>p.abc==='A').length],
      ['SKUs Clase B',        toOrder.filter(p=>p.abc==='B').length],
      ['SKUs Clase C',        toOrder.filter(p=>p.abc==='C').length],
    ])
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    const wsDetalle = XLSX.utils.aoa_to_sheet([
      ['Producto','Categoría','Clase ABC','Estado','Stock actual','Stock óptimo','Unidades a pedir','Costo USD/u','Total USD','Lead Time'],
      ...toOrder.map(p => {
        const qty = Math.max(0, p.optimalStock - p.currentStock)
        return [p.name, p.category, p.abc, p.status, p.currentStock, p.optimalStock, qty, p.costUSD, +(qty*p.costUSD).toFixed(2), p.leadTime]
      }),
      ...(toOrder.length === 0 ? [['Sin productos para reponer en este momento']] : []),
    ])
    wsDetalle['!cols'] = [{wch:32},{wch:14},{wch:10},{wch:12},{wch:14},{wch:14},{wch:16},{wch:12},{wch:12},{wch:12}]
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle')

    const wsCobertura = XLSX.utils.aoa_to_sheet([
      ['Producto','Clase ABC','Stock','Cobertura (días)','Stock Seg.','Estado'],
      ...classified.map(p => [p.name, p.abc, p.currentStock, p.coverageDays, p.ss,
        p.coverageDays < 7  ? 'CRÍTICO'  :
        p.coverageDays < 15 ? 'AJUSTADO' :
        p.coverageDays < 30 ? 'SALUDABLE': 'CÓMODO']),
    ])
    XLSX.utils.book_append_sheet(wb, wsCobertura, 'Cobertura')

    XLSX.writeFile(wb, `PlanCompras_${fecha}.xlsx`)
    toast.success(`Plan de compras descargado · ${toOrder.length} SKUs · USD ${Math.round(purchasePlan.totalUSD).toLocaleString('es')}`)
  }

  const STATUS_DOT = { critical:'#ef4444', warning:'#f97316', optimal:'#22c55e', overstock:'#a78bfa' }
  const nowLabel = new Date().toLocaleDateString('es-ES',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase())

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Planificación de demanda</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {classified.length} SKUs activos · proyección rolling 6 meses · servicio objetivo 95%
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm"
            className={cn('text-xs hidden sm:flex items-center gap-1.5', recalculating && 'opacity-60 cursor-not-allowed')}
            onClick={handleRecalcular} disabled={recalculating}>
            <RefreshCw className={cn('h-3.5 w-3.5', recalculating && 'animate-spin')}/>
            {recalculating ? 'Recalculando…' : 'Recalcular'}
          </Button>
          <Button size="sm" className="text-xs flex items-center gap-1.5" onClick={downloadPlan}>
            <Download className="h-3.5 w-3.5"/>Plan de compras
          </Button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-5 mb-5">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Pareto ABC */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm sm:text-base">Pareto ABC del catálogo</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Clasificación por importancia · concentración acumulada de valor
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {['Rotación','Margen','Combinado'].map(m => (
                    <button key={m} onClick={() => setParetoMode(m.toLowerCase())}
                      className={cn('px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                        paretoMode === m.toLowerCase()
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={paretoData} margin={{ top:8, right:8, left:-8, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <ReferenceArea x1={0} x2={aZonePct} fill="#ede9fe" fillOpacity={0.5}
                    label={{ value:'A', position:'insideTopLeft', offset:8,
                      style:{ fontSize:14, fontWeight:800, fill:'#7c3aed' } }}/>
                  <ReferenceArea x1={aZonePct} x2={bZonePct} fill="#eff6ff" fillOpacity={0.5}
                    label={{ value:'B', position:'insideTopLeft', offset:8,
                      style:{ fontSize:14, fontWeight:800, fill:'#2563eb' } }}/>
                  <XAxis dataKey="x" type="number" domain={[0,100]} ticks={[0,20,50,80,100]}
                    tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false}
                    tickFormatter={v=>`${v}%`}
                    label={{ value: MODE_LABEL[paretoMode]?.x || '', position:'insideBottomRight',
                      offset:-4, style:{ fontSize:9, fill:'#9ca3af' } }}/>
                  <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#9ca3af' }}
                    tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}
                    label={{ value: MODE_LABEL[paretoMode]?.y || '', angle:-90, position:'insideLeft',
                      offset:14, style:{ fontSize:9, fill:'#9ca3af' } }}/>
                  <Tooltip
                    formatter={(v,n) => {
                      const lbl = paretoMode==='rotación'?'Demanda acum.':paretoMode==='margen'?'Margen acum.':'Valor acum.'
                      return [`${v}%`, n==='y' ? lbl : 'Dist. igual']
                    }}
                    labelFormatter={v=>`${v}% SKUs`}
                    contentStyle={{ fontSize:11, borderRadius:8 }}/>
                  <Line type="linear" dataKey="eq" stroke="#e2e8f0" strokeWidth={1.5}
                    dot={false} name="Dist. igual" strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="y" stroke="#4D17FC" strokeWidth={2.5}
                    dot={false} name="Valor acum."/>
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                <span className="font-semibold text-purple-700">
                  {abcGroups.A?.count||0} SKUs concentran ~{abcGroups.A?.revPct||0}%{' '}
                  {paretoMode==='rotación' ? 'de la demanda total' : paretoMode==='margen' ? 'del margen total' : 'del valor total'}
                </span>
                {' '}({paretoMode==='rotación' ? 'ordenados por unidades vendidas' : paretoMode==='margen' ? 'margen unitario en Bs' : 'margen × rotación'}). Esta lógica define qué productos no pueden quebrar stock.
              </p>
            </CardContent>
          </Card>

          {/* Análisis de cobertura */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm sm:text-base">Análisis de cobertura</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Cobertura = stock disponible ÷ demanda mensual · vs lead time del proveedor
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] text-gray-500 flex-wrap">
                  {[{label:'Riesgo',color:'#ef4444'},{label:'Ajustado',color:'#f97316'},{label:'Saludable',color:'#22c55e'},{label:'Sobrestock',color:'#a78bfa'}].map(l=>(
                    <span key={l.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{background:l.color}}/>
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coverageGroups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-right">
                      <p className="text-xs font-semibold text-gray-700 leading-none">{g.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{g.name}</p>
                    </div>
                    <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 flex items-center px-2.5 rounded-md"
                        style={{
                          width: g.count ? `${Math.max(10,(g.count/maxCovCount)*100)}%` : '6px',
                          minWidth: g.count ? 52 : 6,
                          background: g.color,
                        }}>
                        {g.count > 0 && (
                          <span className="text-white text-xs font-semibold whitespace-nowrap">
                            {g.count} SKU{g.count!==1?'s':''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 text-[10px] shrink-0 w-20">
                      {g.a  > 0 && <span><strong style={{color:'#6d28d9'}}>A</strong> {g.a}</span>}
                      {g.b2 > 0 && <span><strong style={{color:'#1d4ed8'}}>B</strong> {g.b2}</span>}
                      {g.c  > 0 && <span><strong style={{color:'#475569'}}>C</strong> {g.c}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {criticalCount > 0 && (
                <div className="mt-4 flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0"/>
                    <span><strong>{criticalCount} SKUs</strong> bajo cobertura mínima (riesgo de quiebre antes del próximo lead time)</span>
                  </div>
                  <button onClick={() => setSkuFilter('criticos')}
                    className="text-xs text-blue-600 font-semibold whitespace-nowrap hover:underline shrink-0">
                    Ver críticos →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan compras + Acciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <p className="text-sm font-bold mb-3">Plan de compras · {nowLabel}</p>
                <div className="flex gap-6 mb-1">
                  <div>
                    <p className="text-[10px] text-gray-400">Órdenes</p>
                    <p className="text-3xl font-black text-gray-900">{purchasePlan.orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Valor</p>
                    <p className="text-2xl font-black text-gray-900">
                      {purchasePlan.totalUSD > 0
                        ? `USD ${purchasePlan.totalUSD>=1000 ? (purchasePlan.totalUSD/1000).toFixed(0)+'K' : Math.round(purchasePlan.totalUSD)}`
                        : '—'}
                    </p>
                    {purchasePlan.totalBOB > 0 && (
                      <p className="text-xs text-gray-400">Bs. {Math.round(purchasePlan.totalBOB).toLocaleString('es')}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">cubren {purchasePlan.orders} SKUs en estado crítico/alerta</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <p className="text-sm font-bold mb-3">Acciones recomendadas</p>
                <div className="space-y-2.5">
                  {[
                    { label:'Acelerar (quiebre)',  count: actions.acelerar, color:'#ef4444' },
                    { label:'Mantener ritmo',      count: actions.mantener, color:'#22c55e' },
                    { label:'Reducir (sobrestock)',count: actions.reducir,  color:'#a78bfa' },
                  ].map((a,i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:a.color}}/>
                        <span className="text-xs text-gray-600">{a.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{a.count} SKUs</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT sidebar */}
        <div className="space-y-4">

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Clasificación ABC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { cls:'A', title:'Críticos · no pueden faltar',      desc:'Top del catálogo por importancia. Stock de seguridad alto, monitoreo semanal.' },
                { cls:'B', title:'Importancia media',                  desc:'Siguiente tramo. Stock estándar, revisión mensual.' },
                { cls:'C', title:'Cola larga · gestión por excepción', desc:'Restante. Reposición bajo demanda.' },
              ].map(({ cls, title, desc }) => (
                <div key={cls} className="flex gap-2.5 p-3 rounded-xl border"
                  style={{ borderColor: ABC_STYLE[cls].border, background: ABC_STYLE[cls].bg+'55' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: ABC_STYLE[cls].bg, color: ABC_STYLE[cls].color, border:`1.5px solid ${ABC_STYLE[cls].border}` }}>
                    {cls}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5 flex-wrap">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{title}</p>
                      <p className="text-[10px] font-semibold shrink-0" style={{color:ABC_STYLE[cls].color}}>
                        {abcGroups[cls]?.count||0} SKUs · {abcGroups[cls]?.revPct||0}% valor
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Stock de seguridad</CardTitle>
              <CardDescription className="text-xs">Buffer por clase ABC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {['A','B','C'].map(cls => {
                const items   = classified.filter(p => p.abc === cls)
                const avgLead = items.length ? Math.round(items.reduce((s,p)=>s+p.leadDays,0)/items.length) : 0
                return (
                  <div key={cls} className="rounded-xl p-3 border bg-white" style={{borderColor:ABC_STYLE[cls].border}}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                        style={{background:ABC_STYLE[cls].bg, color:ABC_STYLE[cls].color}}>
                        {cls}
                      </span>
                      <span className="text-xs text-gray-400">{items.length} SKUs</span>
                      <span className="text-base font-black" style={{color:ABC_STYLE[cls].color}}>
                        ×{SS_FACTOR[cls]}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Lead time</span>
                        <span className="font-semibold text-gray-700">{avgLead}d promedio</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buffer objetivo</span>
                        <span className="font-semibold text-gray-700">
                          {cls==='A'?'~25 días de cobertura':cls==='B'?'~15 días de cobertura':'reposición bajo demanda'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Servicio</span>
                        <span className="font-semibold text-gray-700">
                          {cls==='A'?'97%':cls==='B'?'95%':'90%'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Nivel de servicio</p>
                  <p className="text-xs text-gray-400 mt-0.5">Últimos 90 días · objetivo 95%</p>
                </div>
                <CircularGauge value={serviceLevel}/>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SKU table ── */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-sm sm:text-base">SKUs en gestión</CardTitle>
              <CardDescription className="text-xs">
                Click en una fila para abrir la proyección detallada · {filteredSKUs.length} de {classified.length} mostrados
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                {id:'todos',    label:'Todos'   },
                {id:'a',        label:'Clase A'  },
                {id:'b',        label:'Clase B'  },
                {id:'c',        label:'Clase C'  },
                {id:'criticos', label:'Críticos' },
                {id:'bajo-ss',  label:'Bajo SS'  },
              ].map(f => (
                <button key={f.id} onClick={() => setSkuFilter(f.id)}
                  className={cn('px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                    skuFilter===f.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* Mobile cards */}
          <div className="sm:hidden divide-y">
            {filteredSKUs.map((p,i) => (
              <button key={i} onClick={() => setSelected(p)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{background:ABC_STYLE[p.abc]?.bg, color:ABC_STYLE[p.abc]?.color}}>
                        {p.abc}
                      </span>
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1"/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {label:'Stock',     value: p.currentStock},
                    {label:'Cobertura', value:`${p.coverageDays}d`, warn: p.coverageDays < 15},
                    {label:'Lead time', value:`${p.leadDays}d`},
                  ].map((m,j) => (
                    <div key={j} className="text-center rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400">{m.label}</p>
                      <p className="text-sm font-bold" style={{color: m.warn?'#f97316':'#1e293b'}}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['SKU','Producto · Categoría','ABC','Stock','SS','Cobertura','Lead','Tendencia',''].map((h,i) => (
                    <th key={i} className={cn(
                      'py-2.5 font-semibold text-gray-400 uppercase tracking-wide text-[10px]',
                      i===0?'px-4 text-left':i===1?'px-4 text-left':i===2?'px-3 text-center':'px-3 text-right',
                      i>=7?'px-3':''
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSKUs.map((p,i) => (
                  <tr key={i} onClick={() => setSelected(p)}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{background:STATUS_DOT[p.status]||'#94a3b8'}}/>
                        <span className="font-mono text-gray-400 text-[11px]">{p.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{p.category}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{background:ABC_STYLE[p.abc]?.bg, color:ABC_STYLE[p.abc]?.color}}>
                        {p.abc}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{p.currentStock}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-400">{p.ss}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold" style={{color:p.coverageDays<15?'#f97316':'#1e293b'}}>
                        {p.coverageDays}d{p.coverageDays<15?' ⚠':''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-400">{p.leadDays}d</td>
                    <td className="py-3 px-3"><MiniSparkline product={p}/></td>
                    <td className="py-3 px-2 text-gray-300">
                      <ChevronRight style={{width:14, height:14}}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="overlay"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setSelected(null)}
              style={{position:'fixed',inset:0,background:'rgba(2,11,54,0.4)',zIndex:55}}/>
            <ProductDrawer key="drawer" product={selected} onClose={() => setSelected(null)}/>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
