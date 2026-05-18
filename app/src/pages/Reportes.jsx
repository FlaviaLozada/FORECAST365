import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '../components/ui'
import { BarChart2, Download, TrendingUp, DollarSign, Package, Ship } from '../icons'
import * as XLSX from 'xlsx'

const reportTypes = [
  { id:'ejecutivo', icon:TrendingUp,  color:'bg-purple-100 text-purple-600', title:'Resumen Ejecutivo',       desc:'KPIs principales, margen, inventario y alertas del período seleccionado.' },
  { id:'demanda',   icon:BarChart2,   color:'bg-blue-100 text-blue-600',     title:'Reporte de Demanda',       desc:'Forecast por producto, análisis de estacionalidad y plan de compras.' },
  { id:'precios',   icon:DollarSign,  color:'bg-amber-100 text-amber-600',   title:'Reporte de Precios',       desc:'Ajustes pendientes, historial de cambios e impacto en margen.' },
  { id:'logistica', icon:Ship,        color:'bg-emerald-100 text-emerald-600',title:'Reporte de Logística',    desc:'Estado de envíos, lead times por proveedor y costos de importación.' },
  { id:'inventario',icon:Package,     color:'bg-red-100 text-red-600',       title:'Reporte de Inventario',    desc:'Stock crítico, sobrestock, rotación y cobertura por almacén.' },
  { id:'completo',  icon:BarChart2,   color:'bg-slate-100 text-slate-600',   title:'Reporte Completo',         desc:'Todos los módulos consolidados en un solo archivo Excel con múltiples hojas.' },
]

export default function Reportes() {
  const { products, shipments, exchangeRate, processedData } = useAppContext()

  const generateReport = (id) => {
    const wb   = XLSX.utils.book_new()
    const fecha = new Date().toISOString().slice(0, 10)

    const addSheet = (name, data) => {
      const ws = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, name)
    }

    if (id === 'ejecutivo' || id === 'completo') {
      const avgMargin = products.length
        ? products.reduce((a, p) => a + (p.currentPrice > 0 ? ((p.currentPrice - p.costUSD * exchangeRate.current) / p.currentPrice) * 100 : 0), 0) / products.length : 0
      addSheet('Resumen Ejecutivo', [
        ['Indicador','Valor'],
        ['Fecha de reporte', fecha],
        ['Total productos', products.length],
        ['Productos críticos', products.filter(p => p.status === 'critical').length],
        ['Margen promedio', `${avgMargin.toFixed(1)}%`],
        ['Tipo de cambio USD/BOB', `Bs ${exchangeRate.current}`],
        ['Variación tipo de cambio', `+${exchangeRate.change}%`],
        ['Envíos activos', shipments.filter(s => s.status !== 'delivered').length],
        ['Valor en tránsito', `$${(shipments.reduce((a,s) => a + parseFloat(s.cost.replace(/[$,]/g,'')), 0)/1000).toFixed(1)}K`],
      ])
    }

    if (id === 'demanda' || id === 'completo') {
      addSheet('Demanda por Producto', [
        ['Producto','Categoría','Stock Actual','Stock Óptimo','Dem. Prom/mes','Lead Time','Estado'],
        ...products.map(p => [p.name, p.category, p.currentStock, p.optimalStock, p.avgDemand, p.leadTime, p.status])
      ])
    }

    if (id === 'precios' || id === 'completo') {
      addSheet('Revisión de Precios', [
        ['Producto','Precio Actual (Bs)','Precio Recomendado (Bs)','Incremento %','Costo USD','Estado'],
        ...products.filter(p => p.currentPrice !== p.recommendedPrice).map(p => [
          p.name, p.currentPrice, p.recommendedPrice,
          `+${(((p.recommendedPrice - p.currentPrice) / p.currentPrice)*100).toFixed(1)}%`,
          p.costUSD, p.status
        ])
      ])
    }

    if (id === 'logistica' || id === 'completo') {
      addSheet('Logística', [
        ['ID Envío','Origen','Destino','Estado','ETA','Costo','Transportista'],
        ...shipments.map(s => [s.id, `${s.origin.city}, ${s.origin.country}`, `${s.destination.city}, ${s.destination.country}`, s.status, s.eta, s.cost, s.carrier])
      ])
    }

    if (id === 'inventario' || id === 'completo') {
      addSheet('Inventario', [
        ['Producto','Categoría','Stock','Óptimo','Precio Bs','Costo USD','Estado'],
        ...products.map(p => [p.name, p.category, p.currentStock, p.optimalStock, p.currentPrice, p.costUSD, p.status])
      ])
    }

    if (id === 'completo' && processedData) {
      addSheet('Datos Históricos', [
        ['Registros cargados', processedData.rowCount],
        ['Productos', processedData.productCount],
        ['Meses', processedData.monthCount],
        ['Período', processedData.yearRange],
      ])
    }

    const name = reportTypes.find(r => r.id === id)?.title.replace(/\s+/g, '_') || 'Reporte'
    XLSX.writeFile(wb, `Forecast365_${name}_${fecha}.xlsx`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 shrink-0"><BarChart2 className="h-6 w-6 text-white"/></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reportes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Genera y descarga reportes Excel de todos los módulos</p>
        </div>
      </div>

      {processedData && (
        <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">
          ✓ Datos reales cargados ({processedData.rowCount} registros · {processedData.yearRange}) — los reportes incluirán tus datos reales.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(r => {
          const Icon = r.icon
          return (
            <Card key={r.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className={cn('rounded-lg p-2.5 w-fit mb-3', r.color)}>
                  <Icon className="h-5 w-5"/>
                </div>
                <h3 className="font-semibold text-sm mb-1">{r.title}</h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => generateReport(r.id)}>
                  <Download className="h-3.5 w-3.5 mr-1.5"/>Descargar Excel
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
