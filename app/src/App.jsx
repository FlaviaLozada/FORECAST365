import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { getAuth } from './lib/auth'
import SidebarNav from './components/SidebarNav'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Executive from './pages/Executive'
import Simulator from './pages/Simulator'
import DataStructuring from './pages/DataStructuring'
import DemandPlanning from './pages/DemandPlanning'
import PriceCommittee from './pages/PriceCommittee'
import Logistics from './pages/Logistics'
import Alertas from './pages/Alertas'
import Onboarding from './pages/Onboarding'
import Reportes from './pages/Reportes'
import DatosCrudos from './pages/DatosCrudos'
import Inventario from './pages/Inventario'
import logo from './logo/forecast-logo.png'
import { Menu } from './icons'

function ProtectedRoute({ children }) {
  const auth = getAuth()
  if (!auth?.isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* md:ml-[248px] matches the new sidebar width */}
      <div className="flex-1 md:ml-[248px] flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="Forecast365" className="h-8 w-auto" />
        </div>

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="executive"        element={<Executive />} />
            <Route path="simulator"        element={<Simulator />} />
            <Route path="data-structuring" element={<DataStructuring />} />
            <Route path="demand-planning"  element={<DemandPlanning />} />
            <Route path="price-committee"  element={<PriceCommittee />} />
            <Route path="logistics"        element={<Logistics />} />
            <Route path="inventario"       element={<Inventario />} />
            <Route path="alertas"          element={<Alertas />} />
            <Route path="onboarding"       element={<Onboarding />} />
            <Route path="reportes"         element={<Reportes />} />
            <Route path="datos-crudos"     element={<DatosCrudos />} />
            <Route index                   element={<Navigate to="executive" replace />} />
            <Route path="*"                element={<Navigate to="executive" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/app/*"    element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AppProvider>
    </HashRouter>
  )
}
