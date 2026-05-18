import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '../components/ui'
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, Ship, DollarSign } from '../icons'

export default function Alertas() {
  const navigate = useNavigate()
  const { products, shipments, exchangeRate } = useAppContext()

  // Generate alerts from real data
  const alerts = [
    // Critical stock
    ...products.filter(p => p.status === 'critical').map(p => ({
      id: `stock-${p.id}`, severity: 'high', type: 'Demanda',
      title: `Riesgo de quiebre — ${p.name}`,
      desc: `Stock actual: ${p.currentStock} u. (${Math.round(p.currentStock / p.optimalStock * 100)}% del óptimo). Lead time: ${p.leadTime}.`,
      impact: `${p.optimalStock - p.currentStock} u. faltantes`,
      action: 'Crear orden', onAction: () => navigate('/app/demand-planning'),
    })),
    // Warning stock
    ...products.filter(p => p.status === 'warning').map(p => ({
      id: `warn-${p.id}`, severity: 'med', type: 'Demanda',
      title: `Stock bajo — ${p.name}`,
      desc: `Stock actual ${p.currentStock} u. · Demanda promedio ${p.avgDemand} u/mes. Revisar en próxima planificación.`,
      impact: `Cobertura limitada`,
      action: 'Ver planificación', onAction: () => navigate('/app/demand-planning'),
    })),
    // Price changes needed
    ...products.filter(p => p.currentPrice !== p.recommendedPrice).map(p => ({
      id: `price-${p.id}`, severity: 'med', type: 'Precios',
      title: `Ajuste de precio recomendado — ${p.name}`,
      desc: `Precio actual: Bs ${p.currentPrice} · Precio recomendado: Bs ${p.recommendedPrice} (+${(((p.recommendedPrice - p.currentPrice) / p.currentPrice) * 100).toFixed(1)}%). USD/BOB: ${exchangeRate.current}.`,
      impact: `+${(((p.recommendedPrice - p.currentPrice) / p.currentPrice) * 100).toFixed(1)}% margen`,
      action: 'Revisar precio', onAction: () => navigate('/app/price-committee'),
    })),
    // Overstock
    ...products.filter(p => p.status === 'overstock').map(p => ({
      id: `over-${p.id}`, severity: 'low', type: 'Inventario',
      title: `Sobrestock detectado — ${p.name}`,
      desc: `Stock actual ${p.currentStock} u. supera el óptimo de ${p.optimalStock} u. en ${p.currentStock - p.optimalStock} u. Capital inmovilizado.`,
      impact: `Bs ${((p.currentStock - p.optimalStock) * p.costUSD * exchangeRate.current).toFixed(0)} inmovilizados`,
      action: 'Ajustar orden', onAction: () => navigate('/app/demand-planning'),
    })),
    // FX
    ...(exchangeRate.change > 0.1 ? [{
      id: 'fx-alert', severity: 'med', type: 'Tipo de cambio',
      title: `Tipo de cambio movió ${exchangeRate.change}%`,
      desc: `USD pasó de Bs. ${exchangeRate.previous} a Bs. ${exchangeRate.current}. Productos importados con margen erosionado. Revisar precios de venta.`,
      impact: `${products.filter(p => p.currentPrice !== p.recommendedPrice).length} precios desactualizados`,
      action: 'Ver precios', onAction: () => navigate('/app/price-committee'),
    }] : []),
    // Customs
    ...shipments.filter(s => s.status === 'customs').map(s => ({
      id: `customs-${s.id}`, severity: 'med', type: 'Logística',
      title: `Envío en aduana — ${s.id}`,
      desc: `${s.carrier} · ${s.route} · ETA: ${s.eta}. El envío está en proceso de despacho aduanero.`,
      impact: s.cost,
      action: 'Ver envío', onAction: () => navigate('/app/logistics'),
    })),
  ]

  const high = alerts.filter(a => a.severity === 'high').length
  const med  = alerts.filter(a => a.severity === 'med').length
  const low  = alerts.filter(a => a.severity === 'low').length

  const sevStyle = {
    high: { border:'border-l-4 border-l-red-500',   badge:'bg-red-100 text-red-700',    icon:<AlertTriangle className="h-5 w-5 text-red-600 shrink-0"/> },
    med:  { border:'border-l-4 border-l-yellow-400', badge:'bg-yellow-100 text-yellow-700', icon:<AlertCircle className="h-5 w-5 text-yellow-600 shrink-0"/> },
    low:  { border:'border-l-4 border-l-blue-400',   badge:'bg-blue-100 text-blue-700',  icon:<CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0"/> },
  }

  const typeIcon = { Demanda:<TrendingUp className="h-3.5 w-3.5"/>, Precios:<DollarSign className="h-3.5 w-3.5"/>, Logística:<Ship className="h-3.5 w-3.5"/>, Inventario:<Bell className="h-3.5 w-3.5"/>, 'Tipo de cambio':<DollarSign className="h-3.5 w-3.5"/> }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-red-600 p-2.5 shrink-0"><Bell className="h-6 w-6 text-white"/></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alertas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Centro de alertas · ordenadas por impacto financiero</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label:'Alta prioridad', value:high, color:'text-red-600',    bg:'bg-red-50 border-red-200' },
          { label:'Media prioridad',value:med,  color:'text-yellow-600', bg:'bg-yellow-50 border-yellow-200' },
          { label:'Baja prioridad', value:low,  color:'text-blue-600',   bg:'bg-blue-50 border-blue-200' },
        ].map((s,i) => (
          <Card key={i} className={cn('border-2', s.bg)}>
            <CardContent className="p-4 text-center">
              <p className={cn('text-3xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <Card className="border-2">
          <CardContent className="py-16 text-center text-gray-400">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30"/>
            <p className="font-medium">Sin alertas activas</p>
            <p className="text-sm mt-1">Todos los indicadores están dentro del rango normal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => {
            const sev = sevStyle[a.severity]
            return (
              <div key={a.id} className={cn('bg-white rounded-xl border-2 border-gray-100 p-4 flex items-start gap-4', sev.border)}>
                {sev.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', sev.badge)}>
                      {typeIcon[a.type]}{a.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">{a.desc}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-medium">Impacto: {a.impact}</span>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3" onClick={a.onAction}>
                      {a.action} →
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
