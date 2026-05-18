import * as XLSX from 'xlsx'
import { toast } from './toast'

const ML = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getField(row, ...keys) {
  for (const k of keys)
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k]
  return null
}

function parseCSVText(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (!lines.length) return []
  const sc = (lines[0].match(/;/g) || []).length
  const cc = (lines[0].match(/,/g) || []).length
  const sep = sc > cc ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ''))
    const row = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  }).filter(r => Object.values(r).some(v => v))
}

function parseDate(val) {
  if (!val) return null
  if (val instanceof Date) return isNaN(val) ? null : val
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const d = new Date(s + 'T12:00:00Z'); return isNaN(d) ? null : d }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const [a, b, c] = s.split('/')
    const d = new Date(`${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}T12:00:00Z`)
    return isNaN(d) ? null : d
  }
  if (/^\d{1,2}\/\d{4}$/.test(s)) {
    const [m, y] = s.split('/')
    return new Date(`${y}-${m.padStart(2,'0')}-15T12:00:00Z`)
  }
  const d = new Date(s)
  return isNaN(d) ? null : d
}

export function calcForecast(vals, periods = 7) {
  const v = vals.filter(x => x != null && !isNaN(x) && x >= 0)
  if (!v.length) return Array(periods).fill(0)
  if (v.length === 1) return Array(periods).fill(Math.round(v[0]))
  const n = v.length
  let sx = 0, sy = 0, sxy = 0, sx2 = 0
  v.forEach((y, x) => { sx += x; sy += y; sxy += x * y; sx2 += x * x })
  const denom = n * sx2 - sx * sx
  if (!denom) return Array(periods).fill(Math.round(sy / n))
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return Array.from({ length: periods }, (_, i) => Math.max(0, Math.round(intercept + slope * (n + i))))
}

