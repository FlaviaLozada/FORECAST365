import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, Badge, Button } from '../components/ui'
import { FileText, Download, RefreshCw, CheckCircle2, AlertTriangle } from '../icons'
import * as XLSX from 'xlsx'

export default function DatosCrudos() {
  const { products, shipments, processedData, clearUploadedData, downloadSampleData } = useAppContext()
  const [tab, setTab] = useState('productos')

  const exportAll = () => {
    const wb = XLSX.utils.book_new()
    const fecha = new Date().toISOString().slice(0, 10)
    const wsP = XLSX.utils.aoa_to_sheet([
      ['ID','Producto','Categoría','Stock','Óptimo','Precio Bs','Costo USD','Dem/mes','Lead Time','Estado'],
      ...products.map(p => [p.id, p.name, p.category, p.currentStock, p.optimalStock, p.currentPrice, p.costUSD, p.avgDemand, p.leadTime, p.status])
    ])
    XLSX.utils.book_append_sheet(wb, wsP, 'Productos')
    const wsS = XLSX.utils.aoa_to_sheet([
      ['ID','Origen','Destino','Estado','Progreso %','ETA','Transportista','Ruta','Costo'],
      ...shipments.map(s => [s.id, `${s.origin.city}, ${s.origin.country}`, `${s.destination.city}, ${s.destination.country}`, s.status, s.progress, s.eta, s.carrier, s.route, s.cost])
    ])
    XLSX.utils.book_append_sheet(wb, wsS, 'Envíos')
    XLSX.writeFile(wb, `Forecast365_DatosCrudos_${fecha}.xlsx`)
  }

  const tabs = [
    { id:'productos', label:`Productos (${products.length})` },
    { id:'envios',    label:`Envíos (${shipments.length})` },
    ...(processedData ? [{ id:'historico', label:`Histórico (${processedData.rowCount})` }] : []),
  ]

  const STATUS_MAP = {
    critical: { cls:'bg-red-100 text-red-700',      label:'Crítico'   },
    warning:  { cls:'bg-yellow-100 text-yellow-700', label:'Alerta'    },
    overstock:{ cls:'bg-orange-100 text-orange-700', label:'Exceso'    },
    optimal:  { cls:'bg-green-100 text-green-700',   label:'Óptimo'    },
  }
  const SHIP_MAP = {
    'in-transit':{ cls:'bg-blue-100 text-blue-700',     label:'En tránsito' },
    customs:     { cls:'bg-yellow-100 text-yellow-700', label:'Aduana'      },
    planning:    { cls:'bg-gray-100 text-gray-600',     label:'Planificado' },
    delivered:   { cls:'bg-green-100 text-green-700',   label:'Entregado'   },
  }

  const StatusBadge = ({ s, map }) => {
    const m = map[s] || { cls:'bg-gray-100 text-gray-500', label: s }
    return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', m.cls)}>{m.label}</span>
  }

  const previewRows    = processedData?.rawRows?.slice(0, 20) || []
  const previewHeaders = previewRows.length ? Object.keys(previewRows[0]) : []

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-xl bg-slate-700 p-2.5 shrink-0">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white"/>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">Datos crudos</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Vista directa de todos los datos del sistema</p>
          </div>
        </div>

        {/* Buttons — wrap on mobile */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleData} className="text-xs">
            Descargar ejemplo
          </Button>
          <Button variant="outline" size="sm" onClick={exportAll} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1"/>Exportar
          </Button>
          {processedData && (
            <Button variant="outline" size="sm" onClick={clearUploadedData} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1"/>Restaurar demo
            </Button>
          )}
        </div>
      </div>

      {/* ── Data source banner ──────────────────────────────────── */}
      <div className={cn('flex items-start gap-2 p-3 rounded-xl border mb-5 text-xs sm:text-sm',
        processedData ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800')}>
        {processedData
          ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"/>
          : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>}
        <span>{processedData
          ? `Datos reales activos · ${processedData.rowCount} registros · ${processedData.productCount} productos · ${processedData.yearRange}`
          : 'Mostrando datos de demostración. Ve a Data Structuring para cargar datos reales.'}</span>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none',
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Products ─────────────────────────────────────────────── */}
      {tab === 'productos' && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {products.map((p, i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
                    </div>
                    <StatusBadge s={p.status} map={STATUS_MAP}/>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Stock</p>
                      <p className="text-sm font-bold">{p.currentStock}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Óptimo</p>
                      <p className="text-sm font-bold text-blue-600">{p.optimalStock}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Dem/mes</p>
                      <p className="text-sm font-bold">{p.avgDemand}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Precio Bs</p>
                      <p className="text-sm font-bold">{p.currentPrice}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Costo USD</p>
                      <p className="text-sm font-bold">{p.costUSD}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden sm:block border-2 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b">
                  {['Producto','Categoría','Stock','Óptimo','Precio Bs','Costo USD','Dem/mes','Estado'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium">{p.name}</td>
                      <td className="py-2.5 px-3 text-gray-500">{p.category}</td>
                      <td className="py-2.5 px-3 font-mono">{p.currentStock}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600">{p.optimalStock}</td>
                      <td className="py-2.5 px-3 font-mono">{p.currentPrice}</td>
                      <td className="py-2.5 px-3 font-mono">{p.costUSD}</td>
                      <td className="py-2.5 px-3 font-mono">{p.avgDemand}</td>
                      <td className="py-2.5 px-3"><StatusBadge s={p.status} map={STATUS_MAP}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Shipments ────────────────────────────────────────────── */}
      {tab === 'envios' && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {shipments.map((s, i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono font-semibold text-sm">{s.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.origin.city} → {s.destination.city}</p>
                    </div>
                    <StatusBadge s={s.status} map={SHIP_MAP}/>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Progreso</p>
                      <p className="text-sm font-bold">{s.progress}%</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">ETA</p>
                      <p className="text-sm font-bold">{s.eta}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Costo</p>
                      <p className="text-sm font-bold text-green-700">{s.cost}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{s.carrier}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden sm:block border-2 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b">
                  {['ID','Origen → Destino','Estado','Progreso','ETA','Costo','Transportista'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {shipments.map((s, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-medium">{s.id}</td>
                      <td className="py-2.5 px-3 text-gray-600">{s.origin.city} → {s.destination.city}</td>
                      <td className="py-2.5 px-3"><StatusBadge s={s.status} map={SHIP_MAP}/></td>
                      <td className="py-2.5 px-3 font-mono">{s.progress}%</td>
                      <td className="py-2.5 px-3">{s.eta}</td>
                      <td className="py-2.5 px-3 font-mono text-green-700">{s.cost}</td>
                      <td className="py-2.5 px-3 text-gray-500">{s.carrier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Historical ───────────────────────────────────────────── */}
      {tab === 'historico' && processedData && (
        <Card className="border-2 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b">
                {previewHeaders.map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {previewHeaders.map(h => (
                      <td key={h} className="py-2 px-3 whitespace-nowrap text-gray-700">
                        {String(row[h] instanceof Date ? row[h].toLocaleDateString() : row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processedData.rowCount > 20 && (
            <p className="text-xs text-gray-400 text-center py-2 border-t">
              Mostrando 20 de {processedData.rowCount} filas
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
