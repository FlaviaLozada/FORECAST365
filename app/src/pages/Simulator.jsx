import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { cn } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Label, Slider } from '../components/ui'
import { Calculator, TrendingUp, DollarSign, Package, RefreshCw } from '../icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function SliderField({ label, value, onChange, min, max, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline" className="font-mono">{value > 0 ? '+' : ''}{value}%</Badge>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={1}/>
      <div className="flex justify-between text-xs text-gray-400">{hint}</div>
    </div>
  )
}

function MiniResult({ label, value, delta }) {
  const pos = delta > 0, neg = delta < 0
  return (
    <div className="flex-1 text-center px-2 py-1.5">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900 leading-tight">{value}</p>
      <p className={cn('text-[10px] font-medium', pos ? 'text-green-600' : neg ? 'text-red-600' : 'text-gray-400')}>
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
      </p>
    </div>
  )
}

const presets = [
  { name: 'Crisis Cambiaria',      desc: 'Dólar sube 15%, demanda cae 10%',     s: { dollar: 15, demand: -10, price: 12  } },
  { name: 'Crecimiento Optimista', desc: 'Demanda sube 25%, precios +8%',        s: { dollar: 2,  demand: 25,  price: 8   } },
  { name: 'Competencia Agresiva',  desc: 'Bajas precios 10% para ganar mercado', s: { dollar: 0,  demand: 15,  price: -10 } },
  { name: 'Estabilidad',           desc: 'Condiciones actuales sin cambios',      s: { dollar: 0,  demand: 0,   price: 0   } },
]

