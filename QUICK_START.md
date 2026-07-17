# Quick Start Guide — OUTTA

## ⚡ 30 Second Setup

```bash
# Navigate to project
cd d:\FE_DATN

# Start dev server (already running at port 5173)
npm run dev

# Open in browser
http://localhost:5173
```

## 📍 What You'll See

### 1. Hero Section (Immediately visible)
- Animated headline with word-by-word reveal
- Parallax background image
- Call-to-action button
- Scroll prompt indicator

### 2. Product Grid (Scroll down)
- 12 clothing items in responsive grid
- Hover effects: image scales, overlay appears
- Product badges (NEW, SALE, BESTSELLER)
- Stagger animation as you scroll

### 3. AI Chat Bubble (Bottom-right corner)
- Floating button that pulses
- Click to open chat panel
- Type a message to get AI response
- Try keywords: "dress", "sale", "summer", "size"

### 4. Personalized Recommendations (Further down)
- Loads when you scroll to section
- 4 recommended products
- "Styled for you because..." reason chips
- Same hover effects as product grid

### 5. Footer (Bottom)
- Newsletter subscription
- Social media links
- Company information

## 🎮 Try These Interactions

### Hero Section
1. Watch the headline animate in
2. Notice the image moves as you scroll (parallax)
3. Click "Shop Now" → scrolls to products

### Product Cards
1. Hover over any product → image scales + overlay
2. Click "Add to Cart" → cart counter updates (top-right)
3. Scroll down → products fade in with stagger effect

### AI Styling Assistant
1. Locate chat bubble (bottom-right, pulsing)
2. Click to open the panel
3. Try typing: "show me dresses" or "what's on sale?"
4. Watch the typing indicator
5. Get a styled response + suggestions
6. Click suggestions to continue conversation

### Responsive Design
1. Resize your browser window
2. Notice at different widths:
   - **xs/sm**: Single column, hamburger menu
   - **md**: 2 columns, side navigation
   - **lg/xl**: 4 columns, full navigation

## 🛠️ Useful Commands

```bash
# Development
npm run dev          # Start dev server (hot reload enabled)

# Production
npm run build        # Create optimized build in 'dist' folder
npm run preview      # Preview production build

# Troubleshooting
npm install          # Reinstall dependencies if needed
npm list --depth=0   # Check installed packages
```

## 📂 Key Files to Know

```
src/
├── App.jsx                    # Main app component
├── components/
│   ├── Header/                # Navigation
│   ├── Hero/                  # Animated hero
│   ├── ProductGrid/           # 12 products
│   ├── AIStylingAssistant/    # Chat bubble (Phase 1)
│   ├── AIRecommendations/     # Recommendations (Phase 2)
│   └── Footer/                # Links & newsletter
├── data/
│   ├── products.js            # 12 mock products
│   ├── navLinks.js            # Navigation config
│   └── aiResponses.js         # AI responses & recommendations
├── hooks/
│   ├── useCart.js
│   ├── useAIChat.js
│   └── useScrollTrigger.js
└── index.css                  # Tailwind + custom styles
```

## 🎨 Customization

### Change Brand Colors
Edit `tailwind.config.js`:
```js
colors: {
  brand: {
    cream:    '#FAF7F2',  // background
    blush:    '#F2C4CE',  // buttons
    charcoal: '#2C2C2C',  // text
    // ... etc
  }
}
```

### Add More Products
Edit `src/data/products.js`:
```js
{
  id: 'outta-XXX',
  name: 'Product Name',
  price: 650000,
  images: ['url1', 'url2'],
  category: 'dresses' | 'tops' | 'bottoms' | 'outerwear',
  badge: 'new' | 'sale' | 'bestseller' | null,
  // ... more fields
}
```

### Modify AI Responses
Edit `src/data/aiResponses.js`:
- Add keywords to the intent map
- Modify response text
- Add new suggestion buttons

## 🚀 Connect Real AI (Super Easy!)

### Option 1: Claude API
In `src/data/aiResponses.js`, replace `getResponse()`:

```js
export const getResponse = async (userInput) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.VITE_ANTHROPIC_API_KEY },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [{ role: 'user', content: userInput }],
    }),
  })
  const data = await response.json()
  return {
    response: data.content[0].text,
    suggestions: [], // Optional: extract or generate
  }
}
```

### Option 2: Your Own API
```js
export const getResponse = async (userInput) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: userInput }),
  })
  return await response.json()
}
```

**UI components stay the same!** ✨

## ❓ FAQ

**Q: Why aren't animations working?**
A: Ensure Tailwind and GSAP are installed: `npm install`

**Q: How do I change product images?**
A: Edit URLs in `src/data/products.js` or upload to your CDN

**Q: Can I use the AI without API?**
A: Yes! Current mock responses work offline. Click chat bubble to try.

**Q: How do I deploy this?**
A: Run `npm run build`, upload `dist/` folder to Vercel/Netlify

**Q: What about the cart functionality?**
A: Click "Add to Cart" on products. Cart counter updates (top-right). Full cart page would be in Phase 3.

## 📖 Full Documentation

- **README.md**: Complete guide with architecture details
- **VERIFICATION_REPORT.md**: Full verification results
- **Code comments**: Inline comments explain GSAP animations

## ✨ Next Steps

1. ✅ Open http://localhost:5173 in browser
2. ✅ Explore all sections and interactions
3. ✅ Try the AI chat with different questions
4. ✅ Test responsive design (resize browser)
5. ✅ Read comments in `src/components/` to learn GSAP patterns
6. ✅ Deploy to production when ready!

---

**Happy coding!** 🚀

Built with React • Tailwind CSS • GSAP
