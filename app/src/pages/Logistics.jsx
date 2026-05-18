import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { toast } from '../lib/toast'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Progress } from '../components/ui'
import { Ship, Clock, Package2, MapPin, Plus, X, Download, Check, Sparkles } from '../icons'
import * as XLSX from 'xlsx'

// ─── Stage timeline ────────────────────────────────────────────────────────
const STAGES = ['Pedido','Producción','Tránsito','Aduana','Recibido']

function StageTimeline({ stage }) {
  return (
    <div className="flex items-start pt-1">
      {STAGES.map((s, i) => {
        const done   = i < stage
        const active = i === stage
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all',
                done   ? 'bg-[#4D17FC] text-white' :
                active ? 'bg-[#4D17FC] text-white ring-4 ring-purple-100' :
                         'bg-white text-gray-400 border-2 border-gray-200'
              )}>
                {done ? <Check style={{ width:10, height:10 }}/> : i + 1}
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-400 whitespace-nowrap hidden sm:block">{s}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-0.5 sm:mx-1 mt-[-14px] sm:mt-[-12px]', done ? 'bg-[#4D17FC]' : 'bg-gray-200')}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Inline sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, color = '#4D17FC', w = 80, h = 28 }) {
  if (!data?.length || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, pad = 3
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - pad - ((v - min) / range) * (h - pad * 2)}`)
  const id = `sp${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={`M ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`} fill={`url(#${id})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── KPI card (flat, reference style) ─────────────────────────────────────
function KpiFlat({ label, value, sub, sub2, spark, sparkColor, arrow, arrowColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{value}</p>
          {sub && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {arrow && <span className={cn('text-xs font-semibold', arrowColor || 'text-green-600')}>{arrow}</span>}
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          )}
          {sub2 && <p className="text-xs text-gray-400 mt-0.5">{sub2}</p>}
        </div>
        {spark && <Sparkline data={spark} color={sparkColor} w={80} h={32}/>}
      </div>
    </div>
  )
}

// ─── Incoterm descriptions ────────────────────────────────────────────────
const INCOTERM_INFO = {
  EXW: { emoji:'🏭', texto:'Retirás la mercadería en la fábrica del proveedor. Todo el transporte, seguro y aduana corre completamente por tu cuenta.' },
  FCA: { emoji:'🚛', texto:'El proveedor entrega al transportista que vos elegís. Desde ahí el riesgo y los costos son tuyos.' },
  FAS: { emoji:'⚓', texto:'El proveedor deja la carga al costado del barco en el puerto de origen. Vos pagás la carga al barco, el flete y la aduana.' },
  FOB: { emoji:'🚢', texto:'El proveedor paga hasta poner la carga dentro del barco. El flete, el seguro y la aduana de destino corren por tu cuenta.' },
  CFR: { emoji:'🌊', texto:'El proveedor paga el flete hasta el puerto de destino, pero el seguro lo pagás vos. La aduana también es tuya.' },
  CIF: { emoji:'🛡️', texto:'El proveedor paga el flete y el seguro hasta el puerto de destino. La aduana y el transporte interno corren por tu cuenta.' },
  CPT: { emoji:'📦', texto:'El proveedor paga el flete hasta el lugar de destino acordado. El seguro y los riesgos del viaje son tuyos.' },
  CIP: { emoji:'🔒', texto:'El proveedor paga el flete y el seguro hasta el destino acordado. Solo la aduana y descarga final corren por tu cuenta.' },
  DPU: { emoji:'🏗️', texto:'El proveedor entrega la carga descargada en el lugar de destino. Solo los trámites de importación quedan de tu lado.' },
  DAP: { emoji:'🎯', texto:'El proveedor entrega la carga en tu puerta lista para descargar. Solo pagás los impuestos y trámites de importación.' },
  DDP: { emoji:'✅', texto:'El proveedor se hace cargo de absolutamente todo — flete, seguro e impuestos de importación. La carga llega lista a tu depósito.' },
}

// ─── Nueva orden drawer ────────────────────────────────────────────────────
function NuevaOrdenDrawer({ onClose, onAdd }) {
  const [form, setForm] = useState({ supplier:'', origin:'', route:'Marítimo', items:0, skus:0, valueUsd:0, eta:'', incoterm:'FOB' })
  const upd = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.supplier || !form.eta) { toast.error('Completa los campos obligatorios'); return }
    onAdd(form)
    toast.success(`Importación creada: ${form.supplier}`)
    onClose()
  }

  return (
    <>
      <motion.div key="ol" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.2 }} onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"/>
      <motion.div key="dw" initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-50 flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Nueva importación</h2>
            <p className="text-xs text-gray-500">Registra un nuevo pedido a proveedor</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X style={{ width:16, height:16 }}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            { label:'Proveedor *',         key:'supplier', type:'text',   ph:'Ej: WEGA — Buenos Aires' },
            { label:'Ciudad de origen *',  key:'origin',   type:'text',   ph:'Ej: Buenos Aires, Argentina' },
            { label:'ETA (fecha llegada)*',key:'eta',      type:'text',   ph:'Ej: Jun 30, 2026' },
            { label:'Unidades',            key:'items',    type:'number', ph:'412' },
            { label:'SKUs distintos',      key:'skus',     type:'number', ph:'86' },
            { label:'Valor FOB (USD)',      key:'valueUsd', type:'number', ph:'38420' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={form[f.key]}
                onChange={e => upd(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"/>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de transporte</label>
            <select value={form.route} onChange={e => upd('route', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
              {['Marítimo','Terrestre','Aéreo'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Incoterm</label>
            <select value={form.incoterm} onChange={e => upd('incoterm', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
              <optgroup label="── Cualquier medio de transporte ──">
                <option value="EXW">EXW — Ex Works (en fábrica del proveedor)</option>
                <option value="FCA">FCA — Free Carrier (entrega al transportista)</option>
                <option value="CPT">CPT — Carriage Paid To (flete pagado hasta destino)</option>
                <option value="CIP">CIP — Carriage &amp; Insurance Paid (flete + seguro)</option>
                <option value="DAP">DAP — Delivered at Place (entregado en destino)</option>
                <option value="DPU">DPU — Delivered at Place Unloaded (descargado en destino)</option>
                <option value="DDP">DDP — Delivered Duty Paid (todo incluido, impuestos también)</option>
              </optgroup>
              <optgroup label="── Solo transporte marítimo ──">
                <option value="FAS">FAS — Free Alongside Ship (al costado del barco)</option>
                <option value="FOB">FOB — Free On Board (puesto en el barco)</option>
                <option value="CFR">CFR — Cost &amp; Freight (costo + flete marítimo)</option>
                <option value="CIF">CIF — Cost, Insurance &amp; Freight (costo + seguro + flete)</option>
              </optgroup>
            </select>
            {INCOTERM_INFO[form.incoterm] && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base shrink-0">{INCOTERM_INFO[form.incoterm].emoji}</span>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>{form.incoterm}:</strong> {INCOTERM_INFO[form.incoterm].texto}
                </p>
              </div>
            )}
          </div>
        </form>
        <div className="px-5 py-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-[#4D17FC] hover:bg-[#3F12D6]" onClick={handleSubmit}>
            <Plus style={{ width:14, height:14, marginRight:6 }}/>Crear importación
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
const suppliers = [
  { name:'FilterTech China Co.',   country:'China',  leadTime:'45-60 días', reliability:95, products:8,  activeOrders:2 },
  { name:'Industrial Filters USA', country:'USA',    leadTime:'15-20 días', reliability:98, products:5,  activeOrders:1 },
  { name:'Filtros Brasil Ltda',    country:'Brasil', leadTime:'10-15 días', reliability:92, products:12, activeOrders:1 },
]

// stage index mapping (0-based)
const stageMap = { 'planning':0, 'in-transit':2, 'customs':3, 'delivered':4 }

function routeIcon(route) {
  if (route?.includes('Aéreo'))     return '✈'
  if (route?.includes('Terrestre')) return '🚛'
  return '🚢'
}

export default function Logistics() {
  const { shipments, addShipment, exchangeRate } = useAppContext()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandProviders, setExpandProviders] = useState(false)

  const activeShip   = shipments.filter(s => s.status !== 'delivered').length
  const inTransit    = shipments.filter(s => s.status === 'in-transit').length
  const totalCost    = shipments.reduce((a, s) => a + parseFloat(s.cost.replace(/[$,]/g, '')), 0)
  const delayed      = shipments.filter(s => s.status === 'customs').length
  const nextArrival  = shipments.filter(s => s.status !== 'delivered').sort((a,b) => a.eta.localeCompare(b.eta))[0]

  // Spark data
  const shipSpark  = [2,3,2,4,3,4,3,inTransit]
  const valueSpark = [18,22,19,24,21,25,24,Math.round(totalCost/1000)]

  const downloadTablero = () => {
    const wb   = XLSX.utils.book_new()
    const fecha = new Date().toISOString().slice(0,10)

    const wsEnvios = XLSX.utils.aoa_to_sheet([
      ['ID','Origen','País origen','Destino','Estado','Progreso %','ETA','Transportista','Ruta','Costo'],
      ...shipments.map(s => [
        s.id,
        s.origin.city, s.origin.country,
        `${s.destination.city}, ${s.destination.country}`,
        s.status, s.progress, s.eta, s.carrier, s.route, s.cost,
      ]),
    ])
    XLSX.utils.book_append_sheet(wb, wsEnvios, 'Envíos')

    const wsKpis = XLSX.utils.aoa_to_sheet([
      ['KPI','Valor'],
      ['Envíos activos',             activeShip],
      ['En tránsito',                inTransit],
      ['En aduana (retraso)',         delayed],
      ['Valor total en tránsito USD', totalCost],
      ['Valor total en tránsito BOB', (totalCost * exchangeRate.current).toFixed(0)],
      ['Próxima llegada',             nextArrival?.eta || '—'],
      ['Transportista próxima llegada', nextArrival?.carrier || '—'],
    ])
    XLSX.utils.book_append_sheet(wb, wsKpis, 'KPIs')

    const wsProv = XLSX.utils.aoa_to_sheet([
      ['Proveedor','País','Lead Time','Confiabilidad','Productos','Órdenes activas'],
      ...suppliers.map(s => [s.name, s.country, s.leadTime, `${s.reliability}%`, s.products, s.activeOrders]),
    ])
    XLSX.utils.book_append_sheet(wb, wsProv, 'Proveedores')

    XLSX.writeFile(wb, `TableroLogistico_${fecha}.xlsx`)
    toast.success('Tablero logístico descargado (3 hojas: Envíos, KPIs, Proveedores)')
  }

  const handleAdd = (form) => {
    addShipment({
      origin: { city: form.origin.split(',')[0]?.trim() || form.origin, country: form.origin.split(',')[1]?.trim() || '' },
      destination: { city:'Santa Cruz', country:'Bolivia' },
      status: 'planning', progress: 5,
      eta: form.eta, departed: '—', estimated: form.eta,
      products: [], route: form.route, carrier: form.supplier,
      cost: `$${form.valueUsd.toLocaleString()}`,
    })
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Logística de importación</h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeShip} envíos en curso · USD {(totalCost/1000).toFixed(1)}K en tránsito · landed cost promedio +21.3%
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={downloadTablero}>
              <Download className="h-3.5 w-3.5 mr-1.5"/>Tablero logístico
            </Button>
            <Button size="sm" className="bg-[#4D17FC] hover:bg-[#3F12D6]"
              onClick={() => setDrawerOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5"/>Nueva orden
            </Button>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiFlat
            label="En tránsito"
            value={`${inTransit} embarques`}
            sub={`${shipments.reduce((a,s) => a + s.products.reduce((b,p) => b + p.quantity,0), 0).toLocaleString()} unidades en camino`}
            spark={shipSpark} sparkColor="#4D17FC"
          />
          <KpiFlat
            label="Valor en tránsito"
            value={`USD ${(totalCost/1000).toFixed(0)}K`}
            arrow="+18%"
            sub={`Bs ${(totalCost * exchangeRate.current / 1000).toFixed(0)}K`}
            spark={valueSpark} sparkColor="#4D17FC"
          />
          <KpiFlat
            label="Próxima llegada"
            value={nextArrival?.eta?.split(',')[0] || '—'}
            sub={nextArrival ? `${nextArrival.carrier} · ${nextArrival.origin.city} → ${nextArrival.destination.city}` : 'Sin envíos activos'}
          />
          <KpiFlat
            label="Embarques con retraso"
            value={delayed}
            arrow={delayed > 0 ? `${delayed} activos` : '✓ Sin retrasos'}
            arrowColor={delayed > 0 ? 'text-red-600' : 'text-green-600'}
            sub={delayed > 0 ? '6 días promedio' : 'Todos en tiempo'}
          />
        </div>

        {/* ── AI Insights ─────────────────────────────────────── */}
        <Card className="border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600"/>
              <CardTitle className="text-base">Optimización Inteligente de Logística</CardTitle>
            </div>
            <CardDescription className="text-xs">IA analiza rutas, tiempos y costos para maximizar eficiencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title:'Optimización de Ruta Detectada', desc:'Cambiar Shanghai→Arica a Shanghai→Callao→Santa Cruz ahorraría 8 días y $1,200 en flete.', tag:'Ahorro: $1,200 · 8 días', tagColor:'text-green-600', confidence:89 },
                { title:'Riesgo de Retraso Aduanero', desc:`Envío ${shipments.find(s=>s.status==='customs')?.id || 'en aduana'} tiene 68% de probabilidad de retraso. Gestión preventiva recomendada.`, tag:'Riesgo: Alto', tagColor:'text-red-600', confidence:68 },
                { title:'Proveedor Alternativo Disponible', desc:'Para productos industriales, Brasil Imports ofrece 12 días menos de lead time al mismo costo.', tag:'Mejora: 12 días más rápido', tagColor:'text-blue-600', confidence:82 },
              ].map((ins, i) => (
                <div key={i} className="rounded-xl border-2 border-blue-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm leading-snug flex-1">{ins.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{ins.desc}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className={cn('text-xs font-semibold', ins.tagColor)}>{ins.tag}</span>
                    <Badge variant="outline" className="text-[10px]">{ins.confidence}% confianza</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Shipment cards ──────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {shipments.map((sh, i) => {
            const stage = stageMap[sh.status] ?? 0
            const isDelayed = sh.status === 'customs'
            const totalQty = sh.products.reduce((a, p) => a + p.quantity, 0)
            const costNum  = parseFloat(sh.cost.replace(/[$,]/g, ''))
            const daysLeft = sh.eta ? sh.eta : '—'

            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5">

                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    {/* Transport icon */}
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">
                      {routeIcon(sh.route)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {sh.id}
                        </span>
                        {sh.status === 'delivered' ? (
                          <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
                            <Check style={{ width:10, height:10 }}/> Recibido
                          </span>
                        ) : isDelayed ? (
                          <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            ● Retraso
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                            ● En curso
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base leading-tight">{sh.carrier}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sh.route} · {sh.origin.city} → {sh.destination.city} · Incoterm FOB
                      </p>
                    </div>
                  </div>

                  {/* Right metrics */}
                  <div className="hidden sm:flex items-start gap-6 shrink-0 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Unidades</p>
                      <p className="text-xl font-bold">{totalQty > 0 ? totalQty.toLocaleString() : sh.products.length > 0 ? sh.products.reduce((a,p)=>a+p.quantity,0) : '—'}</p>
                      <p className="text-[10px] text-gray-400">{sh.products.length} SKUs</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Valor FOB</p>
                      <p className="text-xl font-bold">{sh.cost}</p>
                      <p className="text-[10px] text-gray-400">landed +21%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">ETA</p>
                      <p className="text-xl font-bold text-gray-900">{sh.eta?.split(',')[0] || '—'}</p>
                      <p className="text-[10px] text-gray-400">en {sh.eta}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile metrics */}
                <div className="flex sm:hidden gap-4 mb-3 text-sm">
                  <div><span className="text-gray-400">Valor: </span><span className="font-bold">{sh.cost}</span></div>
                  <div><span className="text-gray-400">ETA: </span><span className="font-bold">{sh.eta}</span></div>
                </div>

                {/* Stage timeline */}
                <div className="pt-3 border-t border-gray-50">
                  <StageTimeline stage={stage}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Routes ──────────────────────────────────────────── */}
        <Card className="border-2 mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rutas de importación</CardTitle>
            <CardDescription className="text-xs">Análisis comparativo de rutas logísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { route:'Asia → Chile → Bolivia',        avgTime:'50 días', cost:'$$',   reliability:'Alta',     volume:'Alto'  },
                { route:'USA → Bolivia (Aéreo)',          avgTime:'15 días', cost:'$$$$', reliability:'Muy Alta', volume:'Medio' },
                { route:'Brasil → Bolivia (Terrestre)',   avgTime:'12 días', cost:'$',    reliability:'Media',    volume:'Alto'  },
              ].map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Ship className="h-4 w-4 text-blue-600"/>
                    <h4 className="font-semibold text-sm">{r.route}</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label:'Tiempo prom.', value:r.avgTime, cls:'bg-blue-50 border-blue-200 text-blue-900' },
                      { label:'Costo',        value:r.cost,    cls:'bg-green-50 border-green-200 text-green-900' },
                      { label:'Confiabilidad',value:r.reliability, cls:'bg-purple-50 border-purple-200 text-purple-900' },
                      { label:'Volumen',      value:r.volume,  cls:'bg-amber-50 border-amber-200 text-amber-900' },
                    ].map((c, j) => (
                      <div key={j} className={cn('rounded-lg border p-2.5', c.cls)}>
                        <p className="text-[10px] text-gray-500 mb-0.5">{c.label}</p>
                        <p className="font-bold text-sm">{c.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Suppliers (collapsible) ─────────────────────────── */}
        <Card className="border-2 mb-3">
          <button className="w-full text-left" onClick={() => setExpandProviders(p => !p)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Proveedores internacionales</CardTitle>
                <span className="text-gray-400 text-lg">{expandProviders ? '▲' : '▼'}</span>
              </div>
              <CardDescription className="text-xs">{suppliers.length} proveedores activos</CardDescription>
            </CardHeader>
          </button>
          <AnimatePresence>
            {expandProviders && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                <CardContent>
                  <div className="space-y-3">
                    {suppliers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.country} · {s.leadTime}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Confiabilidad</p>
                            <div className="flex items-center gap-2">
                              <Progress value={s.reliability} className="w-20 h-1.5"/>
                              <span className="font-semibold text-xs">{s.reliability}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Órdenes activas</p>
                            <p className="font-bold text-lg">{s.activeOrders}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* ── Nueva orden drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <NuevaOrdenDrawer onClose={() => setDrawerOpen(false)} onAdd={handleAdd}/>
        )}
      </AnimatePresence>
    </>
  )
}
