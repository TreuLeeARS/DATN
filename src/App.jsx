import { Header } from './components/Header/index.js'
import { Hero } from './components/Hero/index.js'
import { ProductGrid } from './components/ProductGrid/index.js'
import { AIRecommendations } from './components/AIRecommendations/index.js'
import { AIStylingAssistant } from './components/AIStylingAssistant/index.js'
import { Footer } from './components/Footer/index.js'
import { CartProvider } from './context/CartContext.jsx'

function App() {
  return (
    <CartProvider>
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <AIRecommendations />
      </main>
      <Footer />
      <AIStylingAssistant />
    </CartProvider>
  )
}

export default App
