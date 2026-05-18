import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Button } from '../components/ui'
import { Check, TrendingUp, X, Download } from '../icons'
import { toast } from '../lib/toast'

const steps = [
  { num:1, title:'Extracción del ERP',             days:'Día 1–3',   status:'done',
    desc:'Exportamos catálogo, stock e historial de ventas (2022–2025) del ERP del cliente. Identificamos 4.108 SKUs totales, 2.881 activos.',
    deliverable:'Inventario consolidado · 8 almacenes' },
  { num:2, title:'Auditoría de calidad de datos',  days:'Día 4–7',   status:'done',
    desc:'Diagnóstico estructural: 312 duplicados, 142 inconsistencias, campos de aplicación vehículo incompletos en 32% del catálogo.',
    deliverable:'Informe de calidad · plan de remediación' },
  { num:3, title:'Normalización de catálogo',      days:'Día 8–15',  status:'done',
    desc:'Separamos código, descripción, marca, categoría, aplicación y costo en columnas estructuradas. Unificamos nomenclatura por marca.',
    deliverable:'Catálogo limpio · base relacional' },
  { num:4, title:'Base estructurada relacional',   days:'Día 16–22', status:'active',
    desc:'Modelado: tabla maestra de productos vinculada a ventas, compras y stock por almacén. En proceso: enriquecimiento de aplicación vehículo (OEM cross-reference).',
    deliverable:'Modelo de datos vivo en producción' },
  { num:5, title:'Validación con el cliente',      days:'Día 23–26', status:'pending',
    desc:'Revisión conjunta con los dueños. Validamos top 200 SKUs contra conocimiento del negocio. Cerramos vacíos de datos críticos.',
    deliverable:'Datos validados · acceso al dashboard' },
  { num:6, title:'Dashboard en producción',        days:'Día 27–30', status:'pending',
    desc:'Activación de todos los módulos con datos reales: Resumen, Demanda, Precios, Logística. El cliente opera con inteligencia desde día 1.',
    deliverable:'Dashboard live · operación plena' },
]

const achievements = [
  { text:'4.108 SKUs auditados · 2.881 activos confirmados',  done:true  },
  { text:'312 duplicados corregidos en el catálogo',           done:true  },
  { text:'Stock unificado en 8 almacenes (vista única)',       done:true  },
  { text:'4 años de ventas (2022–2025) cargados',             done:true  },
  { text:'Cross-reference OEM (en curso · 38%)',              done:false },
]

