# OUTTA — E-commerce Website & Admin Dashboard

A fully responsive, modern landing page for a premium women's clothing brand built with **React**, **Tailwind CSS**, and **GSAP** animations.

## Features

### Core Components
- Hero Section with animated headline reveal and parallax image
- Product Grid (4 columns) with hover animations and scroll-triggered stagger
- Product recommendations loaded from the backend
- Responsive Navigation with mobile menu toggle
- Newsletter subscription in footer
- Shopping cart with real-time counter

### Animations
- GSAP ScrollTrigger for scroll-based animations
- Stagger effects on product cards
- Interactive hover transformations
- Parallax scrolling on hero image

### Design
- Custom Tailwind color palette (cream, blush, charcoal)
- Playfair Display headlines + Inter body text
- Fully responsive (xs to xl breakpoints)
- Accessibility-first (ARIA labels, semantic HTML)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── Header/              Navigation with cart
│   ├── Hero/                Animated hero section
│   ├── ProductGrid/         Product cards with grid
│   ├── AIRecommendations/   Backend product recommendations
│   └── Footer/              Links & newsletter
├── hooks/
│   └── useCart.js           Cart state management
├── context/
│   └── CartContext.jsx      Global cart provider
├── data/
│   └── navLinks.js          Navigation & footer config
├── utils/
│   ├── gsapDefaults.js      Animation constants
│   └── cn.js                Classnames utility
└── main.jsx / App.jsx / index.css
```

## GSAP Animation Architecture

All animations use the `gsap.context()` API for safe React cleanup:

```jsx
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    // animations here
  }, scopeRef)
  return () => ctx.revert() // cleanup
}, [])
```

**Hero**: Word-split headline (0.7s stagger), parallax image on scroll  
**Products**: Stagger batch on scroll (0.1s spacing), hover timeline on cards  
**Sections**: Fade-up reveals on scroll trigger  

## Product Recommendations

- Loads real products from the backend.
- Shows recommendation cards with product variants and current prices.

## Brand Tokens

Colors: cream (#FAF7F2), blush (#F2C4CE), charcoal (#2C2C2C), muted (#8C8C8C), dark (#1A1A1A)  
Fonts: Playfair Display (headlines), Inter (body)  
Breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px)

## Build & Deploy

```bash
npm run build
npm run preview
```

Upload `dist` folder to Vercel, Netlify, or any static host.

## Testing Checklist

- Hero animations fire on page load
- Products stagger in on scroll
- Product hover: scale + overlay effect
- Recommendations load when scrolled to section
- Mobile menu toggle works on all sizes
- Newsletter subscription submit works

---

Built with React, Tailwind CSS, and GSAP for OUTTA.
