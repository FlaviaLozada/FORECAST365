import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '../components/ui'
import { Sparkles, TrendingUp, DollarSign, Package, AlertTriangle, CheckCircle2, Download } from '../icons'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Inline sparkline SVG ──────────────────────────────────────────────────
function Sparkline({ data, color = '#8b5cf6', w = 80, h = 28 }) {
  if (!data?.length || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - pad - ((v - min) / range) * (h - pad * 2)}`
  )
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={w} height={h}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI card with sparkline ───────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, delta, deltaLabel, deltaClass, spark, sparkColor }) {
  return (
    <Card className="border-2 hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('rounded-lg p-2', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {spark && <Sparkline data={spark} color={sparkColor} />}
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
        <p className="text-xl sm:text-2xl font-bold leading-tight mb-1">{value}</p>
        <p className={cn('text-xs font-medium', deltaClass)}>
          {delta} <span className="text-gray-400 font-normal">{deltaLabel}</span>
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Chart datasets por período ────────────────────────────────────────────
const REVENUE_DATA = {
  hoy: [
    { month:'00h', real:11000, ia:12000 }, { month:'03h', real:7500,  ia:8500  },
    { month:'06h', real:14000, ia:15000 }, { month:'09h', real:27000, ia:29000 },
    { month:'12h', real:44000, ia:46000 }, { month:'15h', real:38000, ia:40000 },
    { month:'18h', real:51000, ia:53000 }, { month:'21h', real:null,  ia:30000 },
  ],
  semana: [
    { month:'Lun', real:41000, ia:43000 }, { month:'Mar', real:37000, ia:39000 },
    { month:'Mié', real:50000, ia:52000 }, { month:'Jue', real:46000, ia:48000 },
    { month:'Vie', real:54000, ia:56000 }, { month:'Sáb', real:null,  ia:34000 },
    { month:'Dom', real:null,  ia:27000 },
  ],
  mes: [
    { month:'Ene', real:284000, ia:290000 }, { month:'Feb', real:265000, ia:275000 },
    { month:'Mar', real:312000, ia:318000 }, { month:'Abr', real:298000, ia:305000 },
    { month:'May', real:335000, ia:342000 }, { month:'Jun', real:null,   ia:365000 },
    { month:'Jul', real:null,   ia:382000 }, { month:'Ago', real:null,   ia:355000 },
    { month:'Sep', real:null,   ia:375000 }, { month:'Oct', real:null,   ia:400000 },
    { month:'Nov', real:null,   ia:428000 }, { month:'Dic', real:null,   ia:465000 },
  ],
  trimestre: [
    { month:'Mar', real:312000, ia:318000 }, { month:'Abr', real:298000, ia:305000 },
    { month:'May', real:335000, ia:342000 }, { month:'Jun', real:null,   ia:365000 },
    { month:'Jul', real:null,   ia:382000 }, { month:'Ago', real:null,   ia:355000 },
  ],
}

const FX_DATA = {
  hoy: [
    { mes:'09h', actual:2.82, objetivo:3.0, stress:2.24 },
    { mes:'11h', actual:2.79, objetivo:3.0, stress:2.21 },
    { mes:'13h', actual:2.85, objetivo:3.0, stress:2.27 },
    { mes:'15h', actual:2.81, objetivo:3.0, stress:2.23 },
    { mes:'17h', actual:2.80, objetivo:3.0, stress:2.22 },
    { mes:'19h', actual:null,  objetivo:3.0, stress:null  },
  ],
  semana: [
    { mes:'Lun', actual:28.6, objetivo:30, stress:24.4 },
    { mes:'Mar', actual:28.4, objetivo:30, stress:24.2 },
    { mes:'Mié', actual:28.7, objetivo:30, stress:24.5 },
    { mes:'Jue', actual:28.3, objetivo:30, stress:24.1 },
    { mes:'Vie', actual:28.1, objetivo:30, stress:23.9 },
    { mes:'Sáb', actual:null,  objetivo:30, stress:null  },
    { mes:'Dom', actual:null,  objetivo:30, stress:null  },
  ],
  mes: null,       // se calcula dinámico con avgMargin
  trimestre: null, // se calcula dinámico
}

const PERIOD_META = {
  hoy:       { deltaLabel:'vs ayer',             chartDesc:'Evolución de ingresos del día de hoy por hora', fxDesc:'Margen intradiario vs objetivo y stress' },
  semana:    { deltaLabel:'vs semana anterior',  chartDesc:'Ingresos diarios · últimos 5 días + próximos 2 proyectados', fxDesc:'Margen diario de la semana vs objetivo' },
  mes:       { deltaLabel:'vs mes anterior',     chartDesc:'Últimos 5 meses reales · próximos 7 meses proyectados', fxDesc:'Margen actual vs objetivo y escenario +10% USD' },
  trimestre: { deltaLabel:'vs trimestre anterior',chartDesc:'Últimos 3 meses reales · próximos 3 meses proyectados', fxDesc:'Margen trimestral vs objetivo y escenario stress' },
}

const defaultRevenue = REVENUE_DATA.mes

export default function Executive() {
  const navigate = useNavigate()
  const { products, shipments, exchangeRate, processedData } = useAppContext()
  const [period, setPeriod] = useState('mes')

  // ── Metrics ──────────────────────────────────────────────────────────────
  const totalInventory = products.reduce((a, p) => a + p.currentStock * p.currentPrice, 0)
  const criticalCount  = products.filter(p => p.status === 'critical').length
  const activeShip     = shipments.filter(s => s.status !== 'delivered').length
  const shipValue      = shipments.reduce((a, s) => a + parseFloat(s.cost.replace(/[$,]/g, '')), 0)
  const avgMargin      = products.length
    ? products.reduce((a, p) => a + (p.currentPrice > 0
        ? ((p.currentPrice - p.costUSD * exchangeRate.current) / p.currentPrice) * 100 : 0), 0) / products.length
    : 0

  // ── Period-aware data ─────────────────────────────────────────────────────
  const meta = PERIOD_META[period]

  // Revenue chart: uploaded data only overrides the "mes" view
  const revenueData = period === 'mes' && processedData?.revenueProjection
    ? processedData.revenueProjection
    : REVENUE_DATA[period]

  // Sparklines vary by period
  const sparkSeeds = {
    hoy:       { inv:[180,195,210,205,220,215,230,totalInventory/1000], mar:[33,34,32,35,33,36,37,avgMargin], crit:[3,2,3,2,2,1,2,criticalCount], ship:[1,2,1,2,2,1,2,activeShip] },
    semana:    { inv:[200,210,205,225,215,230,240,totalInventory/1000], mar:[34,33,35,34,36,35,37,avgMargin], crit:[5,4,4,3,3,2,2,criticalCount], ship:[2,3,2,3,3,2,3,activeShip] },
    mes:       { inv:[220,240,235,260,255,270,totalInventory*0.00095,totalInventory/1000], mar:[34,35,33,36,34,37,38,avgMargin], crit:[8,9,7,6,5,4,criticalCount+1,criticalCount], ship:[2,3,4,3,4,3,activeShip,activeShip] },
    trimestre: { inv:[160,180,200,220,240,255,265,totalInventory/1000], mar:[30,31,32,33,34,35,36,avgMargin], crit:[12,11,9,7,5,4,3,criticalCount], ship:[4,3,4,3,3,4,activeShip,activeShip] },
  }[period]
  const invSpark  = sparkSeeds.inv.map(Math.round)
  const marSpark  = sparkSeeds.mar.map(v => parseFloat(v.toFixed(1)))
  const critSpark = sparkSeeds.crit
  const shipSpark = sparkSeeds.ship

  // FX Exposure chart
  const m = avgMargin
  const fxBase = {
    mes: [
      { mes:'Ene', actual:+(m+1.1).toFixed(1), objetivo:30, stress:+(m-3.4).toFixed(1) },
      { mes:'Feb', actual:+(m+0.7).toFixed(1), objetivo:30, stress:+(m-3.7).toFixed(1) },
      { mes:'Mar', actual:+(m+0.4).toFixed(1), objetivo:30, stress:+(m-4.0).toFixed(1) },
      { mes:'Abr', actual:+(m+0.5).toFixed(1), objetivo:30, stress:+(m-3.9).toFixed(1) },
      { mes:'May', actual:+m.toFixed(1),        objetivo:30, stress:+(m-4.2).toFixed(1) },
      { mes:'Jun', actual:null,                  objetivo:30, stress:null },
    ],
    trimestre: [
      { mes:'Mar', actual:+(m+0.4).toFixed(1), objetivo:30, stress:+(m-4.0).toFixed(1) },
      { mes:'Abr', actual:+(m+0.5).toFixed(1), objetivo:30, stress:+(m-3.9).toFixed(1) },
      { mes:'May', actual:+m.toFixed(1),        objetivo:30, stress:+(m-4.2).toFixed(1) },
      { mes:'Jun', actual:null,                  objetivo:30, stress:null },
      { mes:'Jul', actual:null,                  objetivo:30, stress:null },
      { mes:'Ago', actual:null,                  objetivo:30, stress:null },
    ],
  }
  const fxData = FX_DATA[period] ?? fxBase[period] ?? fxBase.mes

  // ── Alerts (generated from live data) ────────────────────────────────────
  const alerts = [
    ...products.filter(p => p.status === 'critical').slice(0, 2).map(p => ({
      product: p.name, detail: p.category, type: 'Demanda', sev: 'high',
      impact: `${p.optimalStock - p.currentStock} u. faltantes`, action: 'Crear orden',
    })),
    ...products.filter(p => p.currentPrice !== p.recommendedPrice).slice(0, 2).map(p => ({
      product: p.name, detail: p.category, type: 'Precios', sev: 'med',
      impact: `+${(((p.recommendedPrice - p.currentPrice) / p.currentPrice) * 100).toFixed(1)}% margen`,
      action: 'Revisar precio',
    })),
    ...shipments.filter(s => s.status === 'customs').slice(0, 1).map(s => ({
      product: `Importación ${s.id}`, detail: s.carrier, type: 'Logística', sev: 'med',
      impact: s.cost, action: 'Ver estado',
    })),
  ].slice(0, 5)

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activity = [
    { who:'Sistema', time:`hace ${exchangeRate.lastUpdated || '2 horas'}`,
      msg:`Tipo de cambio: USD = Bs. ${exchangeRate.current} (+${exchangeRate.change}% sobre referencia).`, dot:'bg-purple-500' },
    ...(processedData ? [
      { who:'Tú', time:'hoy',
        msg:`${processedData.rowCount} registros cargados · ${processedData.productCount} productos · ${processedData.yearRange}.`, dot:'bg-green-500' },
      { who:'Sistema', time:'hoy',
        msg:`Forecast calculado sobre ${processedData.monthCount} meses de histórico. Próximo mes proyectado: ${processedData.nextForecastQty?.toLocaleString()} unidades.`, dot:'bg-purple-500' },
    ] : [
      { who:'Sistema', time:'reciente',
        msg:'Datos de demostración activos. Carga tu CSV en Data Structuring para activar el forecast real.', dot:'bg-gray-400' },
    ]),
    ...products.filter(p => p.status === 'critical').slice(0, 2).map(p => ({
      who:'Sistema', time:'reciente',
      msg:`Riesgo de quiebre: ${p.name} — ${p.currentStock} u. disponibles (${Math.round(p.currentStock / p.optimalStock * 100)}% del óptimo).`,
      dot:'bg-red-500',
    })),
    ...shipments.filter(s => s.status === 'in-transit').slice(0, 1).map(s => ({
      who:'Sistema', time:'reciente',
      msg:`Envío ${s.id} en tránsito vía ${s.route} · ETA ${s.eta}`, dot:'bg-blue-500',
    })),
  ].slice(0, 6)

  const alertBadge  = { Demanda:'bg-red-100 text-red-700', Precios:'bg-yellow-100 text-yellow-700', Logística:'bg-blue-100 text-blue-700' }
  const alertBorder = { high:'border-l-4 border-l-red-500', med:'border-l-4 border-l-yellow-400' }
  const priceChanges = products.filter(p => p.currentPrice !== p.recommendedPrice).length

  // ── Export to Excel ───────────────────────────────────────────────────────
  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    const periodLabel = { hoy:'Hoy', semana:'Semana', mes:'Mes', trimestre:'Trimestre' }[period]

    // Sheet 1: KPIs
    const kpiRows = [
      ['Indicador', 'Valor', 'Período'],
      ['Valor Total Inventario', `Bs ${(totalInventory / 1000).toFixed(0)}K`, periodLabel],
      ['Margen Promedio', `${avgMargin.toFixed(1)}%`, periodLabel],
      ['Productos Críticos', criticalCount, periodLabel],
      ['Envíos Activos', activeShip, periodLabel],
      ['Valor en Tránsito', `$${(shipValue / 1000).toFixed(1)}K`, periodLabel],
    ]
    const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows)
    wsKpi['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs')

    // Sheet 2: Revenue projection
    const revHeaders = ['Mes', 'Real (Bs)', 'Proyección IA (Bs)']
    const revRows = [revHeaders, ...revenueData.map(d => [d.month, d.real ?? '—', d.ia ?? '—'])]
    const wsRev = XLSX.utils.aoa_to_sheet(revRows)
    wsRev['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsRev, 'Proyección de Ingresos')

    // Sheet 3: FX exposure
    const fxHeaders = ['Período', 'Margen Actual (%)', 'Objetivo (%)', 'Stress +10% USD (%)']
    const fxRows = [fxHeaders, ...fxData.map(d => [d.mes, d.actual ?? '—', d.objetivo, d.stress ?? '—'])]
    const wsFx = XLSX.utils.aoa_to_sheet(fxRows)
    wsFx['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 22 }]
    XLSX.utils.book_append_sheet(wb, wsFx, 'Exposición Cambiaria')

    // Sheet 4: Alerts
    const alertHeaders = ['Producto', 'Categoría', 'Tipo', 'Impacto', 'Acción']
    const alertRows = [alertHeaders, ...alerts.map(a => [a.product, a.detail, a.type, a.impact, a.action])]
    const wsAlert = XLSX.utils.aoa_to_sheet(alertRows)
    wsAlert['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsAlert, 'Alertas')

    // Sheet 5: Products (if real data loaded)
    if (processedData) {
      const prodHeaders = ['Producto', 'Categoría', 'Stock Actual', 'Stock Óptimo', 'Precio (Bs)', 'Costo (USD)', 'Demanda Prom/mes', 'Estado']
      const prodRows = [prodHeaders, ...products.map(p => [p.name, p.category, p.currentStock, p.optimalStock, p.currentPrice, p.costUSD, p.avgDemand, p.status])]
      const wsProd = XLSX.utils.aoa_to_sheet(prodRows)
      wsProd['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, wsProd, 'Productos')
    }

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Forecast365_Resumen_${periodLabel}_${fecha}.xlsx`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Resumen</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {processedData
              ? `${processedData.yearRange} · ${processedData.rowCount} registros · ${processedData.productCount} productos`
              : 'Vista estratégica con análisis predictivo potenciado por IA'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {['Hoy','Semana','Mes','Trimestre'].map(p => (
              <button key={p} onClick={() => setPeriod(p.toLowerCase())}
                className={cn('px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                  period === p.toLowerCase()
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700')}>
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Exportar
          </Button>
          {processedData && (
            <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />Datos reales
            </Badge>
          )}
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] px-2.5 py-1">
            <Sparkles className="h-3 w-3 mr-1 inline" />IA Activa
          </Badge>
        </div>
      </div>

      {/* ── FX Alert bar ────────────────────────────────────────────────── */}
      {exchangeRate.change > 0.1 && (
        <div onClick={() => navigate('/app/price-committee')}
          className="flex items-center gap-3 p-4 mb-5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100/80 transition-colors">
          <div className="rounded-lg bg-amber-200 p-2 shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              Tipo de cambio movió {exchangeRate.change}% · {priceChanges} productos requieren revisión de precio
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              USD pasó de Bs. {exchangeRate.previous} a Bs. {exchangeRate.current}. Margen erosionado en productos importados.
            </p>
          </div>
          <button className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap">
            Revisar precios →
          </button>
        </div>
      )}

      {/* ── KPI grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon={DollarSign} iconBg="bg-blue-100" iconColor="text-blue-600"
          label="Valor Total Inventario" value={`Bs ${(totalInventory / 1000).toFixed(0)}K`}
          delta="+8.2%" deltaLabel={meta.deltaLabel} deltaClass="text-green-600"
          spark={invSpark} sparkColor="#3b82f6" />
        <KpiCard icon={TrendingUp} iconBg="bg-purple-100" iconColor="text-purple-600"
          label="Margen Promedio" value={`${avgMargin.toFixed(1)}%`}
          delta="+2.3pp" deltaLabel="vs objetivo" deltaClass="text-green-600"
          spark={marSpark} sparkColor="#8b5cf6" />
        <KpiCard icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600"
          label="Productos Críticos" value={criticalCount}
          delta={criticalCount > 0 ? 'Requieren atención' : 'Stock saludable'}
          deltaLabel="" deltaClass={criticalCount > 0 ? 'text-red-600' : 'text-green-600'}
          spark={critSpark} sparkColor="#ef4444" />
        <KpiCard icon={Package} iconBg="bg-green-100" iconColor="text-green-600"
          label="En Tránsito" value={`$${(shipValue / 1000).toFixed(1)}K`}
          delta={`${activeShip} envíos`} deltaLabel="activos" deltaClass="text-gray-600"
          spark={shipSpark} sparkColor="#10b981" />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

        {/* Revenue projection */}
        <Card className="border-2 lg:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Proyección de ingresos</CardTitle>
                <CardDescription className="text-xs">
                  {period === 'mes' && processedData
                    ? `Datos reales ${processedData.yearRange} + forecast IA`
                    : meta.chartDesc}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-green-500 inline-block rounded" /> Real
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-purple-500 inline-block rounded" style={{ borderTopStyle: 'dashed' }} /> IA
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={v => v ? `Bs ${v.toLocaleString()}` : '—'}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="real" stroke="#10b981" fill="url(#gReal)"
                  strokeWidth={2} name="Real" connectNulls={false} />
                <Area type="monotone" dataKey="ia" stroke="#8b5cf6" fill="url(#gIA)"
                  strokeWidth={2} strokeDasharray="5 4" name="Proyección IA" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FX Exposure */}
        <Card className="border-2 lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exposición al tipo de cambio</CardTitle>
            <CardDescription className="text-xs">{meta.fxDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={fxData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip formatter={v => v != null ? `${parseFloat(v).toFixed(1)}%` : '—'}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="objetivo" stroke="#d1d5db" strokeWidth={1.5}
                  strokeDasharray="4 3" dot={false} name="Objetivo 30%" />
                <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ fill: '#8b5cf6', r: 3 }} name={`Actual ${avgMargin.toFixed(1)}%`} />
                <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1.5}
                  strokeDasharray="4 3" dot={false} name="Stress +10% USD" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-gray-300 inline-block" /> Objetivo 30%</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-purple-500 inline-block" /> Actual {avgMargin.toFixed(1)}%</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-500 inline-block" /> Stress</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alerts + Activity ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Alerts table */}
        <Card className="border-2 lg:col-span-7 overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Alertas principales</h3>
              <p className="text-xs text-gray-500 mt-0.5">{alerts.length} activas · ordenadas por impacto financiero</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600"
              onClick={() => navigate('/app/price-committee')}>
              Ver todas →
            </Button>
          </div>
          {alerts.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Sin alertas activas</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Impacto</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={i}
                    className={cn('border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors', alertBorder[a.sev])}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm leading-tight">{a.product}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.detail}</div>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', alertBadge[a.type])}>
                        {a.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 hidden md:table-cell">{a.impact}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-blue-600">{a.action}</span>
                    </td>
                    <td className="py-3 pr-3 text-gray-300 text-sm">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Activity feed */}
        <Card className="border-2 lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actividad reciente</CardTitle>
            <CardDescription className="text-xs">Sistema + actualizaciones automáticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', a.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm leading-snug text-gray-800">{a.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.who} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
