import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../lib/auth'
import { toast } from '../lib/toast'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label } from '../components/ui'
import { User, Mail, Building, Lock, ArrowRight } from '../icons'
import logo from '../logo/forecast-logo.png'

export default function Register() {
  const navigate = useNavigate()
  const [d, setD]     = useState({ name:'', email:'', company:'', password:'', confirmPassword:'' })
  const [loading, setLoading] = useState(false)
  const upd = (k, v) => setD(s => ({ ...s, [k]: v }))

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    if (d.password !== d.confirmPassword) { toast.error('Las contraseñas no coinciden'); setLoading(false); return }
    if (d.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return }
    setTimeout(() => {
      setAuth({ isAuthenticated: true, user: { email: d.email, name: d.name, company: d.company, plan: 'Professional' } })
      toast.success('¡Cuenta creada! Bienvenido a Forecast365')
      navigate('/app/executive')
    }, 600)
  }

  const fields = [
    { id:'name',            label:'Nombre Completo *',      type:'text',     ph:'Juan Pérez',           icon:User,     req:true  },
    { id:'email',           label:'Correo Electrónico *',   type:'email',    ph:'tu@empresa.com',        icon:Mail,     req:true  },
    { id:'company',         label:'Empresa (opcional)',      type:'text',     ph:'Mi Empresa SRL',        icon:Building, req:false },
    { id:'password',        label:'Contraseña *',           type:'password', ph:'Mínimo 6 caracteres',   icon:Lock,     req:true  },
    { id:'confirmPassword', label:'Confirmar Contraseña *', type:'password', ph:'Repite tu contraseña',  icon:Lock,     req:true  },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="mb-4">
            <img src={logo} alt="Forecast365" className="h-12 w-auto mx-auto"/>
          </button>
          <p className="text-slate-500">Crea tu cuenta y comienza en minutos</p>
        </div>
        <Card className="border-2 shadow-xl">
          <CardHeader><CardTitle>Crear Cuenta</CardTitle><CardDescription>14 días de prueba gratis, sin tarjeta de crédito</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {fields.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input id={f.id} type={f.type} placeholder={f.ph} value={d[f.id]} onChange={e => upd(f.id, e.target.value)} className="pl-10" required={f.req} />
                    </div>
                  </div>
                )
              })}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
                <p className="text-blue-900 font-semibold mb-2">✓ Tu prueba gratis incluye:</p>
                <ul className="text-blue-800 space-y-1 text-xs">
                  <li>• Todas las funciones Professional</li>
                  <li>• Hasta 1,000 productos</li>
                  <li>• IA avanzada y simulador</li>
                  <li>• Soporte prioritario</li>
                </ul>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Cuenta Gratis'}{!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500">
              ¿Ya tienes cuenta? <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">Inicia sesión</button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-blue-600">← Volver al inicio</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
