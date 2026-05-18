import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { getAuth, clearAuth } from '../lib/auth'
import { toast } from '../lib/toast'
import { Sparkles, Calculator, Database, LineChart, DollarSign, Ship, LogOut, X, Rocket, Bell, FileText, BarChart2, Boxes } from '../icons'
import logo from '../logo/forecast-logo.png'

// ─── Dark sidebar tokens ───────────────────────────────────────────────────
const S = {
  bg:           '#020B36',
  border:       'rgba(255,255,255,0.06)',
  text:         'rgba(255,255,255,0.70)',
  textMuted:    'rgba(255,255,255,0.40)',
  textActive:   '#ffffff',
  hoverBg:      'rgba(255,255,255,0.05)',
  activeBg:     'linear-gradient(90deg, rgba(77,23,252,0.32) 0%, rgba(77,23,252,0.12) 100%)',
  activeShadow: 'inset 0 0 0 1px rgba(168,154,255,0.22)',
  iconActive:   '#B8A8FF',
  badge:        '#4D17FC',
  avatarBg:     'linear-gradient(135deg,#4D17FC,#7B59FF)',
  clientBg:     'rgba(255,255,255,0.05)',
}

const navModules = [
  { path:'/app/executive',        label:'Resumen',          icon:Sparkles,  badgeKey:null     },
  { path:'/app/simulator',        label:'Simulador',        icon:Calculator,badgeKey:null     },
  { path:'/app/demand-planning',  label:'Demanda',          icon:LineChart, badgeKey:null     },
  { path:'/app/price-committee',  label:'Precios',          icon:DollarSign,badgeKey:'prices' },
  { path:'/app/logistics',        label:'Logística',        icon:Ship,      badgeKey:null     },
  { path:'/app/inventario',       label:'Inventario',       icon:Boxes,     badgeKey:null     },
  { path:'/app/data-structuring', label:'Data Structuring', icon:Database,  badgeKey:null     },
]

const navOperacion = [
  { path:'/app/onboarding',   label:'Onboarding',   icon:Rocket,   badgeKey:null     },
  { path:'/app/alertas',      label:'Alertas',       icon:Bell,     badgeKey:'alerts' },
  { path:'/app/reportes',     label:'Reportes',      icon:BarChart2,badgeKey:null     },
  { path:'/app/datos-crudos', label:'Datos crudos',  icon:FileText, badgeKey:null     },
]

function NavItem({ path, label, icon: Icon, badge, onClose }) {
  return (
    <NavLink to={path} onClick={onClose}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:11,
        padding:'8.5px 10px', borderRadius:9, marginBottom:2,
        color: isActive ? S.textActive : S.text,
        background: isActive ? S.activeBg : 'transparent',
        boxShadow: isActive ? S.activeShadow : 'none',
        textDecoration:'none', fontSize:13.5, fontWeight:500,
        transition:'all .15s', width:'100%',
      })}
      onMouseEnter={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.textActive }}
      onMouseLeave={e => { if (!e.currentTarget.style.background.includes('gradient')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.text } }}
    >
      {({ isActive }) => (
        <>
          <Icon style={{ width:18, height:18, flexShrink:0, color: isActive ? S.iconActive : 'rgba(255,255,255,0.55)' }}/>
          <span style={{ flex:1 }}>{label}</span>
          {badge != null && badge > 0 && (
            <span style={{ background:S.badge, color:'#fff', fontSize:10.5, padding:'1px 6.5px', borderRadius:99, fontWeight:600, minWidth:18, textAlign:'center' }}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ text }) {
  return (
    <p style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:S.textMuted, padding:'0 8px', marginBottom:6, marginTop:4 }}>
      {text}
    </p>
  )
}

function SidebarContent({ onClose }) {
  const navigate    = useNavigate()
  const { products } = useAppContext()
  const user        = getAuth()?.user

  // Dynamic badges
  const pricesBadge = products.filter(p => p.currentPrice !== p.recommendedPrice).length || null
  const alertsBadge = products.filter(p => p.status === 'critical' || p.status === 'warning').length || null
  const badges      = { prices: pricesBadge, alerts: alertsBadge }

  // Client info
  const company  = user?.company || user?.name || 'Usuario'
  const initials = company.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => { clearAuth(); toast.success('Sesión cerrada'); navigate('/login') }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:S.bg, color:S.text, overflow:'hidden' }}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{ padding:'18px 16px 14px', borderBottom:`1px solid ${S.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <img src={logo} alt="Forecast365" style={{ height:48, width:'auto', filter:'brightness(0) invert(1)' }}/>
        {onClose && (
          <button onClick={onClose}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, border:0, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
            <X style={{ width:14, height:14 }}/>
          </button>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 10px 8px' }}>
        <SectionLabel text="Módulos"/>
        <div style={{ display:'flex', flexDirection:'column', marginBottom:18 }}>
          {navModules.map(it => <NavItem key={it.path} {...it} badge={badges[it.badgeKey]} onClose={onClose}/>)}
        </div>

        <SectionLabel text="Operación"/>
        <div style={{ display:'flex', flexDirection:'column' }}>
          {navOperacion.map(it => <NavItem key={it.path} {...it} badge={badges[it.badgeKey]} onClose={onClose}/>)}
        </div>
      </div>

      {/* ── Client + Logout ──────────────────────────────────── */}
      <div style={{ padding:'12px 12px 14px', borderTop:`1px solid ${S.border}` }}>
        <p style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:S.textMuted, marginBottom:8 }}>
          Cliente activo
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:11, background:S.clientBg, marginBottom:10 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:S.avatarBg, display:'grid', placeItems:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0, fontFamily:'inherit' }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#fff', fontSize:12.5, fontWeight:500, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {company}
            </div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:1 }}>
              {user?.plan || 'Professional'}
            </div>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:9, border:0, background:'transparent', color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'color .15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          <LogOut style={{ width:16, height:16 }}/>Cerrar Sesión
        </button>

        <p style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:12, letterSpacing:'0.04em', paddingLeft:2 }}>
          v1.0.0 · Mayo 2026
        </p>
      </div>
    </div>
  )
}

export default function SidebarNav({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop — siempre visible */}
      <div className="hidden md:block" style={{ width:248, flexShrink:0, height:'100vh', position:'fixed', left:0, top:0, zIndex:30 }}>
        <SidebarContent/>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div key="overlay"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.2 }}
              onClick={onClose}
              style={{ position:'fixed', inset:0, background:'rgba(2,11,54,0.55)', zIndex:40 }}
            />
            <motion.div key="drawer"
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:30, stiffness:300 }}
              style={{ position:'fixed', top:0, left:0, bottom:0, width:248, zIndex:50 }}
            >
              <SidebarContent onClose={onClose}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
