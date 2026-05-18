import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { toast } from '../lib/toast'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Switch, Label } from '../components/ui'
import { DollarSign, TrendingUp, AlertCircle, Settings, Brain, Sparkles, History, Check, ChevronRight, X } from '../icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const EX_REF = 6.86

function pct(p, rate) {
  const cost = (p.costUSD || 0) * rate
  const price = p.currentPrice || 1
  return price > 0 ? ((price - cost) / price) * 100 : 0
}

function erosion(p, exNow) {
  return pct(p, EX_REF) - pct(p, exNow)
}

const SUPPLIER_MAP = {
  'Automotriz': { name: 'AutoFilter Import.', via: 'Miami',      country: 'USA'      },
  'Industrial':  { name: 'IndusFilter S.A.',   via: 'São Paulo',  country: 'Brasil'   },
}

function MiniLine({ data, color = '#f97316' }) {
  const W = 80, H = 32
  const min = Math.min(...data), rng = Math.max(...data) - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / rng) * H * 0.8 - H * 0.1,
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
    </svg>
  )
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const exchangeRateHistory = [
  { date:'10/5', rate:6.94 },{ date:'11/5', rate:6.95 },{ date:'12/5', rate:6.95 },
  { date:'13/5', rate:6.96 },{ date:'14/5', rate:6.96 },{ date:'15/5', rate:6.97 },
  { date:'16/5', rate:6.97 },{ date:'17/5', rate:6.97 },
]

const priceHistory = [{
  product: 'Filtro de Aire FA-2000',
  changes: [
    { date:'15 Ene 2024', oldPrice:220, newPrice:235, reason:'Ajuste anual' },
    { date:'10 Mar 2024', oldPrice:235, newPrice:245, reason:'Tipo de cambio' },
  ],
}]

const aiPredictions = [
  { title:'Predicción Tipo de Cambio',    desc:'El algoritmo predice que el USD/BOB alcanzará Bs 7.05 en los próximos 30 días (+1.1%).', rec:'Considera ajustar precios preventivamente o fijar contratos en BOB.', confidence:84 },
  { title:'Elasticidad de Precio Óptima', desc:'Para Filtro FA-2000, la IA sugiere precio óptimo de Bs 272 (margen 42%).', rec:'Prueba incremento gradual del 10% monitoreando volumen de ventas.', confidence:79 },
]

