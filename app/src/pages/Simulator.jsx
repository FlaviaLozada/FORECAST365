import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Slider } from '../components/ui'
import { Calculator, TrendingUp, DollarSign, Package, RefreshCw, Search, Sparkle } from '../icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  critical:  { color:'#ef4444', bg:'#fef2f2', ring:'#fecaca', label:'Crítico'    },
  warning:   { color:'#f59e0b', bg:'#fffbeb', ring:'#fde68a', label:'Alerta'     },
  optimal:   { color:'#10b981', bg:'#f0fdf4', ring:'#a7f3d0', label:'Óptimo'     },
  overstock: { color:'#3b82f6', bg:'#eff6ff', ring:'#bfdbfe', label:'Sobrestock' },
}

const PRESETS = [
  { name:'Crisis Cambiaria',  desc:'Dólar +15%, demanda −10%', s:{ dollar:15,  demand:-10, price:12  } },
  { name:'Boom de Demanda',   desc:'Demanda +25%, precio +8%', s:{ dollar:2,   demand:25,  price:8   } },
  { name:'Guerra de Precios', desc:'Precio −10%, volumen +15%',s:{ dollar:0,   demand:15,  price:-10 } },
  { name:'Escenario Base',    desc:'Sin cambios',               s:{ dollar:0,   demand:0,   price:0   } },
]

const PRICE_STEPS = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25]

function fmtBs(n) {
  const abs = Math.abs(n)
  if (abs >= 1000) return `Bs ${(n / 1000).toFixed(1)}K`
  return `Bs ${Math.round(n)}`
}

