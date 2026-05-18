import { createContext, useContext, useState } from 'react'
import { toast } from '../lib/toast'
import { parseFile, processRows, downloadSampleData } from '../lib/dataEngine'

const initialSuppliers = [
  { id:'sup1', name:'FilterTech China Co.',   country:'China',  leadTime:'45 días', reliability:95, activeOrders:2 },
  { id:'sup2', name:'Industrial Filters USA', country:'USA',    leadTime:'35 días', reliability:98, activeOrders:1 },
  { id:'sup3', name:'Filtros Brasil Ltda',    country:'Brasil', leadTime:'30 días', reliability:92, activeOrders:1 },
  { id:'sup4', name:'COSCO Industrial Parts', country:'China',  leadTime:'60 días', reliability:90, activeOrders:1 },
]

const initialProducts = [
  { id:'p1', name:'Filtro de Aire FA-2000',       category:'Automotriz', currentStock:45,  optimalStock:150, currentPrice:245, recommendedPrice:265, costUSD:35, supplierId:'sup1', avgDemand:120, status:'critical' },
  { id:'p2', name:'Filtro de Aceite OL-500',       category:'Automotriz', currentStock:280, optimalStock:200, currentPrice:180, recommendedPrice:185, costUSD:24, supplierId:'sup3', avgDemand:85,  status:'overstock' },
  { id:'p3', name:'Filtro Hidráulico HF-100',     category:'Industrial', currentStock:190, optimalStock:180, currentPrice:420, recommendedPrice:420, costUSD:58, supplierId:'sup4', avgDemand:60,  status:'optimal' },
  { id:'p4', name:'Filtro de Combustible FC-300', category:'Automotriz', currentStock:95,  optimalStock:120, currentPrice:195, recommendedPrice:210, costUSD:28, supplierId:'sup2', avgDemand:95,  status:'warning' },
]

const initialShipments = [
  { id:'SH-2024-001', origin:{ city:'Shanghái', country:'China' },    destination:{ city:'Arica',      country:'Chile'  }, status:'in-transit', progress:65, eta:'8 días',  departed:'25 Abr 2024', estimated:'25 May 2024', products:[{ name:'Filtro de Aire FA-2000',       quantity:1500 },{ name:'Filtro Hidráulico HF-100',    quantity:1000 }], route:'Marítimo',   carrier:'COSCO Shipping',      cost:'$12,450' },
  { id:'SH-2024-002', origin:{ city:'Miami',    country:'USA'   },    destination:{ city:'Santa Cruz', country:'Bolivia' }, status:'customs',    progress:85, eta:'2 días',  departed:'05 May 2024', estimated:'19 May 2024', products:[{ name:'Filtro de Aceite OL-500',       quantity:1200 }],                                                                         route:'Aéreo',      carrier:'DHL Express',         cost:'$8,200'  },
  { id:'SH-2024-003', origin:{ city:'São Paulo', country:'Brasil' },  destination:{ city:'Santa Cruz', country:'Bolivia' }, status:'planning',   progress:15, eta:'18 días', departed:'-',           estimated:'05 Jun 2024', products:[{ name:'Filtro de Combustible FC-300', quantity:3000 },{ name:'Filtro de Aceite OL-500', quantity:2000 }],                           route:'Terrestre',  carrier:'Trans-Sudamericana',  cost:'$5,800'  },
]

const initialExchangeRate = { current:6.97, previous:6.96, change:0.14, trend:'up', lastUpdated:'Hace 2 horas' }

const AppContext = createContext(null)
export const useAppContext = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [products, setProducts]         = useState(initialProducts)
  const [suppliers]                     = useState(initialSuppliers)
  const [shipments, setShipments]       = useState(initialShipments)
  const [exchangeRate]                  = useState(initialExchangeRate)
  const [processedData, setProcessedData] = useState(null)
  const [isUploading, setIsUploading]   = useState(false)

  const updateProduct    = (id, u) => setProducts(p => p.map(x => x.id === id ? {...x,...u} : x))
  const applyPriceChange = (id)    => setProducts(p => p.map(x => x.id === id ? {...x, currentPrice: x.recommendedPrice, status:'optimal'} : x))
  const addShipment      = (s)     => setShipments(sh => [...sh, {...s, id:`SH-2024-${String(sh.length+4).padStart(3,'0')}`}])

  const uploadFile = async (file) => {
    setIsUploading(true)
    try {
      const rows = await parseFile(file)
      if (!rows.length) { toast.error('El archivo está vacío o no se pudo leer'); return }
      const result = processRows(rows)
      if (!result.products.length) { toast.error('No se encontraron productos. Verifica la columna "Producto".'); return }
      setProcessedData(result)
      setProducts(result.products)
      toast.success(`✓ ${result.rowCount} registros · ${result.productCount} productos · ${result.monthCount} meses · ${result.yearRange}`)
    } catch(err) {
      toast.error(`Error al procesar: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const clearUploadedData = () => {
    setProcessedData(null)
    setProducts(initialProducts)
    toast.info('Datos restaurados a valores de demostración')
  }

  return (
    <AppContext.Provider value={{
      products, suppliers, shipments, exchangeRate,
      updateProduct, applyPriceChange, addShipment,
      processedData, isUploading, uploadFile, clearUploadedData,
      downloadSampleData,
    }}>
      {children}
    </AppContext.Provider>
  )
}
