// Public pages: Landing (redesigned + fully responsive), Login, Register

// ============================================================================
// LANDING PAGE — refined, bold, fully responsive
// ============================================================================
function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const stats = [
    { value: "92%", label: "Precisión IA" },
    { value: "35%", label: "Reducción costos" },
    { value: "67%", label: "Menos quiebres" },
    { value: "500+", label: "PyMEs confiando" },
  ];

  const navLinks = [
    { href: "#features", label: "Características" },
    { href: "#preview", label: "Producto" },
    { href: "#how-it-works", label: "Cómo Funciona" },
    { href: "#pricing", label: "Precios" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" data-screen-label="Landing">
      {/* ============ NAVBAR ============ */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 shadow-sm">
              <Sparkles className="h-5 w-5 text-white"/>
            </div>
            <span className="font-bold text-lg tracking-tight">Forecast365</span>
          </a>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Iniciar Sesión</Button>
            <Button size="sm" onClick={() => navigate("/login")} className="bg-slate-900 hover:bg-slate-800">
              Comenzar gratis<ArrowRight className="h-4 w-4 ml-1.5"/>
            </Button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2 text-slate-700" aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">{l.label}</a>
              ))}
              <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate("/login")}>Iniciar Sesión</Button>
                <Button onClick={() => navigate("/login")} className="bg-slate-900 hover:bg-slate-800">Comenzar gratis</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* Background ornaments */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200 to-purple-200 blur-3xl opacity-30"/>
          <div className="absolute top-40 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-200 to-pink-200 blur-3xl opacity-20"/>
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"/>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left column */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"/>
                </span>
                <span className="text-xs font-medium text-slate-700">Nueva versión 2.0 · Potenciada por IA</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
                Planifica tu demanda con{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">precisión empresarial</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                    <path d="M2 9 C 80 1, 220 1, 298 9" stroke="url(#g1)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2563eb"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs>
                  </svg>
                </span>
                .
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
                IA que predice demanda, optimiza precios y rastrea importaciones para PyMEs latinoamericanas. La precisión de un gigante, al alcance de tu negocio.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate("/login")}
                  className="bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 group">
                  Comienza gratis 14 días
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5"/>
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection("how-it-works") }>
                  <PlayCircle className="h-5 w-5 mr-2 text-blue-600"/> Ver demo en vivo
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                {["Sin tarjeta", "Setup en 5 min", "Soporte en español"].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600"/>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — product preview card */}
            <div className="lg:col-span-6">
              <HeroPreview/>
            </div>
          </div>

          {/* Inline stats bar */}
          <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            {stats.map((s, i) => (
              <div key={i} className="bg-white p-5 sm:p-6 text-center">
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS / SOURCES STRIP ============ */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6">Conecta tus datos en minutos</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {["SAP Business One","Odoo","Excel","Google Sheets","CSV","Quickbooks","Bind ERP","Custom API"].map((src, i) => (
              <div key={i} className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm">
                {src}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES — BENTO GRID ============ */}
      <section id="features" className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Una plataforma, todo integrado</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
              Seis módulos. Una decisión informada por minuto.
            </h2>
            <p className="mt-4 text-lg text-slate-600">Cada módulo trabaja en conjunto. Cuando el dólar sube, los precios se ajustan. Cuando la demanda crece, las órdenes salen. Sin hojas de Excel sueltas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
            {/* Big feature — IA */}
            <FeatureCard className="md:col-span-2 lg:col-span-4 lg:row-span-2" tone="dark">
              <div className="flex items-start justify-between mb-6">
                <div className="rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                  <Brain className="h-7 w-7 text-white"/>
                </div>
                <Badge className="bg-white/10 text-white border border-white/20 backdrop-blur">CORE</Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white tracking-tight">Inteligencia Artificial que entiende tu negocio</h3>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg">
                Modelos entrenados con tu historial detectan picos estacionales, tendencias emergentes y anomalías — con 92% de precisión.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Precisión", value: "92%" },
                  { label: "Patrones detectados", value: "47" },
                  { label: "Modelos activos", value: "12" },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-3 sm:p-4">
                    <p className="text-xl sm:text-2xl font-bold text-white">{m.value}</p>
                    <p className="text-xs text-white/60 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard className="md:col-span-1 lg:col-span-2">
              <div className="rounded-xl bg-blue-50 p-3 w-fit mb-4"><TrendingUp className="h-6 w-6 text-blue-600"/></div>
              <h3 className="font-bold text-lg mb-1">Forecasting</h3>
              <p className="text-sm text-slate-600">Proyecciones a 12 meses por SKU, categoría y temporada.</p>
            </FeatureCard>

            <FeatureCard className="md:col-span-1 lg:col-span-2">
              <div className="rounded-xl bg-purple-50 p-3 w-fit mb-4"><DollarSign className="h-6 w-6 text-purple-600"/></div>
              <h3 className="font-bold text-lg mb-1">Precios dinámicos</h3>
              <p className="text-sm text-slate-600">Ajustes automáticos por tipo de cambio y elasticidad.</p>
            </FeatureCard>

            <FeatureCard className="md:col-span-2 lg:col-span-2">
              <div className="rounded-xl bg-amber-50 p-3 w-fit mb-4"><Boxes className="h-6 w-6 text-amber-600"/></div>
              <h3 className="font-bold text-lg mb-1">Inventario óptimo</h3>
              <p className="text-sm text-slate-600">Calcula stock por SKU y reduce costos de almacenamiento.</p>
            </FeatureCard>

            <FeatureCard className="md:col-span-1 lg:col-span-2">
              <div className="rounded-xl bg-emerald-50 p-3 w-fit mb-4"><Ship className="h-6 w-6 text-emerald-600"/></div>
              <h3 className="font-bold text-lg mb-1">Logística internacional</h3>
              <p className="text-sm text-slate-600">Rastrea envíos y compara rutas en tiempo real.</p>
            </FeatureCard>

            <FeatureCard className="md:col-span-1 lg:col-span-2">
              <div className="rounded-xl bg-pink-50 p-3 w-fit mb-4"><Calculator className="h-6 w-6 text-pink-600"/></div>
              <h3 className="font-bold text-lg mb-1">Simulador what-if</h3>
              <p className="text-sm text-slate-600">¿Y si el dólar sube 15%? Mide el impacto antes de decidir.</p>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ============ PRODUCT PREVIEW ============ */}
      <section id="preview" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">Plataforma ejecutiva</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">Centraliza la gestión de tu operación con inteligencia artificial.</h2>
            <p className="mt-4 text-lg text-slate-600">Visualiza tu cadena de valor en una sola vista y toma decisiones informadas con mayor rapidez y precisión.</p>
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 -top-6 -bottom-6 sm:-inset-x-4 bg-gradient-to-br from-blue-100/60 via-purple-100/60 to-pink-100/60 rounded-3xl blur-2xl -z-10"/>
            <DashboardPreview/>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Cómo funciona</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">De Excel a IA en cuatro pasos.</h2>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* connecting line on desktop */}
            <div aria-hidden className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200"/>
            {[
              { number: "01", title: "Conecta datos", description: "ERP, CSV, Google Sheets. Importas y listo.", icon: Database, color: "from-blue-500 to-cyan-500" },
              { number: "02", title: "La IA analiza", description: "Procesa tu historial y detecta patrones.", icon: Cpu, color: "from-purple-500 to-pink-500" },
              { number: "03", title: "Recibes insights", description: "Sugerencias accionables, no datos crudos.", icon: Lightbulb, color: "from-amber-500 to-orange-500" },
              { number: "04", title: "Aplicas en 1 click", description: "Cambios en producción con un botón.", icon: Rocket, color: "from-emerald-500 to-green-500" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative text-center group">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${s.color} mb-5 shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-11 w-11 text-white"/>
                  </div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">PASO {s.number}</p>
                  <h3 className="font-bold text-lg sm:text-xl mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="testimonials" className="py-20 sm:py-24 lg:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-3">Testimonios</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">PyMEs creciendo con datos, no con corazonadas.</h2>
              <p className="mt-4 text-slate-400 text-lg">Resultados reales de empresas que dejaron Excel y abrazaron la IA.</p>
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 lg:gap-5">
              {[
                { name: "Carlos Mendoza", role: "Gerente General · Distribuidora López", quote: "Redujo nuestros quiebres de stock 67% y subió margen 12%. Es como tener analistas trabajando 24/7." },
                { name: "Ana Gutiérrez", role: "Directora de Ops · Importadora Santa Cruz", quote: "Nos salvó durante la última crisis cambiaria. Precisión increíble en las predicciones." },
                { name: "Roberto Paz", role: "CEO · Autopartes Andinas", quote: "ROI en 6 meses. Los insights de IA son invaluables para nuestras compras." },
                { name: "Lucía Ferreira", role: "Compras · Filtros del Sur", quote: "Pasamos de 3 días planificando a 30 minutos. El simulador es oro puro." },
              ].map((t, i) => (
                <div key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur p-5 sm:p-6">
                  <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400" fill="#fbbf24"/>)}</div>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-5">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Precios</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">Facturación anual. Cancela cuando quieras.</h2>
            <p className="mt-3 text-base text-slate-500">2 meses gratis al pagar el año completo · Acceso total los 365 días</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto">
            <PricingCard tier="Starter" price="Bs 2,990" subtitle="Para equipos comenzando · 2 meses gratis"
              items={["Hasta 100 productos","Forecasting básico","1 usuario","Soporte por email"]} cta={() => navigate("/login")} ctaText="Comenzar"/>
            <PricingCard tier="Professional" price="Bs 7,990" subtitle="Para PyMEs en crecimiento · 2 meses gratis" popular
              items={["Hasta 1,000 productos","IA avanzada + simulador","5 usuarios","Integraciones ERP","Soporte prioritario","API básica"]} cta={() => navigate("/login")} ctaText="Comenzar ahora"/>
            <PricingCard tier="Enterprise" price="Bs a medida" subtitle="Para operaciones de gran escala"
              items={["Productos ilimitados","Todas las funciones","Usuarios ilimitados","API dedicada","Account manager","SLA 99.9%"]} cta={() => scrollToSection("contact")} ctaText="Hablar con ventas"/>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24 text-white text-center shadow-2xl shadow-purple-900/20">
            <div aria-hidden className="absolute inset-0 bg-grid-slate-100 opacity-10"/>
            <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"/>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 text-balance">¿Listo para predecir tu próximo mes?</h2>
              <p className="text-lg sm:text-xl text-blue-50 mb-8 max-w-2xl mx-auto">Únete a cientos de PyMEs optimizando su inventario con IA.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate("/login")} className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl">
                  Comenzar prueba gratuita<ArrowRight className="h-4 w-4 ml-2"/>
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection("contact")} className="bg-transparent text-white border-2 border-white/80 hover:bg-white/10">Agendar demo</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className="py-20 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8 sm:p-10 lg:p-12 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Contacto</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">Cuéntanos qué quieres optimizar y te guiamos al mejor punto de partida.</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Puedes revisar precios, ver características o pedir una demo guiada. Todo está en esta misma página.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => scrollToSection("pricing")} className="bg-slate-900 hover:bg-slate-800 shadow-lg">
                Ver precios
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("features")}>
                Ver características
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-1.5"><Sparkles className="h-5 w-5 text-white"/></div>
                <span className="font-bold text-white text-lg">Forecast365</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 max-w-xs">Planificación de demanda inteligente para PyMEs latinoamericanas.</p>
            </div>
            {[
              { h: "Producto", l: ["Características", "Precios", "Integraciones", "API", "Changelog"] },
              { h: "Empresa", l: ["Sobre nosotros", "Blog", "Carreras", "Contacto"] },
              { h: "Legal", l: ["Privacidad", "Términos", "Seguridad", "Cookies"] },
            ].map((c, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white text-sm mb-4">{c.h}</h4>
                <ul className="space-y-2.5 text-sm">
                  {c.l.map((x, j) => {
                    const targetSection =
                      x === "Características" ? "features" :
                      x === "Precios" ? "pricing" :
                      x === "Integraciones" ? "preview" :
                      x === "API" ? "how-it-works" :
                      x === "Contacto" ? "contact" :
                      x === "Sobre nosotros" ? "testimonials" :
                      x === "Blog" ? "features" :
                      x === "Carreras" ? "how-it-works" :
                      x === "Privacidad" ? "contact" :
                      x === "Términos" ? "contact" :
                      x === "Seguridad" ? "contact" :
                      x === "Cookies" ? "contact" :
                      null;

                    return (
                      <li key={j}>
                        {targetSection ? (
                          <button type="button" className="hover:text-white transition-colors" onClick={() => scrollToSection(targetSection)}>{x}</button>
                        ) : (
                          <a className="hover:text-white transition-colors" href="#">{x}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>&copy; 2026 Forecast365. Todos los derechos reservados.</p>
            <p>Hecho en Latinoamérica · 🇧🇴 🇲🇽 🇨🇴 🇵🇪 🇨🇱</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =========================================
// HERO: product preview card (mini dashboard)
// =========================================
function HeroPreview() {
  return (
    <div className="relative">
      {/* Floating chip — back */}
      <div className="hidden sm:block absolute -top-4 -right-2 sm:right-4 z-20 animate-[float_4s_ease-in-out_infinite] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 px-3 py-2.5 flex items-center gap-2">
        <div className="rounded-lg bg-emerald-100 p-1.5"><TrendingUp className="h-4 w-4 text-emerald-600"/></div>
        <div>
          <p className="text-[10px] text-slate-500 leading-none">Demanda jun</p>
          <p className="text-sm font-bold text-slate-900 leading-tight">+28%</p>
        </div>
      </div>

      <div className="hidden sm:flex absolute -bottom-4 -left-2 sm:left-4 z-20 items-center gap-2 animate-[float_5s_ease-in-out_infinite_-1s] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 px-3 py-2.5">
        <div className="rounded-lg bg-purple-100 p-1.5"><Brain className="h-4 w-4 text-purple-600"/></div>
        <div>
          <p className="text-[10px] text-slate-500 leading-none">Precisión IA</p>
          <p className="text-sm font-bold text-slate-900 leading-tight">92.3%</p>
        </div>
      </div>

      {/* Main card */}
      <div className="relative rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 overflow-hidden">
        {/* Window chrome */}
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
              <h3 className="text-lg sm:text-xl font-bold">Resumen de Mayo</h3>
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px]"><Sparkles className="h-3 w-3 mr-1 inline"/>IA Activa</Badge>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <MiniKPI label="Inventario" value="Bs 284K" tone="blue"/>
            <MiniKPI label="Margen" value="38.2%" tone="purple"/>
            <MiniKPI label="Críticos" value="1" tone="red"/>
          </div>

          {/* Mini chart */}
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50/40 to-purple-50/40 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-700">Proyección de Ingresos</p>
              <span className="text-[10px] text-slate-500">Bs 365K · Jun</span>
            </div>
            <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ph-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* gridlines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth="0.5"/>
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth="0.5"/>
              {/* IA prediction area */}
              <path d="M0,55 C40,50 80,40 120,32 C160,24 200,18 240,12 C260,10 280,8 300,6 L300,80 L0,80 Z" fill="url(#ph-grad)"/>
              <path d="M0,55 C40,50 80,40 120,32 C160,24 200,18 240,12 C260,10 280,8 300,6" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
              {/* traditional dashed */}
              <path d="M0,60 C50,58 100,55 150,50 C200,45 250,42 300,38" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
              {/* real solid */}
              <path d="M0,62 C40,58 80,52 120,46 L120,46" stroke="#10b981" strokeWidth="2" fill="none"/>
              {/* end dot */}
              <circle cx="300" cy="6" r="3" fill="#8b5cf6"/>
            </svg>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <Legend dot="#10b981" label="Real"/>
              <Legend dot="#3b82f6" label="Tradicional"/>
              <Legend dot="#8b5cf6" label="Predicción IA"/>
            </div>
          </div>

          {/* AI insight strip */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 flex items-start gap-2.5">
            <div className="rounded-lg bg-white p-1.5 shadow-sm shrink-0"><Brain className="h-4 w-4 text-purple-600"/></div>
            <div>
              <p className="text-xs font-semibold text-slate-900 mb-0.5">Oportunidad detectada</p>
              <p className="text-xs text-slate-600 leading-relaxed">Aumenta stock de FA-2000 antes del 5 jun · ahorro Bs 4.2K</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, tone }) {
  const tones = {
    blue:   "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    red:    "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-xl border border-slate-100 p-2.5 sm:p-3">
      <p className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-1.5", tones[tone])}>{label}</p>
      <p className="text-base sm:text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
const Legend = ({ dot, label }) => (
  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: dot }}/>{label}</span>
);

// =========================================
// FeatureCard for bento grid
// =========================================
function FeatureCard({ children, className = "", tone = "light" }) {
  const tones = {
    light: "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg",
    dark: "bg-slate-900 text-white border border-slate-800",
  };
  return (
    <div className={cn("rounded-2xl p-6 sm:p-7 transition-all", tones[tone], className)}>
      {children}
    </div>
  );
}

// =========================================
// Dashboard preview (full-width, larger)
// =========================================
function DashboardPreview() {
  return (
    <div className="rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
        </div>
        <p className="text-xs text-slate-500 ml-2 font-medium hidden sm:block">forecast365.com/app</p>
      </div>
      <div className="grid grid-cols-12">
        {/* mini sidebar */}
        <div className="hidden md:flex md:col-span-2 lg:col-span-2 flex-col border-r border-slate-100 bg-slate-50/40 p-3 gap-1">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="rounded-md bg-gradient-to-br from-blue-600 to-purple-600 p-1"><Sparkles className="h-3.5 w-3.5 text-white"/></div>
            <span className="text-xs font-bold">Forecast365</span>
          </div>
          {[
            { label: "Dashboard", icon: Sparkles, active: true },
            { label: "Simulador", icon: Calculator },
            { label: "Data", icon: Database },
            { label: "Demand", icon: LineChart },
            { label: "Precios", icon: DollarSign },
            { label: "Logística", icon: Ship },
          ].map((it, i) => {
            const I = it.icon;
            return (
              <div key={i} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                it.active ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600")}>
                <I className="h-3.5 w-3.5"/><span>{it.label}</span>
              </div>
            );
          })}
        </div>
        {/* content */}
        <div className="col-span-12 md:col-span-10 p-5 sm:p-6 lg:p-8 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Resumen ejecutivo</p>
              <h3 className="text-xl sm:text-2xl font-bold">Operación de mayo 2026</h3>
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"><Sparkles className="h-3 w-3 mr-1 inline"/>IA Activa</Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { l: "Inventario", v: "Bs 284K", d: "+8.2%", tone: "blue" },
              { l: "Margen", v: "38.2%", d: "+2.3pp", tone: "purple" },
              { l: "Críticos", v: "1", d: "Atención", tone: "amber" },
              { l: "En tránsito", v: "$26.4K", d: "3 envíos", tone: "emerald" },
            ].map((k, i) => <PreviewKPI key={i} {...k}/>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="lg:col-span-2 rounded-xl border border-slate-100 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Proyección de Ingresos (Bs)</p>
                <span className="text-xs text-slate-400">Últimos 6 meses</span>
              </div>
              <svg viewBox="0 0 400 110" className="w-full h-28 sm:h-32" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.3"/>
                    <stop offset="1" stopColor="#8b5cf6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="25" x2="400" y2="25" stroke="#f1f5f9" strokeWidth="1"/>
                <line x1="0" y1="55" x2="400" y2="55" stroke="#f1f5f9" strokeWidth="1"/>
                <line x1="0" y1="85" x2="400" y2="85" stroke="#f1f5f9" strokeWidth="1"/>
                <path d="M0,80 C50,70 100,55 150,48 C200,42 250,30 300,22 C340,15 380,10 400,8 L400,110 L0,110 Z" fill="url(#dp-grad)"/>
                <path d="M0,80 C50,70 100,55 150,48 C200,42 250,30 300,22 C340,15 380,10 400,8" stroke="#8b5cf6" strokeWidth="2.5" fill="none"/>
                <path d="M0,82 C50,75 100,65 150,58 C200,52 250,42 300,38" stroke="#10b981" strokeWidth="2" fill="none"/>
                <path d="M0,85 C50,78 100,70 150,60 C200,52 250,45 300,38 C340,32 380,28 400,26" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
              </svg>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <Legend dot="#10b981" label="Real"/>
                <Legend dot="#3b82f6" label="Tradicional"/>
                <Legend dot="#8b5cf6" label="Predicción IA"/>
              </div>
            </div>
            <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-purple-600"/>
                <p className="text-sm font-semibold">Insights IA</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { t: "Pico estacional jun-jul", d: "Aumenta stock 28% en automotriz", c: 92 },
                  { t: "Riesgo cambiario", d: "Cubre con contratos en BOB", c: 84 },
                  { t: "Sobrestock OL-500", d: "Reduce orden próxima -30%", c: 78 },
                ].map((i, k) => (
                  <div key={k} className="rounded-lg bg-white p-2.5 shadow-sm">
                    <p className="text-xs font-semibold leading-tight">{i.t}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{i.d}</p>
                    <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${i.c}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function PreviewKPI({ l, v, d, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-xl border border-slate-100 p-3 sm:p-4">
      <p className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-1.5", tones[tone])}>{l}</p>
      <p className="text-lg sm:text-xl font-bold text-slate-900">{v}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{d}</p>
    </div>
  );
}

function PricingCard({ tier, price, subtitle, items, popular, cta, ctaText, ctaLabel }) {
  return (
    <div className={cn("relative rounded-2xl p-6 sm:p-8 transition-all flex flex-col",
      popular ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-800" : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg")}>
      {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 shadow-lg">Más popular</Badge></div>}
      <div>
        <h3 className={cn("text-xl font-bold", popular ? "text-white" : "text-slate-900")}>{tier}</h3>
        {subtitle && <p className={cn("text-sm mt-1", popular ? "text-slate-300" : "text-slate-500")}>{subtitle}</p>}
        <div className="mt-5 flex items-baseline gap-1">
          <span className={cn("text-4xl sm:text-5xl font-extrabold tracking-tight", popular ? "text-white" : "text-slate-900")}>{price}</span>
          {price !== "Custom" && !price.toLowerCase().includes("a medida") && <span className={cn("text-sm", popular ? "text-slate-400" : "text-slate-500")}>/año</span>}
        </div>
      </div>
      <ul className="space-y-3 my-6 sm:my-8 flex-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check className={cn("h-4 w-4 mt-0.5 flex-shrink-0", popular ? "text-emerald-400" : "text-emerald-600")}/>
            <span className={popular ? "text-slate-200" : "text-slate-700"}>{it}</span>
          </li>
        ))}
      </ul>
      {cta ? (
        <Button onClick={cta} className={popular ? "bg-white text-slate-900 hover:bg-slate-100 w-full" : "w-full bg-slate-900 hover:bg-slate-800"}>
          {ctaText || (popular ? "Empezar ahora" : "Comenzar")}
        </Button>
      ) : (
        <Button variant="outline" className="w-full border-2">{ctaLabel}</Button>
      )}
    </div>
  );
}

// ============================================================================
// LOGIN
// ============================================================================
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email && password) {
        setAuth({ isAuthenticated: true, user: { email, name: email.split("@")[0], plan: "Professional" } });
        toast.success("¡Bienvenido de vuelta!");
        navigate("/app/executive");
      } else {
        toast.error("Por favor completa todos los campos");
      }
      setLoading(false);
    }, 500);
  };
  const demoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setAuth({ isAuthenticated: true, user: { email: "demo@forecast365.com", name: "Usuario Demo", plan: "Professional" } });
      toast.success("Accediendo a la demo...");
      navigate("/app/executive");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6" data-screen-label="Login">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-2"><Sparkles className="h-7 w-7 text-white"/></div>
            <span className="font-bold text-2xl">Forecast365</span>
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
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400"/>
                  <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required/>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">¿Olvidaste?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400"/>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required/>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando..." : "Iniciar Sesión"}{!loading && <ArrowRight className="h-4 w-4 ml-2"/>}
              </Button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"/></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">O</span></div>
            </div>
            <Button variant="outline" className="w-full" onClick={demoLogin} disabled={loading}>Acceder a la Demo</Button>
            <div className="mt-6 text-center text-sm text-slate-500">¿No tienes cuenta? <button onClick={() => navigate("/register")} className="text-blue-600 hover:underline font-semibold">Regístrate gratis</button></div>
            <div className="mt-4 text-center"><button onClick={() => navigate("/")} className="text-sm text-slate-500 hover:text-blue-600">← Volver al inicio</button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// REGISTER
// ============================================================================
function RegisterPage() {
  const navigate = useNavigate();
  const [d, setD] = React.useState({ name: "", email: "", company: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = React.useState(false);
  const upd = (k, v) => setD(s => ({ ...s, [k]: v }));
  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (d.password !== d.confirmPassword) { toast.error("Las contraseñas no coinciden"); setLoading(false); return; }
    if (d.password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); setLoading(false); return; }
    setTimeout(() => {
      setAuth({ isAuthenticated: true, user: { email: d.email, name: d.name, company: d.company, plan: "Professional" } });
      toast.success("¡Cuenta creada! Bienvenido a Forecast365");
      navigate("/app/executive");
    }, 600);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 py-10" data-screen-label="Register">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-2"><Sparkles className="h-7 w-7 text-white"/></div>
            <span className="font-bold text-2xl">Forecast365</span>
          </button>
          <p className="text-slate-500">Crea tu cuenta y comienza en minutos</p>
        </div>
        <Card className="border-2 shadow-xl">
          <CardHeader><CardTitle>Crear Cuenta</CardTitle><CardDescription>14 días de prueba gratis, sin tarjeta de crédito</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {[
                { id: "name", label: "Nombre Completo *", type: "text", ph: "Juan Pérez", icon: User, req: true },
                { id: "email", label: "Correo Electrónico *", type: "email", ph: "tu@empresa.com", icon: Mail, req: true },
                { id: "company", label: "Empresa (opcional)", type: "text", ph: "Mi Empresa SRL", icon: Building, req: false },
                { id: "password", label: "Contraseña *", type: "password", ph: "Mínimo 6 caracteres", icon: Lock, req: true },
                { id: "confirmPassword", label: "Confirmar Contraseña *", type: "password", ph: "Repite tu contraseña", icon: Lock, req: true },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-3 h-5 w-5 text-slate-400"/>
                      <Input id={f.id} type={f.type} placeholder={f.ph} value={d[f.id]} onChange={(e) => upd(f.id, e.target.value)} className="pl-10" required={f.req}/>
                    </div>
                  </div>
                );
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
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creando..." : "Crear Cuenta Gratis"}{!loading && <ArrowRight className="h-4 w-4 ml-2"/>}</Button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500">¿Ya tienes cuenta? <button onClick={() => navigate("/login")} className="text-blue-600 hover:underline font-semibold">Inicia sesión</button></div>
            <div className="mt-4 text-center"><button onClick={() => navigate("/")} className="text-sm text-slate-500 hover:text-blue-600">← Volver al inicio</button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { LandingPage, LoginPage, RegisterPage });
