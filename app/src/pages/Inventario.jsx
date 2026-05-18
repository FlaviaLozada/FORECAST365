import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '../components/ui'
import { Boxes, Download, RefreshCw, Search, TrendingUp, AlertTriangle, CheckCircle2 } from '../icons'
import * as XLSX from 'xlsx'

const EX = 6.97

const BRAND_MAP = {
  'Filtro de Aire FA-2000':       'TECFIL',
  'Filtro de Aceite OL-500':      'WEGA',
  'Filtro Hidráulico HF-100':     'BALDWIN',
  'Filtro de Combustible FC-300': 'FLEETGUARD',
}
const APP_MAP = {
  'Filtro de Aire FA-2000':       'Toyota Hilux · Ford Ranger 2.5D',
  'Filtro de Aceite OL-500':      'Nissan Navara · Toyota HiAce',
  'Filtro Hidráulico HF-100':     'Caterpillar 320D · 330D',
  'Filtro de Combustible FC-300': 'Volvo FH · Mercedes Sprinter',
}
const SS_FACTOR = { A: 1.8, B: 1.4, C: 1.1 }

const DATA_QUALITY = [
  { field: 'Código SKU',             pct: 100, group: 'base'  },
  { field: 'Descripción técnica',    pct: 96,  group: 'base'  },
  { field: 'Marca',                  pct: 100, group: 'base'  },
  { field: 'Categoría',              pct: 100, group: 'base'  },
  { field: 'Aplicación vehículo',    pct: 75,  group: 'tech'  },
  { field: 'Modelo / variante',      pct: 68,  group: 'tech'  },
  { field: 'Año / variante',         pct: 55,  group: 'tech'  },
  { field: 'Costo en moneda origen', pct: 100, group: 'com'   },
  { field: 'Lead time proveedor',    pct: 88,  group: 'com'   },
  { field: 'Demanda histórica',      pct: 94,  group: 'com'   },
]

const WAREHOUSES = [
  { name: 'Central — Cuarto Anillo', city: 'Santa Cruz', pct: 30, color: '#4D17FC' },
  { name: 'Depósito Industrial',     city: 'Santa Cruz', pct: 24, color: '#4D17FC' },
  { name: 'Sucursal Norte',          city: 'Santa Cruz', pct: 14, color: '#4D17FC' },
  { name: 'La Paz — Central',        city: 'La Paz',     pct: 18, color: '#7B59FF' },
  { name: 'El Alto — Distribución',  city: 'El Alto',    pct: 8,  color: '#7B59FF' },
  { name: 'Cochabamba',              city: 'Cochabamba', pct: 6,  color: '#9F7AFF' },
]

const ABC_STYLE = {
  A: { bg: '#ede9fe', color: '#6d28d9' },
  B: { bg: '#eff6ff', color: '#1d4ed8' },
  C: { bg: '#f1f5f9', color: '#475569' },
}

function CircularGauge({ value, size = 96 }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  const color = value >= 90 ? '#22c55e' : value >= 70 ? '#4D17FC' : '#f97316'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 - 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={16} fontWeight={800} fill="#1e293b">{value}%</text>
    </svg>
  )
}