// ─── Agenda drawer ──────────────────────────────────────────────────────────
function AgendaDrawer({ onClose, onConfirm }) {
  const today = new Date()
  const defaultDate = new Date(today.setDate(today.getDate() + 4))
    .toISOString().slice(0, 10)

  const [form, setForm] = useState({
    fecha: defaultDate,
    inicio: '15:00',
    fin: '16:30',
    participante1: 'Don Pedro',
    participante2: 'María Vargas (F365)',
    agenda: 'Validación de catálogo · top 200 SKUs',
    notas: '',
  })
  const upd = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const handleConfirm = () => {
    if (!form.fecha || !form.inicio) { toast.error('Completa la fecha y hora'); return }
    onConfirm(form)
    toast.success('Reunión agendada correctamente')
    onClose()
  }

  return (
    <>
      <motion.div key="ol" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.2 }} onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"/>
      <motion.div key="dw" initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-50 flex flex-col shadow-2xl">

        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Agendar revisión</h2>
            <p className="text-xs text-gray-500">Onboarding · Módulo 1: Data Structuring</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X style={{ width:16, height:16 }}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => upd('fecha', e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inicio</label>
                <input type="time" value={form.inicio} onChange={e => upd('inicio', e.target.value)}
                  className="w-full h-10 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fin</label>
                <input type="time" value={form.fin} onChange={e => upd('fin', e.target.value)}
                  className="w-full h-10 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"/>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tema de la reunión</label>
            <input type="text" value={form.agenda} onChange={e => upd('agenda', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Participante 1</label>
            <input type="text" value={form.participante1} onChange={e => upd('participante1', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Participante 2</label>
            <input type="text" value={form.participante2} onChange={e => upd('participante2', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notas adicionales</label>
            <textarea value={form.notas} onChange={e => upd('notas', e.target.value)} rows={3}
              placeholder="Preparar top 200 SKUs para revisión..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"/>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 border border-purple-200 bg-purple-50">
            <p className="text-xs font-semibold text-purple-700 mb-2">Vista previa de la reunión</p>
            <p className="text-sm font-bold text-gray-900">{form.agenda || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {form.fecha ? new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday:'long', day:'numeric', month:'long' }) : '—'} · {form.inicio} — {form.fin}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{form.participante1} · {form.participante2}</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-[#4D17FC] hover:bg-[#3F12D6]" onClick={handleConfirm}>
            Confirmar reunión
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const { processedData } = useAppContext()
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [meeting, setMeeting] = useState(null) // confirmed meeting data

  const stepsResolved = steps.map((s, i) => ({
    ...s,
    status: i === 3 && processedData ? 'done' : s.status,
  }))
  const done     = stepsResolved.filter(s => s.status === 'done').length
  const progress = Math.round((done / steps.length) * 100)

  // Format meeting date for display
  const meetingDisplay = meeting
    ? {
        day: new Date(meeting.fecha + 'T12:00:00').getDate(),
        monthDay: new Date(meeting.fecha + 'T12:00:00').toLocaleDateString('es-BO', { month:'short', weekday:'short' }).toUpperCase(),
        time: `${meeting.inicio} — ${meeting.fin}`,
        people: `${meeting.participante1} · ${meeting.participante2}`,
        agenda: meeting.agenda,
      }
    : { day:'22', monthDay:'MAY · LUN', time:'15:00 — 16:30', people:'Don Pedro · María Vargas (F365)', agenda:'Validación de catálogo · top 200 SKUs' }

  // Generate weekly report Excel
  const handleReporteSemanal = () => {
    const wb = XLSX.utils.book_new()
    const fecha = new Date().toISOString().slice(0, 10)

    // Sheet 1: Progress
    const progressRows = [
      ['Reporte Semanal de Onboarding', '', ''],
      ['Fecha', fecha, ''],
      ['', '', ''],
      ['PROGRESO GENERAL', '', ''],
      ['Módulo', 'Data Structuring', ''],
      ['Progreso', `${progress}%`, ''],
      ['Pasos completados', `${done} de ${steps.length}`, ''],
      ['', '', ''],
      ['DETALLE DE PASOS', '', ''],
      ['Paso', 'Título', 'Estado'],
      ...stepsResolved.map(s => [
        `Paso ${s.num} (${s.days})`,
        s.title,
        s.status === 'done' ? '✓ Completado' : s.status === 'active' ? '⟳ En curso' : '○ Pendiente',
      ]),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(progressRows)
    ws1['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Progreso')

    // Sheet 2: Achievements
    const achRows = [
      ['Logros de la semana', ''],
      ...achievements.map(a => [a.done ? '✓' : '~', a.text]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(achRows)
    ws2['!cols'] = [{ wch: 4 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Logros')

    // Sheet 3: Next steps
    const pending = stepsResolved.filter(s => s.status !== 'done')
    const nextRows = [
      ['Próximos pasos', '', ''],
      ['Paso', 'Descripción', 'Entregable'],
      ...pending.map(s => [`${s.title} (${s.days})`, s.desc, s.deliverable]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(nextRows)
    ws3['!cols'] = [{ wch: 24 }, { wch: 60 }, { wch: 32 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Próximos pasos')

    // Sheet 4: Data (if loaded)
    if (processedData) {
      const dataRows = [
        ['Datos cargados', ''],
        ['Registros', processedData.rowCount],
        ['Productos únicos', processedData.productCount],
        ['Meses cubiertos', processedData.monthCount],
        ['Período', processedData.yearRange],
        ['Revenue histórico total', `Bs ${Math.round(processedData.totalRevenue).toLocaleString()}`],
      ]
      const ws4 = XLSX.utils.aoa_to_sheet(dataRows)
      XLSX.utils.book_append_sheet(wb, ws4, 'Datos cargados')
    }

    // Sheet 5: Meeting
    if (meeting) {
      const meetRows = [
        ['Próxima reunión agendada', ''],
        ['Fecha', meeting.fecha],
        ['Horario', `${meeting.inicio} — ${meeting.fin}`],
        ['Participante 1', meeting.participante1],
        ['Participante 2', meeting.participante2],
        ['Tema', meeting.agenda],
        ['Notas', meeting.notas || '—'],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meetRows), 'Reunión')
    }

    XLSX.writeFile(wb, `Forecast365_ReporteSemanal_${fecha}.xlsx`)
    toast.success('Reporte semanal descargado')
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Onboarding · primeros 30 días</h1>
            <p className="text-gray-500 text-sm mt-1">
              Módulo 1: Data Structuring · día 18 de 30
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setAgendaOpen(true)}>
              Agendar revisión
            </Button>
            <Button size="sm" className="bg-[#4D17FC] hover:bg-[#3F12D6]"
              onClick={handleReporteSemanal}>
              <Download className="h-3.5 w-3.5 mr-1.5"/>Reporte semanal
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left: progress + steps ── */}
          <div className="lg:col-span-7 space-y-4">

            {/* Progress card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Progreso del Módulo 1 · Data Structuring</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Estructurar el caos · habilitar planificación</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#4D17FC]">{progress}%</p>
                  <p className="text-xs text-gray-400">completado</p>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${progress}%`, background:'linear-gradient(90deg,#4D17FC,#7B59FF)' }}/>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {stepsResolved.map((s) => (
                <div key={s.num} className={cn(
                  'bg-white rounded-2xl border-2 p-5 transition-all',
                  s.status === 'active'  ? 'border-[#4D17FC] shadow-[0_0_0_3px_rgba(77,23,252,0.08)]' :
                  s.status === 'done'    ? 'border-gray-100' : 'border-gray-100 opacity-70'
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm',
                      s.status === 'done'   ? 'bg-green-500 text-white' :
                      s.status === 'active' ? 'bg-[#4D17FC] text-white' : 'bg-gray-100 text-gray-400'
                    )}>
                      {s.status === 'done' ? <Check style={{ width:14, height:14 }}/> : s.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-semibold text-sm sm:text-base leading-snug">{s.title}</h3>
                        {s.status === 'done' && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                            <Check style={{ width:10, height:10 }}/>Listo
                          </span>
                        )}
                        {s.status === 'active' && (
                          <span className="shrink-0 text-xs font-semibold text-[#4D17FC] bg-purple-50 px-2.5 py-1 rounded-full">En curso</span>
                        )}
                        {s.status === 'pending' && (
                          <span className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Pendiente</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-2">{s.desc}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{s.days}</span><span>·</span>
                        <span className="text-[#4D17FC] font-medium">📦 {s.deliverable}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:col-span-5 space-y-4">

            {/* Next meeting */}
            <div className="rounded-2xl p-6 text-white" style={{ background:'#020B36' }}>
              <h3 className="font-bold text-base mb-0.5">Próxima reunión</h3>
              <p className="text-sm mb-4" style={{ color:'rgba(255,255,255,0.65)' }}>{meetingDisplay.agenda}</p>
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-bold">{meetingDisplay.day}</p>
                  <p className="text-[10px] font-semibold tracking-wide mt-0.5" style={{ color:'rgba(255,255,255,0.5)' }}>{meetingDisplay.monthDay}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{meetingDisplay.time}</p>
                  <p className="text-xs mt-1 truncate" style={{ color:'rgba(255,255,255,0.55)' }}>{meetingDisplay.people}</p>
                  <button className="mt-3 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ background:'#4D17FC' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3F12D6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#4D17FC'}
                    onClick={() => { setAgendaOpen(true) }}>
                    {meeting ? 'Modificar' : 'Confirmar'}
                  </button>
                </div>
              </div>
              {meeting && (
                <p className="text-[10px] mt-3 pt-3 border-t" style={{ borderColor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)' }}>
                  ✓ Reunión confirmada · {meeting.notas || 'Sin notas adicionales'}
                </p>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-base mb-4">Lo que has logrado en 18 días</h3>
              <div className="space-y-3">
                {achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      a.done ? 'bg-green-500' : 'bg-gray-100'
                    )}>
                      {a.done && <Check style={{ width:10, height:10, color:'white' }}/>}
                    </div>
                    <p className={cn('text-sm leading-snug', !a.done && 'text-gray-400')}>{a.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready for module 2 */}
            <div className="rounded-2xl p-5 border-2 border-purple-200"
              style={{ background:'linear-gradient(135deg,#F4F1FF,#EEF2FF)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-[#4D17FC]"/>
                <h3 className="font-bold text-base text-[#4D17FC]">Listo para Módulo 2</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Al cerrar onboarding, activamos Demand Planning sobre 1.847 SKUs activos.
                Proyección rolling de 6 meses con segmentación ABC-XYZ.
              </p>
              <button onClick={() => navigate('/app/demand-planning')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background:'#4D17FC' }}
                onMouseEnter={e => e.currentTarget.style.background = '#3F12D6'}
                onMouseLeave={e => e.currentTarget.style.background = '#4D17FC'}>
                Vista previa del Módulo 2 →
              </button>
            </div>

            {/* Data loaded */}
            {processedData && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="h-4 w-4 text-green-600"/>
                  <h3 className="font-semibold text-sm text-green-800">Datos reales cargados</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label:'Registros', value:processedData.rowCount.toLocaleString() },
                    { label:'Productos', value:processedData.productCount },
                    { label:'Meses',     value:processedData.monthCount },
                  ].map((m, i) => (
                    <div key={i} className="bg-white rounded-lg p-2.5 text-center border border-green-100">
                      <p className="text-lg font-bold text-green-700">{m.value}</p>
                      <p className="text-[10px] text-gray-400">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agenda drawer */}
      <AnimatePresence>
        {agendaOpen && (
          <AgendaDrawer
            onClose={() => setAgendaOpen(false)}
            onConfirm={(data) => setMeeting(data)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
