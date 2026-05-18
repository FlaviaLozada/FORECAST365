import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../lib/auth'
import { toast } from '../lib/toast'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label } from '../components/ui'
import { Mail, Lock, ArrowRight } from '../icons'
import logo from '../logo/forecast-logo.png'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (email && password) {
        setAuth({ isAuthenticated: true, user: { email, name: email.split('@')[0], plan: 'Professional' } })
        toast.success('¡Bienvenido de vuelta!')
        navigate('/app/executive')
      } else {
        toast.error('Por favor completa todos los campos')
      }
      setLoading(false)
    }, 500)
  }

  const demoLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setAuth({ isAuthenticated: true, user: { email: 'demo@forecast365.com', name: 'Usuario Demo', plan: 'Professional' } })
      toast.success('Accediendo a la demo...')
      navigate('/app/executive')
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="mb-4">
            <img src={logo} alt="Forecast365" className="h-12 w-auto mx-auto"/>
          </button>
          <p className="text-slate-500">Inicia sesión en tu cuenta</p>
        </div>
        <Card className="border-2 shadow-xl">
          <CardHeader><CardTitle>Iniciar Sesión</CardTitle><CardDescription>Ingresa tus credenciales para acceder al panel</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">¿Olvidaste?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}{!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">O</span></div>
            </div>
            <Button variant="outline" className="w-full" onClick={demoLogin} disabled={loading}>Acceder a la Demo</Button>
            <div className="mt-6 text-center text-sm text-slate-500">
              ¿No tienes cuenta? <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline font-semibold">Regístrate gratis</button>
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