// ─── Slider row ───────────────────────────────────────────────────────────────
function SliderRow({ label, sub, value, onChange, min, max }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
          <p className="text-xs text-gray-400 truncate">{sub}</p>
        </div>
        <span className={cn(
          'shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border',
          value > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : value < 0 ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
        )}>
          {value > 0 ? '+' : ''}{value}%
        </span>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={1} />
      <div className="flex justify-between text-[10px] text-gray-300 font-medium select-none">
        <span>{min}%</span><span className="text-gray-400">0%</span><span>+{max}%</span>
      </div>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, icon: Icon, iconColor, current, projected, delta, deltaLabel }) {
  const up   = delta > 0
  const down = delta < 0
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Icon className={cn('h-3.5 w-3.5 shrink-0', iconColor)} />
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest truncate">{label}</p>
        </div>
        <p className="text-xl font-bold text-gray-900 leading-none mb-1">{projected}</p>
        <p className="text-xs text-gray-400 mb-3">Actual: {current}</p>
        <span className={cn(
          'inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
          up   ? 'bg-emerald-100 text-emerald-700'
               : down ? 'bg-red-100 text-red-700'
               : 'bg-gray-100 text-gray-500'
        )}>
          {delta > 0 ? '▲' : delta < 0 ? '▼' : '─'} {deltaLabel}
        </span>
      </CardContent>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Simulator() {
  const { products, suppliers, exchangeRate } = useAppContext()
  const [selectedId,    setSelectedId]    = useState(products[0]?.id)
  const [search,        setSearch]        = useState('')
  const [dollarChange,  setDollarChange]  = useState(0)
  const [demandChange,  setDemandChange]  = useState(0)
  const [priceChange,   setPriceChange]   = useState(0)

  const product  = products.find(p => p.id === selectedId) ?? products[0]
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const er = exchangeRate.current

  // ── Current ──────────────────────────────────────────────────────────────
  const costBOB      = product.costUSD * er
  const curMarginPct = product.currentPrice > 0
    ? ((product.currentPrice - costBOB) / product.currentPrice) * 100 : 0
  const curRevenue   = product.avgDemand * product.currentPrice
  const curCost      = product.avgDemand * costBOB
  const curProfit    = curRevenue - curCost
  const curStockMonths = product.avgDemand > 0
    ? product.currentStock / product.avgDemand : Infinity

  // ── Simulated ─────────────────────────────────────────────────────────────
  const simER        = er * (1 + dollarChange / 100)
  const simCostBOB   = product.costUSD * simER
  const simPrice     = product.currentPrice * (1 + priceChange / 100)
  const simDemand    = product.avgDemand * (1 + demandChange / 100)
  const simMarginPct = simPrice > 0 ? ((simPrice - simCostBOB) / simPrice) * 100 : 0
  const simRevenue   = simDemand * simPrice
  const simCost      = simDemand * simCostBOB
  const simProfit    = simRevenue - simCost
  const simStockMonths = simDemand > 0
    ? product.currentStock / simDemand : Infinity

  // ── Deltas ────────────────────────────────────────────────────────────────
  const dRevenue   = curRevenue !== 0 ? ((simRevenue - curRevenue) / curRevenue) * 100 : 0
  const dProfit    = curProfit  !== 0 ? ((simProfit  - curProfit)  / Math.abs(curProfit)) * 100 : 0
  const dMargin    = simMarginPct - curMarginPct
  const dStockMonths = isFinite(simStockMonths) && isFinite(curStockMonths)
    ? simStockMonths - curStockMonths : 0

  // ── Sensitivity chart: margin % vs price change ───────────────────────────
  const sensitivityData = PRICE_STEPS.map(pc => {
    const p = product.currentPrice * (1 + pc / 100)
    return {
      pct:               `${pc > 0 ? '+' : ''}${pc}%`,
      'Cambio actual':   p > 0 ? +((p - costBOB)   / p * 100).toFixed(2) : null,
      'Cambio simulado': p > 0 ? +((p - simCostBOB) / p * 100).toFixed(2) : null,
    }
  })

  // ── Lead time desde el proveedor del producto ─────────────────────────────
  const supplier   = suppliers.find(s => s.id === product.supplierId)
  const leadMonths = (parseInt(supplier?.leadTime) || 30) / 30

  // ── AI recommendation ─────────────────────────────────────────────────────
  let aiType, aiMsg
  if (simMarginPct < 0) {
    aiType = 'danger'
    aiMsg  = `El precio simulado (Bs ${Math.round(simPrice)}) no cubre el costo unitario (Bs ${Math.round(simCostBOB)}). El precio mínimo viable es Bs ${Math.round(simCostBOB * 1.02)}.`
  } else if (dMargin >= 6) {
    aiType = 'success'
    aiMsg  = `Escenario muy favorable: el margen de ${product.name} sube ${dMargin.toFixed(1)} pp hasta ${simMarginPct.toFixed(1)}%. Considera implementar el ajuste de forma gradual.`
  } else if (dMargin <= -6) {
    aiType = 'danger'
    aiMsg  = `Alerta: el margen cae ${Math.abs(dMargin).toFixed(1)} pp${dollarChange > 0 ? `. La variación cambiaria eleva el costo en Bs ${Math.round((simCostBOB - costBOB) * simDemand)}/mes` : ''}. Evalúa ajuste de precio.`
  } else if (dMargin < -2) {
    aiType = 'warning'
    aiMsg  = priceChange < 0
      ? `El descuento de precio reduce el margen ${Math.abs(dMargin).toFixed(1)} pp. Verifica que el aumento de volumen compense la pérdida de rentabilidad.`
      : `El margen baja ${Math.abs(dMargin).toFixed(1)} pp, principalmente por el alza de costos. Revisar estructura de precios.`
  } else if (isFinite(simStockMonths) && simStockMonths < leadMonths) {
    aiType = 'warning'
    aiMsg  = `Con la demanda proyectada (${Math.round(simDemand)} u/mes), el stock cubre ${simStockMonths.toFixed(1)} mes${simStockMonths === 1 ? '' : 'es'} — menos que el lead time de ${supplier?.name ?? 'el proveedor'} (${supplier?.leadTime ?? '—'}). Coordinar reorden urgente.`
  } else if (simProfit > curProfit * 1.08 && simMarginPct > 0) {
    aiType = 'success'
    aiMsg  = `La ganancia proyectada (${fmtBs(simProfit)}/mes) supera el escenario actual en ${dProfit.toFixed(0)}%. Condiciones favorables para ${product.name}.`
  } else {
    aiType = 'info'
    aiMsg  = `Escenario neutro: margen en ${simMarginPct.toFixed(1)}% y ganancia en ${fmtBs(simProfit)}/mes. Monitorea tipo de cambio y tendencia de demanda.`
  }

  const AI_STYLE = {
    success: { bg:'#f0fdf4', border:'#86efac', text:'#166534', label:'Recomendación IA' },
    warning: { bg:'#fffbeb', border:'#fcd34d', text:'#92400e', label:'Advertencia IA'   },
    danger:  { bg:'#fef2f2', border:'#fca5a5', text:'#991b1b', label:'Alerta IA'        },
    info:    { bg:'#eff6ff', border:'#93c5fd', text:'#1e40af', label:'Análisis IA'      },
  }
  const ais = AI_STYLE[aiType]
  const st  = STATUS[product.status] ?? STATUS.optimal

  const reset      = () => { setDollarChange(0); setDemandChange(0); setPriceChange(0) }
  const applyPreset = p => { setDollarChange(p.s.dollar); setDemandChange(p.s.demand); setPriceChange(p.s.price) }
  const selectProduct = id => { setSelectedId(id); reset() }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-600 p-2.5 sm:p-3">
            <Calculator className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Simulador por Producto</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Analiza el impacto de cada escenario sobre un producto específico</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Resetear</span>
        </Button>
      </div>

      {/* ── Mobile: horizontal chip selector ─────────────────────────────── */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-3 mb-4 no-scrollbar">
        <div className="flex gap-2 w-max">
          {products.map(p => {
            const s = STATUS[p.status] ?? STATUS.optimal
            return (
              <button key={p.id}
                onClick={() => selectProduct(p.id)}
                className={cn(
                  'flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all',
                  selectedId === p.id
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600'
                )}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                {p.name.split(' ').slice(0, 2).join(' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: desktop product list ───────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 gap-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto…"
              className="w-full pl-8 pr-3 py-2 text-xs border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Product cards */}
          <div className="space-y-1.5">
            {filtered.map(p => {
              const s      = STATUS[p.status] ?? STATUS.optimal
              const active = p.id === selectedId
              const pCost  = p.costUSD * er
              const pMarginPct = p.currentPrice > 0
                ? ((p.currentPrice - pCost) / p.currentPrice) * 100 : 0
              return (
                <button key={p.id} onClick={() => selectProduct(p.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition-all duration-150',
                    active
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className={cn('text-xs font-semibold leading-snug truncate flex-1',
                      active ? 'text-purple-900' : 'text-gray-800')}>
                      {p.name}
                    </p>
                    <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <p className="text-[9px] text-gray-400">Precio</p>
                      <p className="text-[11px] font-bold text-gray-700">Bs {p.currentPrice}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Margen</p>
                      <p className={cn('text-[11px] font-bold',
                        pMarginPct > 10 ? 'text-emerald-600'
                        : pMarginPct > 3 ? 'text-amber-600'
                        : 'text-red-600')}>
                        {pMarginPct.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Demanda</p>
                      <p className="text-[11px] font-bold text-gray-700">{p.avgDemand} u/mes</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Presets */}
          <div className="mt-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Escenarios rápidos
            </p>
            <div className="space-y-1.5">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => applyPreset(p)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <p className="text-[11px] font-semibold text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: simulation panel ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Product header */}
          <div className="rounded-2xl border-2 p-4 sm:p-5"
            style={{ background: st.bg, borderColor: st.ring }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">{product.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background:'white', color: st.color, border:`1.5px solid ${st.ring}` }}>
                    {st.label}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">
                    {product.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Proveedor: {supplier?.name ?? '—'} · Lead time: {supplier?.leadTime ?? '—'} · {product.avgDemand} u/mes promedio
                </p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  { l:'Precio actual', v:`Bs ${product.currentPrice}`                                                      },
                  { l:'Costo USD',     v:`$${product.costUSD}`                                                              },
                  { l:'Costo BOB',     v:`Bs ${costBOB.toFixed(2)}`                                                        },
                  { l:'Margen actual', v:`${curMarginPct.toFixed(1)}%`,
                    c: curMarginPct > 10 ? '#16a34a' : curMarginPct > 3 ? '#d97706' : '#dc2626' },
                ].map((k, i) => (
                  <div key={i} className="text-center sm:text-left">
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{k.l}</p>
                    <p className="text-sm font-bold" style={{ color: k.c ?? '#111827' }}>{k.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sliders */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Variables de Simulación</CardTitle>
              <CardDescription className="text-xs">
                Mueve los sliders para ver el impacto en tiempo real sobre <strong>{product.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-0">
              <SliderRow
                label="Tipo de Cambio"
                sub={`USD/BOB: Bs ${er.toFixed(2)} → Bs ${simER.toFixed(2)}`}
                value={dollarChange} onChange={setDollarChange} min={-20} max={20}
              />
              <SliderRow
                label="Demanda"
                sub={`${product.avgDemand} → ${Math.round(simDemand)} u/mes`}
                value={demandChange} onChange={setDemandChange} min={-30} max={30}
              />
              <SliderRow
                label="Precio de Venta"
                sub={`Bs ${product.currentPrice} → Bs ${Math.round(simPrice)}`}
                value={priceChange} onChange={setPriceChange} min={-25} max={25}
              />
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Ingresos / mes" icon={TrendingUp} iconColor="text-blue-500"
              current={fmtBs(curRevenue)} projected={fmtBs(simRevenue)}
              delta={dRevenue} deltaLabel={`${dRevenue > 0 ? '+' : ''}${dRevenue.toFixed(1)}%`}
            />
            <KpiCard
              label="Ganancia / mes" icon={Calculator} iconColor="text-purple-500"
              current={fmtBs(curProfit)} projected={fmtBs(simProfit)}
              delta={dProfit} deltaLabel={`${dProfit > 0 ? '+' : ''}${dProfit.toFixed(1)}%`}
            />
            <KpiCard
              label="Margen bruto" icon={DollarSign} iconColor="text-amber-500"
              current={`${curMarginPct.toFixed(1)}%`} projected={`${simMarginPct.toFixed(1)}%`}
              delta={dMargin} deltaLabel={`${dMargin > 0 ? '+' : ''}${dMargin.toFixed(1)} pp`}
            />
            <KpiCard
              label="Cobertura stock" icon={Package} iconColor="text-teal-500"
              current={isFinite(curStockMonths) ? `${curStockMonths.toFixed(1)} meses` : '∞'}
              projected={isFinite(simStockMonths) ? `${simStockMonths.toFixed(1)} meses` : '∞'}
              delta={dStockMonths}
              deltaLabel={isFinite(simStockMonths) ? `${simStockMonths.toFixed(1)} meses` : '∞'}
            />
          </div>

          {/* Sensitivity chart */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Sensibilidad de Margen vs Precio</CardTitle>
              <CardDescription className="text-xs">
                Cómo varía el margen de <strong>{product.name}</strong> según el precio —
                con tipo de cambio actual y simulado. Línea roja = break-even.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sensitivityData} margin={{ top:8, right:16, left:-8, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="pct"
                    tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize:10, fill:'#9ca3af' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize:12, borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}
                    formatter={(v, name) => [`${v?.toFixed(1)}%`, name]}
                    labelFormatter={l => `Ajuste de precio: ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value:'Break-even', position:'insideTopRight', fontSize:9, fill:'#ef4444' }} />
                  <Line
                    type="monotone" dataKey="Cambio actual"
                    stroke="#3b82f6" strokeWidth={2.5} dot={false}
                    activeDot={{ r:4, strokeWidth:0 }}
                  />
                  <Line
                    type="monotone" dataKey="Cambio simulado"
                    stroke="#8b5cf6" strokeWidth={2.5} dot={false}
                    strokeDasharray={dollarChange === 0 ? '6 3' : undefined}
                    activeDot={{ r:4, strokeWidth:0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI recommendation */}
          <div className="rounded-2xl border-2 p-4 sm:p-5 flex items-start gap-3"
            style={{ background: ais.bg, borderColor: ais.border }}>
            <div className="shrink-0 rounded-lg p-2" style={{ background: ais.border + '99' }}>
              <Sparkle style={{ width:16, height:16, color: ais.text }} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: ais.text }}>{ais.label}</p>
              <p className="text-sm leading-relaxed text-gray-700">{aiMsg}</p>
            </div>
          </div>

          {/* Mobile presets */}
          <div className="lg:hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Escenarios rápidos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => applyPreset(p)}
                  className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