export default function PriceCommittee() {
  const { products, exchangeRate, applyPriceChange } = useAppContext()
  const [autoApply, setAutoApply]     = useState(false)
  const [tab, setTab]                 = useState('proveedor')
  const [selectedSKU, setSelectedSKU] = useState(null)
  const [approved, setApproved]       = useState(new Set())
  const [showPostpone, setShowPostpone] = useState(false)
  const [meetingPostponed, setMeetingPostponed] = useState(null)

  const now = new Date()
  const monthLabel = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`
  const exNow = exchangeRate.current

  const recs = useMemo(() =>
    products.filter(p => p.currentPrice !== p.recommendedPrice).map(p => {
      const diff = p.recommendedPrice - p.currentPrice
      const pctChange = ((diff / p.currentPrice) * 100).toFixed(1)
      const eros = erosion(p, exNow).toFixed(1)
      const costChange = ((exNow - EX_REF) / EX_REF * 100).toFixed(1)
      const sup = SUPPLIER_MAP[p.category] || { name: p.category, via: 'varios', country: 'Varios' }
      const curMargin = pct(p, exNow)
      const newMargin = p.recommendedPrice > 0
        ? ((p.recommendedPrice - p.costUSD * exNow) / p.recommendedPrice * 100) : 0
      return { ...p, diff, pctChange, eros, costChange, supplier: sup, curMargin, newMargin }
    }), [products, exNow])

  const suppGroups = useMemo(() => {
    const map = {}
    recs.forEach(p => {
      const key = p.supplier.name
      if (!map[key]) map[key] = { ...p.supplier, items: [] }
      map[key].items.push(p)
    })
    return Object.values(map)
  }, [recs])

  const famGroups = useMemo(() => {
    const map = {}
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = { category: p.category, total: 0, withRec: 0, items: [] }
      map[p.category].total++
      const rec = recs.find(r => r.id === p.id)
      if (rec) { map[p.category].withRec++; map[p.category].items.push(rec) }
    })
    return Object.values(map)
  }, [products, recs])

  const margenAgregado = useMemo(() => {
    if (!products.length) return 0
    const totRev  = products.reduce((s,p) => s + (p.currentPrice||0)*(p.avgDemand||0), 0)
    const totCost = products.reduce((s,p) => s + (p.costUSD||0)*exNow*(p.avgDemand||0), 0)
    return totRev > 0 ? +((totRev - totCost) / totRev * 100).toFixed(1) : 0
  }, [products, exNow])

  const margenRef = useMemo(() => {
    if (!products.length) return 0
    const totRev  = products.reduce((s,p) => s + (p.currentPrice||0)*(p.avgDemand||0), 0)
    const totCost = products.reduce((s,p) => s + (p.costUSD||0)*EX_REF*(p.avgDemand||0), 0)
    return totRev > 0 ? +((totRev - totCost) / totRev * 100).toFixed(1) : 0
  }, [products])

  const marginDrop = +(margenRef - margenAgregado).toFixed(1)
  const marginTrend = [margenRef, margenRef-0.5, margenRef-0.9, margenRef-1.4, margenRef-1.8, margenAgregado]

  const pending = recs.length
  const urgent  = recs.filter(r => r.status === 'critical').length

  const handleApproveGroup = (items, label) => {
    items.forEach(p => applyPriceChange(p.id))
    setApproved(prev => { const s = new Set(prev); items.forEach(p => s.add(p.id)); return s })
    toast.success(`✓ Ajuste aprobado para ${items.length} SKUs — ${label}`)
  }

  const handleApproveSKU = (p) => {
    applyPriceChange(p.id)
    setApproved(prev => { const s = new Set(prev); s.add(p.id); return s })
    toast.success(`✓ Precio actualizado: ${p.name}`)
  }

  const POSTPONE_OPTIONS = [
    { label: '1 semana',  days: 7  },
    { label: '2 semanas', days: 14 },
    { label: '1 mes',     days: 30 },
  ]

  const handlePostpone = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const label = d.toLocaleDateString('es-ES', { day:'numeric', month:'long' })
    setMeetingPostponed(label)
    setShowPostpone(false)
    toast.success(`Reunión pospuesta al ${label}`)
  }

  const handleCerrarComite = () => {
    recs.forEach(p => { if (!approved.has(p.id)) applyPriceChange(p.id) })
    toast.success('Comité cerrado · todos los ajustes pendientes se aplicaron')
  }

  const TABS = [
    { id:'proveedor', label:'Por proveedor'  },
    { id:'familia',   label:'Por familia'    },
    { id:'sku',       label:'Por SKU'        },
    { id:'exchange',  label:'USD/BOB'        },
    { id:'history',   label:'Historial'      },
  ]

  const skuSelected = selectedSKU || recs[0] || null

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">Comité de precios · {monthLabel}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Revisión activa · ajustes por lote o SKU individual · costo de referencia: última fijación
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Button variant="outline" size="sm" className="text-xs"
              onClick={() => setShowPostpone(p => !p)}>
              {meetingPostponed ? `Reunión: ${meetingPostponed}` : 'Posponer reunión'} ▾
            </Button>
            {showPostpone && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] py-1">
                <p className="text-[10px] text-gray-400 px-3 pt-2 pb-1 font-semibold uppercase tracking-wide">Posponer por</p>
                {POSTPONE_OPTIONS.map(o => (
                  <button key={o.days} onClick={() => handlePostpone(o.days)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    {o.label}
                  </button>
                ))}
                <div className="border-t mt-1 pt-1">
                  <button onClick={() => setShowPostpone(false)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button size="sm" className="text-xs flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800"
            onClick={handleCerrarComite}>
            <Check className="h-3.5 w-3.5"/>Cerrar comité
          </Button>
        </div>
      </div>

      {/* ── FX Banner ── */}
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 sm:p-4 mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-amber-600"/>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">
              Tipo de cambio: USD Bs. {exNow} · referencia de la última fijación: Bs. {EX_REF}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Variación {exchangeRate.change}% supera el umbral de 1.0%. Sistema generó recomendaciones de ajuste sobre {pending} productos afectados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-amber-600 font-medium">Margen agregado</p>
            <p className="text-xl font-black text-amber-900">{margenAgregado}%</p>
            <p className="text-xs text-red-600 font-semibold">↓{marginDrop}pp</p>
          </div>
          <MiniLine data={marginTrend} color="#f97316"/>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-1 leading-tight">Tipo de Cambio</p>
            <p className="text-lg sm:text-3xl font-bold text-blue-900 leading-none">Bs {exNow}</p>
            <div className="flex items-center gap-0.5 mt-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-600"/>
              <span className="text-xs sm:text-sm font-semibold text-red-600">+{exchangeRate.change}%</span>
            </div>
            <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">{exchangeRate.lastUpdated}</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-1 leading-tight">Pendientes</p>
            <p className="text-lg sm:text-3xl font-bold text-red-600 leading-none">{pending}</p>
            <p className="text-[9px] sm:text-xs text-gray-500 mt-1">{urgent} urgentes</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-1 leading-tight">Margen</p>
            <p className="text-lg sm:text-3xl font-bold text-orange-600 leading-none">{margenAgregado}%</p>
            <p className="text-[9px] sm:text-xs text-red-500 mt-1">↓{marginDrop}pp</p>
          </CardContent>
        </Card>
      </div>

      {/* ── AI Predictions ── */}
      <Card className="border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600"/>
            <CardTitle className="text-sm sm:text-lg">Análisis Predictivo de Precios</CardTitle>
          </div>
          <CardDescription className="text-xs">Recomendaciones basadas en ML para optimización de precios y márgenes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiPredictions.map((p, i) => (
              <div key={i} className="rounded-xl border-2 border-blue-200 bg-white p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-semibold text-sm leading-snug">{p.title}</h4>
                  <span className="text-[10px] border rounded-md px-1.5 py-0.5 shrink-0 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5 inline"/>{p.confidence}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">{p.desc}</p>
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-blue-900">💡 {p.rec}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main tabs ── */}
      <div className="mb-2">
        <div className="flex gap-0 border-b overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.id
                  ? 'border-purple-700 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
          {tab === 'proveedor' && <p className="hidden sm:flex items-center text-xs text-gray-400 ml-3">Ajustes por proveedor de origen — útil cuando el costo cambia para toda la línea.</p>}
          {tab === 'familia'   && <p className="hidden sm:flex items-center text-xs text-gray-400 ml-3">Ajustes por familia de filtros — mantiene coherencia entre productos sustitutos.</p>}
          {tab === 'sku'       && <p className="hidden sm:flex items-center text-xs text-gray-400 ml-3">Revisión individual — {recs.length} SKUs priorizados por impacto en margen.</p>}
        </div>
      </div>

      {/* ── Por proveedor ── */}
      {tab === 'proveedor' && (
        <div className="space-y-4 mt-4">
          {suppGroups.length === 0 ? (
            <Card className="border-2"><CardContent className="py-10 text-center text-gray-400">Sin ajustes pendientes por proveedor</CardContent></Card>
          ) : suppGroups.map((g, i) => {
            const avgAdj = (g.items.reduce((s,p) => s + parseFloat(p.pctChange), 0) / g.items.length).toFixed(1)
            const impactBs = g.items.reduce((s,p) => s + (p.recommendedPrice-p.currentPrice)*(p.avgDemand||0), 0)
            const allApproved = g.items.every(p => approved.has(p.id))
            return (
              <Card key={i} className="border-2">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{g.name} (vía {g.via})</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{g.country}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">moneda compra: USD</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {g.items.length} de {products.filter(p=>p.category===g.items[0]?.category).length} SKUs afectados ·
                        costo movió <span className="text-orange-600 font-semibold">+{g.items[0]?.costChange}%</span> ·
                        margen erosionado <span className="text-red-600 font-semibold">−{g.items[0]?.eros}pp</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">Ajuste sugerido (lote)</p>
                      <p className="text-2xl font-black text-purple-700">+{avgAdj}%</p>
                      <p className="text-[10px] text-gray-400">impacto +Bs. {Math.round(impactBs/1000)}K margen</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">SKUs en el lote:</span>
                    {g.items.slice(0,3).map((p,j) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{p.id}</span>
                    ))}
                    {g.items.length > 3 && <span className="text-xs text-gray-400">+{g.items.length-3} más</span>}
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button onClick={() => toast.info(`Sin ajuste — ${g.name}`)}
                      className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                      <X className="h-3 w-3"/>Sin ajuste
                    </button>
                    <button onClick={() => setTab('sku')}
                      className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                      Revisar por SKU
                    </button>
                    <button onClick={() => handleApproveGroup(g.items, g.name)}
                      disabled={allApproved}
                      className={cn('flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors',
                        allApproved
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-purple-700 text-white hover:bg-purple-800')}>
                      <Check className="h-3 w-3"/>
                      {allApproved ? 'Aprobado' : `Aprobar +${avgAdj}% al lote`}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Por familia ── */}
      {tab === 'familia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {famGroups.map((g, i) => {
            const avgAdj = g.items.length
              ? (g.items.reduce((s,p) => s + parseFloat(p.pctChange), 0) / g.items.length).toFixed(1) : '0.0'
            const avgEros = g.items.length
              ? (g.items.reduce((s,p) => s + parseFloat(p.eros), 0) / g.items.length).toFixed(1) : '0.0'
            const allApproved = g.items.every(p => approved.has(p.id))
            const coveragePct = g.total > 0 ? Math.round(g.withRec / g.total * 100) : 0
            return (
              <Card key={i} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-base">Filtros {g.category}</h3>
                      <p className="text-xs text-gray-500">{g.withRec} de {g.total} SKUs con brecha de margen</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Ajuste sugerido</p>
                      <p className="text-xl font-black text-purple-700">+{avgAdj}%</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between text-gray-500">
                      <span>Brecha de margen actual</span>
                      <span className="font-semibold text-red-600">−{avgEros}pp</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Cobertura del ajuste</span>
                      <span className="font-semibold text-gray-800">{coveragePct}% del catálogo familiar</span>
                    </div>
                  </div>

                  {g.items.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => toast.info(`Sin ajuste — ${g.category}`)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50">
                        <X className="h-3 w-3 text-gray-500"/>
                      </button>
                      <button onClick={() => { setTab('sku') }}
                        className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50">
                        Detalles
                      </button>
                      <button onClick={() => handleApproveGroup(g.items, g.category)}
                        disabled={allApproved}
                        className={cn('flex-1 flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1.5',
                          allApproved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-700 text-white hover:bg-purple-800')}>
                        <Check className="h-3 w-3"/>
                        {allApproved ? 'Aprobado' : 'Aprobar lote'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">✓ Sin ajustes necesarios</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Por SKU ── */}
      {tab === 'sku' && (
        <div className="mt-4">
          {recs.length === 0 ? (
            <Card className="border-2"><CardContent className="py-10 text-center text-gray-400">Sin ajustes pendientes</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              {/* SKU list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>{recs.filter(p=>!approved.has(p.id)).length} pendientes · {approved.size} aprobados · 0 rechazados</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto" className="text-xs">Auto-aplicar</Label>
                    <Switch id="auto" checked={autoApply} onCheckedChange={setAutoApply}/>
                  </div>
                </div>
                {recs.map((p, i) => {
                  const isApproved = approved.has(p.id)
                  const isSelected = skuSelected?.id === p.id
                  return (
                    <div key={i} onClick={() => setSelectedSKU(p)}
                      className={cn('rounded-xl border-2 p-4 cursor-pointer transition-colors',
                        isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300',
                        isApproved && 'opacity-60')}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-gray-500">{p.id}</span>
                            <span className="text-xs text-gray-400">{p.supplier.name}</span>
                          </div>
                          <p className="font-semibold text-sm">{p.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400">Sugerencia</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-gray-400 line-through">Bs. {p.currentPrice}</span>
                            <span className="text-lg font-black text-gray-900">Bs. {p.recommendedPrice}</span>
                          </div>
                          <span className="text-xs font-semibold text-purple-700">+{p.pctChange}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-gray-400">Margen actual → objetivo</p>
                          <p>
                            <span className="text-red-600 font-semibold">{p.curMargin.toFixed(1)}%</span>
                            <span className="text-gray-400 mx-1">↗</span>
                            <span className="text-green-600 font-semibold">{p.newMargin.toFixed(1)}%</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Costo USD</p>
                          <p className="font-semibold">${p.costUSD}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Dem. mensual</p>
                          <p className="font-semibold">{p.avgDemand} u.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button onClick={e => { e.stopPropagation(); toast.info(`Ajuste rechazado: ${p.name}`) }}
                          className="flex items-center gap-1 text-xs text-gray-500 border rounded-lg px-2.5 py-1 hover:bg-gray-50">
                          <X className="h-3 w-3"/>Rechazar
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleApproveSKU(p) }}
                          disabled={isApproved}
                          className={cn('flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1',
                            isApproved ? 'bg-green-100 text-green-700' : 'bg-purple-700 text-white hover:bg-purple-800')}>
                          <Check className="h-3 w-3"/>
                          {isApproved ? 'Aprobado' : `Aprobar +Bs. ${p.diff}`}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Analysis panel */}
              {skuSelected && (
                <div className="lg:sticky lg:top-4">
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Análisis · {skuSelected.id}</p>
                      <p className="text-sm font-semibold mb-3">{skuSelected.name}</p>

                      <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 mb-4 text-xs text-purple-800 leading-relaxed">
                        <Sparkles className="h-3.5 w-3.5 inline mr-1 text-purple-600"/>
                        USD +{exchangeRate.change}% sobre tipo de cambio de referencia.
                        Margen cayó de {(pct(skuSelected, EX_REF)).toFixed(1)}% a {skuSelected.curMargin.toFixed(1)}%.
                        Ajuste +{skuSelected.pctChange}% recupera margen objetivo.
                      </div>

                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Simulación de impacto</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1.5 text-gray-400 font-medium">Escenario</th>
                            <th className="text-right py-1.5 text-gray-400 font-medium">Sin ajuste</th>
                            <th className="text-right py-1.5 text-purple-700 font-medium">Con ajuste</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="py-2 text-gray-600">Precio</td>
                            <td className="py-2 text-right font-mono">Bs. {skuSelected.currentPrice}</td>
                            <td className="py-2 text-right font-mono font-bold text-purple-700">Bs. {skuSelected.recommendedPrice}</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-gray-600">Margen</td>
                            <td className="py-2 text-right text-red-600 font-semibold">{skuSelected.curMargin.toFixed(1)}%</td>
                            <td className="py-2 text-right text-green-600 font-semibold">{skuSelected.newMargin.toFixed(1)}%</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-gray-600">Vol. proyectado</td>
                            <td className="py-2 text-right">{skuSelected.avgDemand} u.</td>
                            <td className="py-2 text-right">{Math.round(skuSelected.avgDemand*0.95)} u.</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-gray-600">Margen total</td>
                            <td className="py-2 text-right font-mono">
                              Bs. {Math.round((skuSelected.currentPrice - skuSelected.costUSD*exNow) * skuSelected.avgDemand).toLocaleString('es')}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-purple-700">
                              Bs. {Math.round((skuSelected.recommendedPrice - skuSelected.costUSD*exNow) * skuSelected.avgDemand * 0.95).toLocaleString('es')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── USD/BOB ── */}
      {tab === 'exchange' && (
        <Card className="border-2 mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Historial USD/BOB — Última Semana</CardTitle>
            <CardDescription className="text-xs">Monitoreo continuo del tipo de cambio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={exchangeRateHistory} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false}/>
                <YAxis domain={[6.93, 6.98]} tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5}
                  name="USD/BOB" dot={{ fill:'#3b82f6', r:4 }}/>
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label:'Mínimo (7d)', value:'Bs 6.94', cls:'bg-blue-50 border-blue-200 text-blue-900'   },
                { label:'Máximo (7d)', value:'Bs 6.97', cls:'bg-green-50 border-green-200 text-green-900' },
                { label:'Variación',   value:'+0.43%',  cls:'bg-amber-50 border-amber-200 text-amber-900' },
              ].map((s, i) => (
                <div key={i} className={cn('rounded-xl border p-3', s.cls)}>
                  <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                  <p className="text-base sm:text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Historial ── */}
      {tab === 'history' && (
        <Card className="border-2 mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Historial de Cambios de Precio</CardTitle>
            <CardDescription className="text-xs">Últimos ajustes realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {priceHistory.map((it, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 shrink-0"/>{it.product}
                  </h4>
                  {it.changes.map((c, j) => (
                    <div key={j} className="ml-5 pl-4 border-l-2 border-blue-200 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{c.date}</span>
                        <span className="text-[10px] border rounded-md px-1.5 py-0.5">{c.reason}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold line-through text-gray-400">Bs {c.oldPrice}</span>
                        <span className="text-gray-400 text-sm">→</span>
                        <span className="text-base font-bold text-green-600">Bs {c.newPrice}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                          +{((c.newPrice - c.oldPrice) / c.oldPrice * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