export function processRows(rows) {
  const byProduct = {}, byMK = {}
  let errors = 0

  rows.forEach(row => {
    const rawDate = getField(row, 'Fecha','fecha','Date','date','Mes','mes','FECHA','Month')
    const date = parseDate(rawDate)
    if (!date) { errors++; return }

    const yr = date.getUTCFullYear(), mi = date.getUTCMonth()
    const mk = `${yr}-${String(mi + 1).padStart(2,'0')}`

    const prod = String(getField(row,'Producto','producto','Product','PRODUCTO','Nombre','nombre','SKU','Item') || 'Desconocido').trim()
    const cat  = String(getField(row,'Categoria','Categoría','categoria','categoría','Category','Tipo','tipo') || 'General').trim()
    const qty  = Math.abs(parseFloat(getField(row,'Cantidad_Vendida','Cantidad','cantidad','Sales','Ventas','ventas','Units','Qty','CANTIDAD') || 0))
    const pr   = parseFloat(getField(row,'Precio_Unitario_BOB','Precio_BOB','Precio','precio','Price','PRECIO') || 0)
    const co   = parseFloat(getField(row,'Costo_Unitario_USD','Costo_USD','Costo','costo','Cost','COSTO') || 0)
    const st   = parseFloat(getField(row,'Stock_Al_Cierre','Stock_Final','Stock','stock','Inventario','STOCK') || 0)
    const lt   = String(getField(row,'Lead_Time_Dias','LeadTime','Lead_Time','lead_time') || '45 días')

    if (!byProduct[prod]) byProduct[prod] = { cat, months: {}, st: 0, pr: 0, co: 0, lt }
    const p = byProduct[prod]
    if (!p.months[mk]) p.months[mk] = { label: ML[mi], mi, yr, qty: 0, rev: 0 }
    p.months[mk].qty += qty
    p.months[mk].rev += qty * pr
    if (st > 0) p.st = st
    if (pr > 0) p.pr = pr
    if (co > 0) p.co = co
    p.lt = lt

    if (!byMK[mk]) byMK[mk] = { label: ML[mi], mi, yr, rev: 0, qty: 0 }
    byMK[mk].rev += qty * pr
    byMK[mk].qty += qty
  })

  const sortedKeys = Object.keys(byMK).sort()
  const now = new Date()
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`

  const products = Object.entries(byProduct).map(([name, d], idx) => {
    const mks = Object.keys(d.months).sort()
    const qtys = mks.map(k => d.months[k].qty)
    const avg = qtys.length ? Math.round(qtys.reduce((a,b) => a+b,0) / qtys.length) : 0
    const opt = Math.round(avg * 1.5)
    const status = !d.st ? 'critical' : d.st < opt*0.5 ? 'critical' : d.st > opt*1.3 ? 'overstock' : d.st < opt*0.85 ? 'warning' : 'optimal'
    return {
      id: `up${idx+1}`, name, category: d.cat,
      currentStock: d.st, optimalStock: opt,
      currentPrice: d.pr, recommendedPrice: Math.round(d.pr * 1.05),
      costUSD: d.co, leadTime: d.lt, avgDemand: avg, status,
    }
  })

  const histRevs = sortedKeys.map(k => byMK[k].rev)
  const fcastRevs = calcForecast(histRevs, 7)
  const revenueProjection = sortedKeys.map(k => ({
    month: byMK[k].label,
    real: k <= nowKey ? Math.round(byMK[k].rev) : null,
    proyectado: Math.round(byMK[k].rev * 1.03),
    ia: Math.round(byMK[k].rev * 1.10),
  }))
  const lastKey = sortedKeys[sortedKeys.length - 1]
  if (lastKey) {
    const [ly, lm] = lastKey.split('-').map(Number)
    fcastRevs.forEach((rev, i) => {
      const d = new Date(Date.UTC(ly, lm + i, 1))
      revenueProjection.push({ month: ML[d.getUTCMonth()], real: null, proyectado: Math.round(rev*1.03), ia: Math.round(rev*1.10) })
    })
  }

  const histQtys = sortedKeys.map(k => byMK[k].qty)
  const fcastQtys = calcForecast(histQtys, 7)
  const demandData = sortedKeys.map(k => ({
    month: byMK[k].label,
    real: k <= nowKey ? Math.round(byMK[k].qty) : null,
    proyectado: Math.round(byMK[k].qty * 1.03),
    optimo: Math.round(byMK[k].qty * 0.97),
  }))
  if (lastKey) {
    const [ly, lm] = lastKey.split('-').map(Number)
    fcastQtys.forEach((qty, i) => {
      const d = new Date(Date.UTC(ly, lm + i, 1))
      demandData.push({ month: ML[d.getUTCMonth()], real: null, proyectado: qty, optimo: Math.round(qty*0.97) })
    })
  }

  const years = [...new Set(sortedKeys.map(k => k.split('-')[0]))].sort()
  const seasonalData = ML.map((label, mi) => {
    const ms = String(mi + 1).padStart(2,'0')
    const obj = { month: label }
    years.forEach(y => { obj[`ventas${y}`] = byMK[`${y}-${ms}`]?.qty ?? null })
    return obj
  })

  const totalRev = sortedKeys.reduce((a,k) => a + byMK[k].rev, 0)
  const nextForecast = demandData.find(d => d.real === null)

  return {
    products, revenueProjection, demandData, seasonalData,
    rawRows: rows, parseErrors: errors,
    monthCount: sortedKeys.length, productCount: products.length,
    totalRevenue: totalRev, years,
    yearRange: years.length ? `${years[0]}–${years[years.length-1]}` : '',
    rowCount: rows.length,
    nextForecastQty: nextForecast?.proyectado || 0,
    nextForecastMonth: nextForecast?.month || '',
  }
}

export function downloadSampleData() {
  const headers = ['Fecha','Producto','Categoria','Cantidad_Vendida','Precio_Unitario_BOB','Costo_Unitario_USD','Stock_Al_Cierre','Lead_Time_Dias']

  // startStock → endStock over 24 months creates the right demo statuses when uploaded:
  // FA-2000: avgDemand≈103 → optimalStock≈155 → endStock 45 = CRÍTICO  (45 < 155*0.5=77)
  // OL-500:  avgDemand≈80  → optimalStock≈120 → endStock 280 = OVERSTOCK (280 > 120*1.3=156)
  // HF-100:  avgDemand≈55  → optimalStock≈83  → endStock 90 = ÓPTIMO   (83*0.85=71 < 90 < 83*1.3=108)
  // FC-300:  avgDemand≈92  → optimalStock≈138 → endStock 95 = WARNING   (138*0.5=69 < 95 < 138*0.85=117)
  const prods = [
    { n:'Filtro de Aire FA-2000',       c:'Automotriz', pr:245, co:35, base:100,
      s:[0.95,0.78,1.08,1.15,1.22,1.35,1.32,1.18,1.10,1.05,1.00,1.08], lt:'45 días',
      startStock:350, endStock:45 },
    { n:'Filtro de Aceite OL-500',       c:'Automotriz', pr:180, co:24, base:80,
      s:[0.94,0.88,1.03,1.06,1.10,1.15,1.25,1.28,1.13,1.06,1.03,0.98], lt:'30 días',
      startStock:80,  endStock:280 },
    { n:'Filtro Hidráulico HF-100',     c:'Industrial', pr:420, co:58, base:55,
      s:[0.95,1.00,1.05,1.09,1.13,1.05,1.00,1.09,1.18,1.24,1.13,1.05], lt:'60 días',
      startStock:95,  endStock:90 },
    { n:'Filtro de Combustible FC-300', c:'Automotriz', pr:195, co:28, base:90,
      s:[0.89,0.83,1.06,1.33,1.47,1.42,1.28,1.06,0.94,0.98,1.00,0.94], lt:'35 días',
      startStock:200, endStock:95 },
  ]

  const data = [headers]
  const TOTAL_MONTHS = 24

  prods.forEach(p => {
    const delta = (p.endStock - p.startStock) / TOTAL_MONTHS
    let monthIdx = 0
    ;[2023, 2024].forEach(yr => {
      for (let m = 0; m < 12; m++) {
        const qty      = Math.round(p.base * p.s[m] * (yr === 2023 ? 0.85 : 1))
        const lastDay  = new Date(yr, m + 1, 0).getDate()
        const fecha    = `${yr}-${String(m+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
        // Linear interpolation from startStock to endStock + small noise
        const noise    = Math.round((Math.random() - 0.5) * 8)
        const stock    = Math.max(5, Math.round(p.startStock + delta * (monthIdx + 1) + noise))
        monthIdx++
        data.push([fecha, p.n, p.c, qty, p.pr, p.co, stock, p.lt])
      }
    })
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{wch:12},{wch:32},{wch:14},{wch:18},{wch:22},{wch:22},{wch:16},{wch:14}]
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas_Históricas')
  XLSX.writeFile(wb, 'datos_forecast365.xlsx')
  toast.success('¡Excel descargado! (96 filas · 4 productos · 2 años · estados variados)')
}

export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const n = file.name.toLowerCase()
    const reader = new FileReader()
    if (n.endsWith('.csv')) {
      reader.onload = e => { try { resolve(parseCSVText(e.target.result)) } catch(err) { reject(err) } }
      reader.onerror = () => reject(new Error('Error leyendo CSV'))
      reader.readAsText(file, 'UTF-8')
    } else if (n.endsWith('.xlsx') || n.endsWith('.xls')) {
      reader.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true })
          const ws = wb.Sheets[wb.SheetNames[0]]
          resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }))
        } catch(err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Error leyendo Excel'))
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('Formato no soportado. Usa .csv o .xlsx'))
    }
  })
}