export default function Simulator() {
  const { products, exchangeRate } = useAppContext()
  const [dollarChange, setDollarChange] = useState(0)
  const [demandChange, setDemandChange] = useState(0)
  const [priceChange, setPriceChange]   = useState(0)

  const newExchangeRate = exchangeRate.current * (1 + dollarChange / 100)
  const avgCost  = products.reduce((a, p) => a + p.costUSD, 0) / (products.length || 1)
  const avgPrice = products.reduce((a, p) => a + p.currentPrice, 0) / (products.length || 1)
  const currentRevenue = products.reduce((a, p) => a + p.avgDemand * p.currentPrice, 0)
  const currentCost    = products.reduce((a, p) => a + p.avgDemand * p.costUSD * exchangeRate.current, 0)
  const currentMargin  = currentRevenue ? ((currentRevenue - currentCost) / currentRevenue) * 100 : 0
  const newDemand   = products.reduce((a, p) => a + p.avgDemand * (1 + demandChange / 100), 0)
  const newPriceAvg = avgPrice * (1 + priceChange / 100)
  const newRevenue  = newDemand * newPriceAvg
  const newCost     = newDemand * avgCost * newExchangeRate
  const newMargin   = newRevenue ? ((newRevenue - newCost) / newRevenue) * 100 : 0
  const impact = {
    revenue: currentRevenue ? ((newRevenue - currentRevenue) / currentRevenue) * 100 : 0,
    cost:    currentCost    ? ((newCost - currentCost) / currentCost) * 100 : 0,
    margin:  newMargin - currentMargin,
  }

  const comparisonData = [
    { metric: 'Ingresos (k)', actual: currentRevenue / 1000, escenario: newRevenue / 1000 },
    { metric: 'Costos (k)',   actual: currentCost / 1000,    escenario: newCost / 1000    },
    { metric: 'Margen %',     actual: currentMargin,         escenario: newMargin         },
  ]

  const reset   = () => { setDollarChange(0); setDemandChange(0); setPriceChange(0) }
  const iColor  = v => v > 3 ? 'text-green-600' : v < -3 ? 'text-red-600' : 'text-yellow-600'
  const iBg     = v => v > 3 ? 'bg-green-50 border-green-200' : v < -3 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
  const fmt     = n => `Bs ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const applyP  = p => { setDollarChange(p.s.dollar); setDemandChange(p.s.demand); setPriceChange(p.s.price) }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-600 p-2.5 sm:p-3">
            <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-white"/>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Simulador de Escenarios</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Proyecta el impacto de diferentes condiciones de mercado</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="h-4 w-4 sm:mr-2"/><span className="hidden sm:inline">Resetear</span>
        </Button>
      </div>

      {/* ─── MOBILE ─────────────────────────────────── */}
      <div className="lg:hidden space-y-4">

        {/* Resultados en vivo — siempre visibles mientras ajustás los sliders */}
        <div className={cn('rounded-xl border-2 p-3 transition-all duration-200', iBg(impact.margin))}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">
            Resultado en vivo
          </p>
          <div className="flex divide-x divide-gray-200">
            <MiniResult label="Ingresos"  value={fmt(newRevenue)}            delta={impact.revenue}/>
            <MiniResult label="Costos"    value={fmt(newCost)}               delta={-impact.cost}/>
            <MiniResult label="Margen"    value={`${newMargin.toFixed(1)}%`} delta={impact.margin}/>
          </div>
          <p className={cn('text-center text-[10px] font-medium mt-2',
            impact.margin > 3 ? 'text-green-700' : impact.margin < -3 ? 'text-red-700' : 'text-yellow-700')}>
            {impact.margin > 3 ? '✓ Escenario favorable' : impact.margin < -3 ? '⚠ Impacto negativo en rentabilidad' : '~ Escenario neutro'}
          </p>
        </div>

        {/* Sliders justo debajo para que el usuario vea el impacto arriba */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Variables de Simulación</CardTitle>
            <CardDescription className="text-xs">Mueve los sliders — los números de arriba se actualizan al instante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderField
              label="Tipo de Cambio (USD/BOB)"
              value={dollarChange} onChange={setDollarChange} min={-20} max={20}
              hint={<><span>-20%</span><span className="font-semibold text-blue-600">Bs {newExchangeRate.toFixed(2)}</span><span>+20%</span></>}
            />
            <SliderField
              label="Demanda del Mercado"
              value={demandChange} onChange={setDemandChange} min={-30} max={30}
              hint={<><span>-30%</span><span>0%</span><span>+30%</span></>}
            />
            <SliderField
              label="Ajuste de Precios"
              value={priceChange} onChange={setPriceChange} min={-25} max={25}
              hint={<><span>-25%</span><span>0%</span><span>+25%</span></>}
            />
          </CardContent>
        </Card>

        {/* Gráfico — justo después de los sliders */}
        <Card className="border-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Comparación: Actual vs Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparisonData} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="metric" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
                <Bar dataKey="actual"    fill="#3b82f6" name="Actual"    radius={[3,3,0,0]}/>
                <Bar dataKey="escenario" fill="#8b5cf6" name="Escenario" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Escenarios predefinidos en grid 2x2 */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Escenarios Predefinidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p, i) => (
                <button key={i} onClick={() => applyP(p)}
                  className="text-left p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <p className="font-semibold text-xs text-gray-800 leading-snug">{p.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── DESKTOP ────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Variables de Simulación</CardTitle>
            <CardDescription>Ajusta los parámetros para ver el impacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderField
              label="Tipo de Cambio (USD/BOB)"
              value={dollarChange} onChange={setDollarChange} min={-20} max={20}
              hint={<><span>-20%</span><span>Bs {newExchangeRate.toFixed(2)}</span><span>+20%</span></>}
            />
            <SliderField
              label="Demanda del Mercado"
              value={demandChange} onChange={setDemandChange} min={-30} max={30}
              hint={<><span>-30%</span><span>0%</span><span>+30%</span></>}
            />
            <SliderField
              label="Ajuste de Precios"
              value={priceChange} onChange={setPriceChange} min={-25} max={25}
              hint={<><span>-25%</span><span>0%</span><span>+25%</span></>}
            />
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">Escenarios Predefinidos:</p>
              <div className="space-y-2">
                {presets.map((p, i) => (
                  <button key={i} onClick={() => applyP(p)}
                    className="w-full text-left p-2.5 rounded-lg border hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-xs">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card className="border-2">
            <CardHeader><CardTitle>Comparación: Actual vs Escenario</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="metric"/><YAxis/><Tooltip/><Legend/>
                  <Bar dataKey="actual"    fill="#3b82f6" name="Actual"    radius={[4,4,0,0]}/>
                  <Bar dataKey="escenario" fill="#8b5cf6" name="Escenario" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, color: 'text-blue-600',  label: 'Ingresos', val: fmt(newRevenue),            pct: impact.revenue, v: impact.revenue  },
              { icon: DollarSign, color: 'text-amber-600', label: 'Costos',   val: fmt(newCost),               pct: impact.cost,    v: -impact.cost     },
              { icon: Package,    color: 'text-green-600', label: 'Margen',   val: `${newMargin.toFixed(1)}%`, pct: impact.margin,  v: impact.margin    },
            ].map((c, i) => (
              <Card key={i} className="border-2"><CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <c.icon className={cn('h-5 w-5', c.color)}/>
                  <p className="text-sm text-gray-500">{c.label}</p>
                </div>
                <p className="text-2xl font-bold mb-1">{c.val}</p>
                <p className={cn('text-sm', iColor(c.v))}>
                  {c.pct > 0 ? '+' : ''}{c.pct.toFixed(1)}% vs actual
                </p>
              </CardContent></Card>
            ))}
          </div>

          <Card className={cn('border-2', iBg(impact.revenue))}>
            <CardContent className="p-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Recomendación IA:</p>
                <p className="text-sm text-blue-800">
                  {impact.margin > 3
                    ? 'Este escenario es favorable. Considera implementar estas condiciones gradualmente.'
                    : impact.margin < -3
                    ? 'Alerta: Este escenario impactaría negativamente tu rentabilidad. Busca estrategias de mitigación.'
                    : 'Escenario neutral. Monitorea de cerca las variables clave.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