export default function Inventario() {
  const { products } = useAppContext()
  const [search, setSearch]           = useState('')
  const [brandFilter, setBrandFilter] = useState('Todas')

  const enriched = useMemo(() => {
    const sorted = [...products]
      .map(p => ({ ...p, _rev: (p.currentPrice||0)*(p.avgDemand||0) }))
      .sort((a,b) => b._rev - a._rev)
    const total = sorted.reduce((s,p) => s+p._rev, 0)
    let cum = 0
    return sorted.map(p => {
      cum += p._rev
      const revPct    = total ? cum/total : 0
      const abc       = revPct <= 0.70 ? 'A' : revPct <= 0.90 ? 'B' : 'C'
      const leadDays  = parseInt(p.leadTime) || 45
      const coverDays = p.avgDemand > 0 ? Math.round((p.currentStock/p.avgDemand)*30) : 0
      const marginPct = p.currentPrice > 0 ? ((p.currentPrice - p.costUSD*EX)/p.currentPrice*100) : 0
      const ss        = Math.round(p.avgDemand*(leadDays/30)*(SS_FACTOR[abc]||1.2))
      return { ...p, abc, coverDays, marginPct, ss,
        brand: BRAND_MAP[p.name] || p.category,
        application: APP_MAP[p.name] || p.category }
    })
  }, [products])

  const brands   = useMemo(() => ['Todas', ...new Set(enriched.map(p=>p.brand))], [enriched])
  const filtered = useMemo(() => enriched.filter(p => {
    const q = search.toLowerCase()
    return (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      && (brandFilter === 'Todas' || p.brand === brandFilter)
  }), [enriched, search, brandFilter])

  const totalStock = products.reduce((s,p) => s+p.currentStock, 0)
  const avgQuality = Math.round(DATA_QUALITY.reduce((s,d)=>s+d.pct,0)/DATA_QUALITY.length)

  const exportCatalog = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['SKU','Producto','Marca','Categoría','Aplicación','Stock','Cobertura (días)','SS','Margen %','Clase ABC'],
      ...enriched.map(p => [p.id,p.name,p.brand,p.category,p.application,p.currentStock,p.coverDays,p.ss,p.marginPct.toFixed(1)+'%',p.abc]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')
    XLSX.writeFile(wb, `Catalogo_Inventario_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const qualColor = (pct) => pct >= 90 ? '#22c55e' : pct >= 65 ? '#f97316' : '#ef4444'

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-600 p-2.5 shrink-0">
            <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-white"/>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">Inventario y datos</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Catálogo estructurado · {WAREHOUSES.length} almacenes · datos auditados al {avgQuality}%
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5"/>Sincronizar ERP
          </Button>
          <Button size="sm" className="text-xs flex items-center gap-1.5" onClick={exportCatalog}>
            <Download className="h-3.5 w-3.5"/>Exportar catálogo
          </Button>
        </div>
      </div>

      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label:'SKUs en catálogo',      value: products.length,   icon: Boxes,          iconBg:'bg-indigo-100',  iconColor:'text-indigo-600' },
          { label:'Stock total (unidades)', value: totalStock,        icon: TrendingUp,     iconBg:'bg-purple-100',  iconColor:'text-purple-600' },
          { label:'Precios actualizados',   value: products.filter(p=>p.currentPrice===p.recommendedPrice).length, icon: CheckCircle2, iconBg:'bg-green-100', iconColor:'text-green-600' },
          { label:'Con ajuste pendiente',   value: products.filter(p=>p.currentPrice!==p.recommendedPrice).length, icon: AlertTriangle, iconBg:'bg-amber-100', iconColor:'text-amber-600' },
        ].map((k,i) => (
          <Card key={i} className="border-2">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', k.iconBg)}>
                  <k.icon className={cn('h-4 w-4', k.iconColor)}/>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-tight">{k.label}</p>
                  <p className="text-xl font-black text-gray-900 leading-none mt-0.5">{k.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Stock por almacén — CENTRAL ── */}
      <Card className="border-2 mb-5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base sm:text-lg">Stock por almacén</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Distribución de {totalStock} unidades en {WAREHOUSES.length} ubicaciones
              </CardDescription>
            </div>
            <span className="text-2xl font-black text-indigo-600">{totalStock} u</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {WAREHOUSES.map((w, i) => {
              const units = Math.round(totalStock * w.pct / 100)
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-none">{w.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{w.city}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-base font-black text-gray-900">{units}</p>
                      <p className="text-[10px] text-gray-400">{w.pct}%</p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width:`${w.pct}%`, background: w.color }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Fila inferior: Calidad de datos + Estructuración ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-5">

        {/* Calidad de datos — más compacta */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calidad de datos del catálogo</CardTitle>
            <CardDescription className="text-xs">
              Completitud por campo · meta 95% para activar módulos avanzados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DATA_QUALITY.map((d, i) => {
              const col = qualColor(d.pct)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-600 w-40 shrink-0">{d.field}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${d.pct}%`, background: `linear-gradient(90deg, ${col}cc, ${col})` }}/>
                  </div>
                  <span className="text-[11px] font-bold w-9 text-right shrink-0" style={{ color: col }}>{d.pct}%</span>
                </div>
              )
            })}
            <div className="flex items-center gap-4 pt-2 text-[10px] text-gray-400 border-t">
              {[['#22c55e','≥ 90% Óptimo'],['#f97316','65–89% Mejorar'],['#ef4444','< 65% Crítico']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{background:c}}/>
                  {l}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estructuración general */}
        <Card className="border-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Estructuración general</p>
                <p className="text-xs text-gray-400 mt-0.5">Datos limpios y relacionados</p>
              </div>
              <CircularGauge value={avgQuality}/>
            </div>
            <div className="space-y-2">
              {[
                { label:'SKUs totales',     value: products.length,  valueColor:'text-gray-900' },
                { label:'SKUs activos',      value: products.filter(p=>p.status!=='critical'||p.currentStock>0).length, valueColor:'text-gray-900' },
                { label:'Precios al día',    value: products.filter(p=>p.currentPrice===p.recommendedPrice).length, valueColor:'text-green-600' },
                { label:'Inconsistencias',   value: products.filter(p=>p.currentPrice!==p.recommendedPrice).length, valueColor:'text-orange-500' },
              ].map((s,i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className={cn('text-sm font-bold', s.valueColor)}>{s.value}</span>
                </div>
              ))}
            </div>
            {avgQuality < 95 && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⚡ Alcanzá el 95% para desbloquear módulos avanzados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Catálogo estructurado ── */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-sm sm:text-base">Catálogo estructurado</CardTitle>
              <CardDescription className="text-xs">
                {filtered.length} de {enriched.length} SKUs · vista limpia post-estructuración
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"/>
                <input type="text" placeholder="Buscar SKU, marca…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 w-44 sm:w-56"/>
              </div>
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-200">
                {brands.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* Mobile */}
          <div className="sm:hidden divide-y">
            {filtered.map((p,i) => (
              <div key={i} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] text-gray-400">{p.id}</span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{p.brand}</span>
                    </div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.application}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 mt-1"
                    style={{background:ABC_STYLE[p.abc]?.bg, color:ABC_STYLE[p.abc]?.color}}>
                    {p.abc}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label:'Stock',    value:p.currentStock, warn:false },
                    { label:'Cob.',     value:`${p.coverDays}d`, warn:p.coverDays<15 },
                    { label:'SS',       value:p.ss, warn:false },
                    { label:'Margen',   value:`${p.marginPct.toFixed(1)}%`, good:p.marginPct>15 },
                  ].map((m,j)=>(
                    <div key={j} className="text-center rounded-lg bg-gray-50 p-2">
                      <p className="text-[9px] text-gray-400">{m.label}</p>
                      <p className="text-xs font-bold" style={{color:m.warn?'#f97316':m.good?'#16a34a':'#1e293b'}}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {[
                    {h:'SKU',       cls:'px-5 text-left' },
                    {h:'Producto',  cls:'px-4 text-left' },
                    {h:'Marca',     cls:'px-3 text-left' },
                    {h:'Aplicación',cls:'px-4 text-left' },
                    {h:'Stock',     cls:'px-3 text-right'},
                    {h:'Cobertura', cls:'px-3 text-right'},
                    {h:'SS',        cls:'px-3 text-right'},
                    {h:'Margen',    cls:'px-3 text-right'},
                    {h:'ABC',       cls:'px-4 text-center'},
                  ].map(({h,cls},i) => (
                    <th key={i} className={cn('py-3 font-semibold text-gray-400 uppercase tracking-wide text-[10px]', cls)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i) => (
                  <tr key={i} className="border-b hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{
                          background:p.status==='critical'?'#ef4444':p.status==='warning'?'#f97316':p.status==='overstock'?'#a78bfa':'#22c55e'
                        }}/>
                        <span className="font-mono text-gray-500 font-medium">{p.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-800 leading-tight">{p.name}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {p.brand}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px] max-w-[180px]">
                      <span className="line-clamp-1">{p.application}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-gray-800">{p.currentStock}</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-sm" style={{
                        color: p.coverDays<10?'#ef4444':p.coverDays<20?'#f97316':'#64748b'
                      }}>
                        {p.coverDays}d{p.coverDays<15?' ⚠':''}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-gray-400">{p.ss}</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold" style={{
                        color:p.marginPct<5?'#ef4444':p.marginPct<15?'#f97316':'#16a34a'
                      }}>
                        {p.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{background:ABC_STYLE[p.abc]?.bg, color:ABC_STYLE[p.abc]?.color}}>
                        {p.abc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
