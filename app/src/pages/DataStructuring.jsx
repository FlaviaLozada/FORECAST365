import { useState, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Progress } from '../components/ui'
import { Database, Upload, Download, RefreshCw, CheckCircle2, AlertCircle, Clock, Sparkles, Brain } from '../icons'

export default function DataStructuring() {
  const { processedData, isUploading, uploadFile, clearUploadedData, downloadSampleData } = useAppContext()
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { uploadFile(f); e.target.value = '' } }
  const openPicker = () => fileRef.current?.click()

  const previewRows    = processedData?.rawRows?.slice(0, 6) || []
  const previewHeaders = previewRows.length ? Object.keys(previewRows[0]).slice(0, 6) : []

  const steps = processedData
    ? [
        { name: 'Archivo cargado',           status: 'completed', detail: `${processedData.rowCount} filas` },
        { name: 'Parsing de columnas',        status: 'completed', detail: `${previewHeaders.length} columnas` },
        { name: 'Normalización de productos', status: 'completed', detail: `${processedData.productCount} productos` },
        { name: 'Cálculo de forecast',        status: 'completed', detail: `${processedData.monthCount} meses` },
        { name: 'Validación final',           status: processedData.parseErrors === 0 ? 'completed' : 'in-progress', detail: processedData.parseErrors === 0 ? 'Sin errores' : `${processedData.parseErrors} advertencias` },
      ]
    : [
        { name: 'Archivo cargado',           status: 'pending', detail: 'Esperando archivo' },
        { name: 'Parsing de columnas',        status: 'pending', detail: '' },
        { name: 'Normalización de productos', status: 'pending', detail: '' },
        { name: 'Cálculo de forecast',        status: 'pending', detail: '' },
        { name: 'Validación final',           status: 'pending', detail: '' },
      ]

  const progress = steps.filter(s => s.status === 'completed').length / steps.length * 100

  const SIcon = (s) => s === 'completed'
    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0"/>
    : s === 'in-progress'
    ? <Clock className="h-4 w-4 text-blue-600 shrink-0"/>
    : <AlertCircle className="h-4 w-4 text-gray-300 shrink-0"/>

  const SBadge = (s) => s === 'completed'
    ? <Badge className="bg-green-100 text-green-700 text-[10px]">OK</Badge>
    : s === 'in-progress'
    ? <Badge className="bg-blue-100 text-blue-700 text-[10px]">En proceso</Badge>
    : <Badge variant="outline" className="text-[10px]">Pendiente</Badge>

  const metrics = processedData
    ? [
        { label: 'Registros',  value: processedData.rowCount.toLocaleString(), ok: true },
        { label: 'Productos',  value: processedData.productCount,              ok: true },
        { label: 'Meses',      value: processedData.monthCount,               ok: true },
        { label: 'Errores',    value: processedData.parseErrors,              ok: processedData.parseErrors === 0 },
        { label: 'Período',    value: processedData.yearRange,                ok: true },
        { label: 'Revenue',    value: `Bs ${Math.round(processedData.totalRevenue / 1000)}K`, ok: true },
      ]
    : Array(6).fill(0).map((_, i) => ({ label: ['Registros','Productos','Meses','Errores','Período','Revenue'][i], value: '—', ok: true }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ─────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-xl bg-blue-600 p-2.5 sm:p-3 shrink-0">
            <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white"/>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">Data Structuring</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Carga tu CSV o Excel para activar el forecast con datos reales
            </p>
          </div>
        </div>
        {/* Action buttons — stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={downloadSampleData}>
            <Download className="h-4 w-4 mr-2"/>Descargar Excel de ejemplo
          </Button>
          {processedData && (
            <Button variant="outline" className="w-full sm:w-auto" onClick={clearUploadedData}>
              <RefreshCw className="h-4 w-4 mr-2"/>Restaurar demo
            </Button>
          )}
        </div>
      </div>

      {/* ── Status strip ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Progress */}
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Progreso del pipeline</p>
            <div className={cn('text-3xl font-bold mb-1', processedData ? 'text-green-600' : 'text-gray-400')}>
              {Math.round(progress)}%
            </div>
            <Progress value={progress} className="h-2 mb-1"/>
            <p className="text-xs text-gray-500">
              {processedData
                ? `${steps.filter(s => s.status === 'completed').length} de ${steps.length} pasos`
                : 'Sube un archivo para comenzar'}
            </p>
          </CardContent>
        </Card>

        {/* Source */}
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-2">Fuente de datos activa</p>
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-1.5', processedData ? 'bg-green-100' : 'bg-gray-100')}>
                <Database className={cn('h-5 w-5', processedData ? 'text-green-600' : 'text-gray-400')}/>
              </div>
              <div>
                <p className="font-semibold text-sm">{processedData ? 'Archivo cargado' : 'Sin datos reales'}</p>
                <p className="text-xs text-gray-500">
                  {processedData ? `${processedData.yearRange} · ${processedData.rowCount} filas` : 'Sube tu CSV o Excel'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage */}
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Cobertura temporal</p>
            <div className={cn('text-2xl font-bold mb-0.5', processedData ? 'text-blue-600' : 'text-gray-400')}>
              {processedData ? `${processedData.monthCount} meses` : '—'}
            </div>
            <p className="text-xs text-gray-500">{processedData ? processedData.yearRange : 'Sin datos cargados'}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Upload zone ────────────────────────────── */}
      <Card className="border-2 mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Cargar Datos Históricos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Arrastra tu CSV o Excel — el forecast se recalcula automáticamente con tus datos reales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden"/>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && openPicker()}
            className={cn(
              'border-2 border-dashed rounded-xl transition-all',
              'p-4 sm:p-8 text-center',
              !isUploading && 'cursor-pointer',
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
              isUploading && 'opacity-60 pointer-events-none'
            )}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                <p className="text-sm font-semibold text-blue-600">Procesando y calculando forecast...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-full bg-blue-50 p-3 inline-block mx-auto">
                  <Upload className="h-7 w-7 sm:h-9 sm:w-9 text-blue-500"/>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm sm:text-base">
                    {dragOver ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">o toca para seleccionar · .csv · .xlsx</p>
                </div>
                {processedData && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5"/>
                    {processedData.rowCount} filas cargadas · Sube otro para reemplazar
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column guide — compact on mobile */}
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">Columnas esperadas:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { col: 'Fecha',               desc: 'AAAA-MM-DD',     req: true  },
                { col: 'Producto',            desc: 'Nombre',          req: true  },
                { col: 'Cantidad_Vendida',    desc: 'Unidades',        req: true  },
                { col: 'Precio_Unitario_BOB', desc: 'Precio Bs',       req: true  },
                { col: 'Categoria',           desc: 'Tipo',            req: false },
                { col: 'Costo_Unitario_USD',  desc: 'Costo USD',       req: false },
                { col: 'Stock_Al_Cierre',     desc: 'Inventario',      req: false },
                { col: 'Lead_Time_Dias',      desc: 'Ej: 45 días',     req: false },
              ].map((c, i) => (
                <div key={i} className="rounded-lg bg-white border border-blue-100 p-2">
                  <p className="text-[10px] font-bold text-slate-800 font-mono truncate">{c.col}</p>
                  <p className="text-[9px] text-gray-500">{c.desc}</p>
                  <span className={cn('text-[8px] font-bold', c.req ? 'text-red-500' : 'text-gray-400')}>
                    {c.req ? '* requerida' : 'opcional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Pipeline + Metrics ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Pipeline steps */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Pipeline de Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((it, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {SIcon(it.status)}
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{it.name}</p>
                        {it.detail && <p className="text-[10px] text-gray-400">{it.detail}</p>}
                      </div>
                    </div>
                    {SBadge(it.status)}
                  </div>
                  <Progress
                    value={it.status === 'completed' ? 100 : it.status === 'in-progress' ? 60 : 0}
                    className="h-1 mt-1.5"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality metrics */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Métricas del Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m, i) => (
                <div key={i} className={cn('rounded-lg border-2 p-3',
                  m.ok ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50')}>
                  <p className="text-base sm:text-lg font-bold leading-tight">{m.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── AI Insights (only when data loaded) ────── */}
      {processedData && (
        <Card className="border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600"/>
              <CardTitle className="text-sm sm:text-base">Análisis IA de tus Datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                {
                  sev: 'low',
                  title: 'Dataset procesado correctamente',
                  desc: `${processedData.rowCount} registros, ${processedData.parseErrors} errores. Período: ${processedData.yearRange} (${processedData.monthCount} meses).`,
                },
                {
                  sev: processedData.products?.filter(p => p.status === 'critical').length > 0 ? 'high' : 'low',
                  title: processedData.products?.filter(p => p.status === 'critical').length > 0
                    ? 'Productos con stock crítico'
                    : 'Niveles de stock saludables',
                  desc: processedData.products?.filter(p => p.status === 'critical').length > 0
                    ? `${processedData.products.filter(p => p.status === 'critical').length} producto(s) por debajo del 50% del stock óptimo.`
                    : 'Todos los productos dentro del rango óptimo calculado.',
                },
                {
                  sev: 'medium',
                  title: 'Forecast anual calculado',
                  desc: `Regresión lineal proyectó los próximos 7 meses basándose en ${processedData.monthCount} meses de histórico.`,
                },
              ].map((ins, i) => {
                const sevBg   = ins.sev === 'high' ? 'border-red-200 bg-red-50' : ins.sev === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                const SevIcon = ins.sev === 'high' ? AlertCircle : ins.sev === 'medium' ? Clock : CheckCircle2
                const sevC    = ins.sev === 'high' ? 'text-red-600' : ins.sev === 'medium' ? 'text-yellow-600' : 'text-green-600'
                return (
                  <div key={i} className={cn('rounded-lg border-2 p-3 flex items-start gap-2', sevBg)}>
                    <SevIcon className={cn('h-4 w-4 mt-0.5 shrink-0', sevC)}/>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm">{ins.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{ins.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Preview table ───────────────────────────── */}
      {processedData && previewRows.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Vista Previa</CardTitle>
            <CardDescription className="text-xs">Primeras 6 filas del archivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs table-auto min-w-[320px]">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {previewHeaders.map(h => (
                        <th key={h} className="py-2 px-2 text-left font-semibold text-gray-600 break-words">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        {previewHeaders.map(h => (
                          <td key={h} className="py-1.5 px-2 break-words text-gray-700">
                            {String(row[h] instanceof Date ? row[h].toLocaleDateString() : row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            {processedData.rowCount > 6 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                + {processedData.rowCount - 6} filas más procesadas
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
