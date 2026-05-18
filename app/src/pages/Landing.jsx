import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import logo from '../logo/forecast-logo.png'
import { cn } from '../lib/utils'
import { Button, Badge } from '../components/ui'
import {
  Sparkles, TrendingUp, DollarSign, Ship, Calculator, Brain,
  Boxes, Check, ArrowRight, PlayCircle, Database, Cpu, Lightbulb,
  Rocket, Star, Menu, X,
} from '../icons'

// ─── Shared animation config ──────────────────────────────────
const ease = [0.25, 0.46, 0.45, 0.94]

const variants = {
  fadeUp:   { hidden: { opacity: 0, y: 36  }, show: { opacity: 1, y: 0   } },
  fadeDown: { hidden: { opacity: 0, y: -24 }, show: { opacity: 1, y: 0   } },
  fadeIn:   { hidden: { opacity: 0         }, show: { opacity: 1         } },
  slideL:   { hidden: { opacity: 0, x: -52 }, show: { opacity: 1, x: 0   } },
  slideR:   { hidden: { opacity: 0, x:  52 }, show: { opacity: 1, x: 0   } },
  scaleUp:  { hidden: { opacity: 0, scale: 0.90 }, show: { opacity: 1, scale: 1 } },
  scaleCard:{ hidden: { opacity: 0, scale: 0.94, y: 20 }, show: { opacity: 1, scale: 1, y: 0 } },
}

// Staggered container — children inherit the "show" state
function Stagger({ children, className, delay = 0, gap = 0.11, margin = '-60px' }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Single element — scroll-triggered
function Reveal({ children, className, v = 'fadeUp', delay = 0, duration = 0.65 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants[v]}
      transition={{ duration, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger child — used inside <Stagger>
function Item({ children, className, v = 'fadeUp', duration = 0.6 }) {
  return (
    <motion.div
      variants={variants[v]}
      transition={{ duration, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const navLinks = [
  { id: 'features',    label: 'Características' },
  { id: 'how-it-works',label: 'Cómo Funciona'   },
  { id: 'pricing',     label: 'Precios'          },
]

// ─── Sub-components ───────────────────────────────────────────
function PricingCard({ tier, price, subtitle, items, popular, onCta, ctaText }) {
  return (
    <motion.div
      variants={variants.scaleCard}
      transition={{ duration: 0.55, ease }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={cn(
        'relative rounded-2xl p-6 sm:p-8 flex flex-col cursor-default',
        popular
          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/25 ring-1 ring-slate-800'
          : 'bg-white border border-slate-200 shadow-sm'
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 shadow-lg">
            Más popular
          </Badge>
        </div>
      )}
      <div>
        <h3 className={cn('text-xl font-bold', popular ? 'text-white' : 'text-slate-900')}>{tier}</h3>
        {subtitle && <p className={cn('text-sm mt-1', popular ? 'text-slate-300' : 'text-slate-500')}>{subtitle}</p>}
        <div className="mt-5 flex items-baseline gap-1">
          <span className={cn('text-4xl sm:text-5xl font-extrabold tracking-tight', popular ? 'text-white' : 'text-slate-900')}>{price}</span>
          {!price.toLowerCase().includes('medida') && (
            <span className={cn('text-sm', popular ? 'text-slate-400' : 'text-slate-500')}>/año</span>
          )}
        </div>
      </div>
      <ul className="space-y-3 my-6 flex-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', popular ? 'text-emerald-400' : 'text-emerald-600')} />
            <span className={popular ? 'text-slate-200' : 'text-slate-700'}>{it}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onCta}
        className={popular ? 'bg-white text-slate-900 hover:bg-slate-100 w-full' : 'w-full bg-slate-900 hover:bg-slate-800'}
      >
        {ctaText}
      </Button>
    </motion.div>
  )
}

function FeatureCard({ children, className = '', tone = 'light' }) {
  const tones = {
    light: 'bg-white border border-slate-200',
    dark:  'bg-slate-900 text-white border border-slate-800',
  }
  return (
    <motion.div
      variants={variants.scaleCard}
      transition={{ duration: 0.55, ease }}
      whileHover={tone === 'light' ? { y: -4, boxShadow: '0 12px 40px -8px rgba(0,0,0,0.12)', transition: { duration: 0.2 } } : {}}
      className={cn('rounded-2xl p-4 sm:p-6 lg:p-7', tones[tone], className)}
    >
      {children}
    </motion.div>
  )
}

function MiniKPI({ label, value, tone }) {
  const tones = { blue: 'bg-blue-50 text-blue-700', purple: 'bg-purple-50 text-purple-700', red: 'bg-red-50 text-red-700' }
  return (
    <div className="rounded-xl border border-slate-100 p-2.5 sm:p-3">
      <p className={cn('inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-1.5', tones[tone])}>{label}</p>
      <p className="text-base sm:text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

const Leg = ({ dot, label }) => (
  <span className="inline-flex items-center gap-1.5 text-slate-500">
    <span className="w-2 h-2 rounded-full" style={{ background: dot }} />{label}
  </span>
)

function HeroPreview() {
  return (
    <div className="relative">
      {/* Floating chip top */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.8 }}
        className="hidden sm:flex absolute -top-4 right-4 z-20 animate-float items-center gap-2 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 px-3 py-2.5"
      >
        <div className="rounded-lg bg-emerald-100 p-1.5"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
        <div><p className="text-[10px] text-slate-500 leading-none">Demanda jun</p><p className="text-sm font-bold text-slate-900 leading-tight">+28%</p></div>
      </motion.div>

      {/* Floating chip bottom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 1.0 }}
        className="hidden sm:flex absolute -bottom-4 left-4 z-20 items-center gap-2 animate-[float_5s_ease-in-out_infinite_-1s] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 px-3 py-2.5"
      >
        <div className="rounded-lg bg-purple-100 p-1.5"><Brain className="h-4 w-4 text-purple-600" /></div>
        <div><p className="text-[10px] text-slate-500 leading-none">Precisión IA</p><p className="text-sm font-bold text-slate-900 leading-tight">92.3%</p></div>
      </motion.div>

      {/* Main card */}
      <div className="relative rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
          </div>
          <p className="text-xs text-slate-500 ml-2 font-medium">forecast365.com/app/executive</p>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Dashboard Ejecutivo</p>
              <h3 className="text-lg sm:text-xl font-bold">Resumen Anual 2024</h3>
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px]">
              <Sparkles className="h-3 w-3 mr-1 inline"/>IA Activa
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <MiniKPI label="Inventario" value="Bs 284K" tone="blue"/>
            <MiniKPI label="Margen"     value="38.2%"   tone="purple"/>
            <MiniKPI label="Críticos"   value="1"       tone="red"/>
          </div>
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50/40 to-purple-50/40 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-700">Proyección Anual de Ingresos</p>
              <span className="text-[10px] text-slate-500">Bs 465K · Dic</span>
            </div>
            <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ph-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth="0.5"/>
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth="0.5"/>
              <path d="M0,55 C40,50 80,40 120,32 C160,24 200,18 240,12 C260,10 280,8 300,6 L300,80 L0,80 Z" fill="url(#ph-g)"/>
              <path d="M0,55 C40,50 80,40 120,32 C160,24 200,18 240,12 C260,10 280,8 300,6" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
              <path d="M0,60 C50,58 100,55 150,50 C200,45 250,42 300,38" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
              <path d="M0,62 C40,58 80,52 120,46 L120,46" stroke="#10b981" strokeWidth="2" fill="none"/>
              <circle cx="300" cy="6" r="3" fill="#8b5cf6"/>
            </svg>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <Leg dot="#10b981" label="Real"/>
              <Leg dot="#3b82f6" label="Tradicional"/>
              <Leg dot="#8b5cf6" label="Predicción IA"/>
            </div>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 flex items-start gap-2.5">
            <div className="rounded-lg bg-white p-1.5 shadow-sm shrink-0"><Brain className="h-4 w-4 text-purple-600" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-900 mb-0.5">Oportunidad detectada</p>
              <p className="text-xs text-slate-600 leading-relaxed">Aumenta stock de FA-2000 antes del 5 jun · ahorro Bs 4.2K</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const stats = [
    { value: '92%',  label: 'Precisión IA'    },
    { value: '35%',  label: 'Reducción costos' },
    { value: '67%',  label: 'Menos quiebres'  },
    { value: '500+', label: 'PyMEs confiando'  },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* ── MOBILE DRAWER — fuera del nav para evitar el bug de transform+fixed ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '288px', background: 'white', zIndex: 50,
                boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <img src={logo} alt="Forecast365" style={{ height: '36px', width: 'auto' }}/>
                <button onClick={() => setMenuOpen(false)}
                  style={{ padding: '8px', borderRadius: '8px', color: '#64748b', cursor: 'pointer', border: 'none', background: 'none' }}>
                  <X className="h-5 w-5"/>
                </button>
              </div>

              {/* Nav links */}
              <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
                {navLinks.map(l => (
                  <button key={l.id}
                    onClick={() => { scrollTo(l.id); setMenuOpen(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', fontSize: '16px', fontWeight: 500, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {l.label}
                  </button>
                ))}
              </nav>

              {/* CTAs */}
              <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <Button variant="outline" className="w-full"
                  onClick={() => { navigate('/login'); setMenuOpen(false) }}>
                  Iniciar Sesión
                </Button>
                <Button className="w-full bg-slate-900 hover:bg-slate-800"
                  onClick={() => { navigate('/login'); setMenuOpen(false) }}>
                  Comenzar gratis
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── NAVBAR — sin transform Y para no romper position:fixed de hijos ── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="shrink-0">
            <img src={logo} alt="Forecast365" className="h-12 w-auto"/>
          </button>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-slate-800">
              Comenzar gratis<ArrowRight className="h-4 w-4 ml-1.5"/>
            </Button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2 text-slate-700">
            {menuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
          </button>
        </div>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        {/* Background blobs */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.4, ease }}
            className="hidden sm:block absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200 to-purple-200 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 1.6, ease, delay: 0.2 }}
            className="hidden sm:block absolute top-40 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-200 to-pink-200 blur-3xl"
          />
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"/>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-14 pb-10 sm:pb-12 lg:pb-14">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* Left column */}
            <div className="lg:col-span-6">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"/>
                </span>
                <span className="text-xs font-medium text-slate-700">Nueva versión 2.0 · Potenciada por IA</span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900"
              >
                Planifica tu demanda con precisión{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    empresarial
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                    <motion.path
                      d="M2 9 C 80 1, 220 1, 298 9"
                      stroke="url(#underline-grad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease, delay: 0.9 }}
                    />
                    <defs>
                      <linearGradient id="underline-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#2563eb"/><stop offset="1" stopColor="#ec4899"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>.
              </motion.h1>

              {/* Paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease, delay: 0.38 }}
                className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl"
              >
                IA que predice demanda, optimiza precios y rastrea importaciones para PyMEs latinoamericanas. Precisión empresarial al alcance de tu negocio.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.52 }}
                className="mt-8 flex flex-col sm:flex-row gap-3"
              >
                <Button size="lg" onClick={() => navigate('/login')}
                  className="bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 group">
                  Comienza gratis 14 días
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5"/>
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo('how-it-works')}>
                  <PlayCircle className="h-5 w-5 mr-2 text-blue-600"/> Ver demo en vivo
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500"
              >
                {['Sin tarjeta', 'Setup en 5 min', 'Soporte en español'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600"/>
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column — preview card */}
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, x: 48, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.85, ease, delay: 0.3 }}
            >
              <HeroPreview/>
            </motion.div>
          </div>

          {/* Stats bar */}
          <Stagger
            className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"
            delay={0.05}
            gap={0.09}
            margin="-40px"
          >
            {stats.map((s, i) => (
              <Item key={i} v="scaleUp" duration={0.5}
                className="bg-white p-5 sm:p-6 text-center">
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── INTEGRATIONS STRIP ─────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Reveal v="fadeUp" duration={0.5}>
            <p className="text-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Conecta tus datos en minutos
            </p>
          </Reveal>
          <Stagger className="flex flex-wrap items-center justify-center gap-3 sm:gap-4" gap={0.06}>
            {['SAP Business One','Odoo','Excel','Google Sheets','CSV','Quickbooks','Bind ERP','Custom API'].map((src, i) => (
              <Item key={i} v="scaleUp" duration={0.4}>
                <div className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                  {src}
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-12 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal v="fadeUp" className="max-w-2xl mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Una plataforma, todo integrado
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Seis módulos. Una decisión informada por minuto.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Cuando el dólar sube, los precios se ajustan. Cuando la demanda crece, las órdenes salen.
              Sin hojas de Excel sueltas.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5" gap={0.08}>
            {/* Big feature — IA */}
            <Item className="col-span-2 lg:col-span-4 lg:row-span-2">
              <FeatureCard tone="dark" className="h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                    <Brain className="h-7 w-7 text-white"/>
                  </div>
                  <Badge className="bg-white/10 text-white border border-white/20 backdrop-blur">CORE</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white tracking-tight">
                  Inteligencia Artificial que entiende tu negocio
                </h3>
                <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg">
                  Modelos entrenados con tu historial detectan picos estacionales, tendencias emergentes y
                  anomalías — con 92% de precisión.
                </p>
                <Stagger className="mt-8 grid grid-cols-3 gap-3 sm:gap-4" delay={0.2} gap={0.1}>
                  {[{ label:'Precisión', value:'92%' },{ label:'Patrones detectados', value:'47' },{ label:'Modelos activos', value:'12' }].map((m, i) => (
                    <Item key={i} v="fadeUp" duration={0.45}>
                      <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-3 sm:p-4">
                        <p className="text-xl sm:text-2xl font-bold text-white">{m.value}</p>
                        <p className="text-xs text-white/60 mt-0.5">{m.label}</p>
                      </div>
                    </Item>
                  ))}
                </Stagger>
              </FeatureCard>
            </Item>

            {[
              { icon: TrendingUp, bg: 'bg-blue-50',   ic: 'text-blue-600',   title: 'Forecasting',            desc: 'Proyecciones a 12 meses por SKU, categoría y temporada.',   cls: 'lg:col-span-2'           },
              { icon: DollarSign, bg: 'bg-purple-50',  ic: 'text-purple-600', title: 'Precios dinámicos',     desc: 'Ajustes automáticos por tipo de cambio y elasticidad.',       cls: 'lg:col-span-2'           },
              { icon: Boxes,      bg: 'bg-amber-50',   ic: 'text-amber-600',  title: 'Inventario óptimo',     desc: 'Calcula stock por SKU y reduce costos de almacenamiento.',     cls: 'col-span-2 lg:col-span-2' },
              { icon: Ship,       bg: 'bg-emerald-50', ic: 'text-emerald-600',title: 'Logística internacional',desc: 'Rastrea envíos y compara rutas en tiempo real.',              cls: 'lg:col-span-2'           },
              { icon: Calculator, bg: 'bg-pink-50',    ic: 'text-pink-600',   title: 'Simulador what-if',     desc: '¿Y si el dólar sube 15%? Mide el impacto antes de decidir.',  cls: 'lg:col-span-2'           },
            ].map(({ icon: Icon, bg, ic, title, desc, cls }, i) => (
              <Item key={i} className={cls}>
                <FeatureCard>
                  <div className={cn('rounded-xl p-3 w-fit mb-4', bg)}>
                    <Icon className={cn('h-6 w-6', ic)}/>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-sm text-slate-600">{desc}</p>
                </FeatureCard>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-12 sm:py-14 lg:py-16 bg-slate-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal v="fadeUp" className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Cómo funciona</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              De Excel a IA en cuatro pasos.
            </h2>
          </Reveal>

          <div className="relative">
            {/* Connecting line — desktop only */}
            <Reveal v="fadeIn" duration={0.8} delay={0.3}
              className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200"
            />

            <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8" gap={0.13} delay={0.08}>
              {[
                { num: '01', title: 'Conecta datos',       desc: 'ERP, CSV, Google Sheets. Importas y listo.',   icon: Database,  color: 'from-blue-500 to-cyan-500'    },
                { num: '02', title: 'La IA analiza',       desc: 'Procesa tu historial y detecta patrones.',     icon: Cpu,       color: 'from-purple-500 to-pink-500'  },
                { num: '03', title: 'Recibes insights',    desc: 'Sugerencias accionables, no datos crudos.',    icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
                { num: '04', title: 'Aplicas en 1 clic',  desc: 'Cambios en producción con un botón.',          icon: Rocket,    color: 'from-emerald-500 to-green-500' },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <Item key={i} v="fadeUp" duration={0.5}
                    className="relative group bg-white sm:bg-transparent rounded-2xl sm:rounded-none border border-slate-100 sm:border-0 shadow-sm sm:shadow-none p-4 sm:p-0 text-center"
                  >
                    {/* Step number pill — mobile only */}
                    <div className="sm:hidden absolute top-3 right-3 text-[10px] font-bold text-slate-400 tracking-widest">
                      {s.num}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 4, transition: { duration: 0.18 } }}
                      className={cn(
                        'inline-flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-slate-900/10 mb-3 sm:mb-5',
                        'w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24',
                        s.color
                      )}
                    >
                      <Icon className="h-7 w-7 sm:h-10 sm:w-10 lg:h-11 lg:w-11 text-white"/>
                    </motion.div>

                    <p className="hidden sm:block text-xs font-bold tracking-widest text-slate-400 mb-1">PASO {s.num}</p>
                    <h3 className="font-bold text-sm sm:text-lg lg:text-xl mb-1 sm:mb-2 leading-tight">{s.title}</h3>
                    <p className="hidden sm:block text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </Item>
                )
              })}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section id="testimonials" className="py-12 sm:py-14 lg:py-16 bg-slate-900 text-white overflow-hidden">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 lg:mb-14">
          <Reveal v="fadeUp">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-3 text-center">Testimonios</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-center text-balance">
              PyMEs creciendo con datos, no con corazonadas.
            </h2>
            <p className="mt-4 text-slate-400 text-base sm:text-lg text-center max-w-2xl mx-auto">
              Resultados reales de empresas que dejaron Excel y abrazaron la IA.
            </p>
          </Reveal>
        </div>

        {/* Carousel rows */}
        {(() => {
          const all = [
            { name:'Carlos Mendoza',  role:'Gerente General · Distribuidora López',     quote:'Redujo nuestros quiebres de stock 67% y subió margen 12%. Es como tener analistas trabajando 24/7.' },
            { name:'Ana Gutiérrez',   role:'Directora de Ops · Importadora Santa Cruz', quote:'Nos salvó durante la última crisis cambiaria. Precisión increíble en las predicciones.' },
            { name:'Roberto Paz',     role:'CEO · Autopartes Andinas',                   quote:'ROI en 6 meses. Los insights de IA son invaluables para nuestras compras internacionales.' },
            { name:'Lucía Ferreira',  role:'Compras · Filtros del Sur',                 quote:'Pasamos de 3 días planificando a 30 minutos. El simulador de escenarios es oro puro.' },
            { name:'Miguel Torres',   role:'Dir. Comercial · Partes del Norte',         quote:'La predicción de demanda es exacta. Nunca más nos quedamos sin stock en pico de temporada.' },
            { name:'Patricia Vargas', role:'Gerente · Importex Bolivia',                quote:'Redujimos sobre-stock 40% en 3 meses. El módulo de logística internacional es excepcional.' },
          ]
          const row1 = all.slice(0, 3)
          const row2 = all.slice(3, 6)

          const Card = ({ t }) => (
            <div className="w-72 sm:w-80 flex-shrink-0 rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-6 mx-2 sm:mx-3">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400" fill="#fbbf24"/>)}
              </div>
              <p className="text-slate-200 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm text-white">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
              </div>
            </div>
          )

          return (
            <Reveal v="fadeIn" duration={0.6}>
              <div className="space-y-4">
                {/* Row 1 — slides left */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"/>
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"/>
                  <div className="marquee-left flex">
                    {[...row1, ...row1].map((t, i) => <Card key={i} t={t}/>)}
                  </div>
                </div>
                {/* Row 2 — slides right */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"/>
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"/>
                  <div className="marquee-right flex">
                    {[...row2, ...row2].map((t, i) => <Card key={i} t={t}/>)}
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })()}
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="py-12 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal v="fadeUp" className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Precios</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Facturación anual. Cancela cuando quieras.
            </h2>
            <p className="mt-3 text-base text-slate-500">
              2 meses gratis al pagar el año completo · Acceso total los 365 días
            </p>
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto" gap={0.12} delay={0.05}>
            <PricingCard tier="Starter"      price="Bs 2,990" subtitle="Para equipos comenzando · 2 meses gratis"       items={['Hasta 100 productos','Forecasting básico','1 usuario','Soporte por email']}                                                              onCta={() => navigate('/login')} ctaText="Comenzar"/>
            <PricingCard tier="Professional" price="Bs 7,990" subtitle="Para PyMEs en crecimiento · 2 meses gratis" popular items={['Hasta 1,000 productos','IA avanzada + simulador','5 usuarios','Integraciones ERP','Soporte prioritario','API básica']}  onCta={() => navigate('/login')} ctaText="Comenzar ahora"/>
            <PricingCard tier="Enterprise"   price="Bs a medida" subtitle="Para operaciones de gran escala"               items={['Productos ilimitados','Todas las funciones','Usuarios ilimitados','API dedicada','Account manager','SLA 99.9%']}                     onCta={() => scrollTo('contact')} ctaText="Hablar con ventas"/>
          </Stagger>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal v="scaleUp" duration={0.7}>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14 text-white text-center shadow-2xl shadow-purple-900/20">
              <div aria-hidden className="absolute inset-0 bg-grid-slate-100 opacity-10"/>
              {/* Animated blobs inside CTA */}
              <motion.div
                animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:block absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"
              />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                  ¿Listo para predecir tu próximo año?
                </h2>
                <p className="text-lg sm:text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
                  Únete a cientos de PyMEs optimizando su inventario con IA.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold rounded-lg shadow-xl hover:opacity-90 transition-opacity"
                    style={{ background: 'white', color: '#1e293b' }}>
                    Comenzar prueba gratuita<ArrowRight className="h-4 w-4 ml-2"/>
                  </button>
                  <button onClick={() => scrollTo('contact')}
                    className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold rounded-lg border-2 hover:bg-white/10 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.75)', color: 'white', background: 'transparent' }}>
                    Agendar demo
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <section id="contact" className="py-12 sm:py-14 lg:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal v="scaleUp" duration={0.65}>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 p-7 sm:p-9 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Contacto</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Cuéntanos qué quieres optimizar y te guiamos.
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                Puedes revisar precios, ver características o pedir una demo guiada.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => scrollTo('pricing')} className="bg-slate-900 hover:bg-slate-800 shadow-lg">
                  Ver precios
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo('features')}>
                  Ver características
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <Reveal v="fadeIn" duration={0.8}>
        <footer className="bg-slate-950 text-slate-400 pt-16 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
              <div className="col-span-2 md:col-span-1">
                <div className="mb-4">
                  <img src={logo} alt="Forecast365" className="h-12 w-auto"
                    style={{ filter: 'brightness(0) invert(1)' }}/>
                </div>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
                  Planificación de demanda inteligente para PyMEs latinoamericanas.
                </p>
              </div>
              {[
                { h: 'Producto', l: ['Características','Precios','Integraciones','API']         },
                { h: 'Empresa',  l: ['Sobre nosotros','Blog','Carreras','Contacto']              },
                { h: 'Legal',    l: ['Privacidad','Términos','Seguridad','Cookies']              },
              ].map((c, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-white text-sm mb-4">{c.h}</h4>
                  <ul className="space-y-2.5 text-sm">
                    {c.l.map((x, j) => (
                      <li key={j}>
                        <button className="hover:text-white transition-colors"
                          onClick={() => scrollTo(x === 'Características' ? 'features' : x === 'Precios' ? 'pricing' : 'contact')}>
                          {x}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>© 2026 Forecast365. Todos los derechos reservados.</p>
              <p>Hecho en Latinoamérica · 🇧🇴 🇲🇽 🇨🇴 🇵🇪 🇨🇱</p>
            </div>
          </div>
        </footer>
      </Reveal>

    </div>
  )
}
