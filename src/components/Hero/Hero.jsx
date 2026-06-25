import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeroText } from './HeroText.jsx'
import { HeroImage } from './HeroImage.jsx'
import { duration, ease, stagger } from '../../utils/gsapDefaults.js'

gsap.registerPlugin(ScrollTrigger)

export const Hero = () => {
  const containerRef = useRef(null)
  const headlineRef = useRef(null)
  const sublineRef = useRef(null)
  const ctaRef = useRef(null)
  const imageRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Ensure headlineRef contains span elements for word splitting
      const headlineElement = headlineRef.current
      if (headlineElement) {
        const words = headlineElement.querySelectorAll('span')

        // Timeline sequence for hero entrance animation
        const timeline = gsap.timeline()

        // Word-by-word headline reveal
        timeline.from(words, {
          y: 80,
          opacity: 0,
          duration: duration.base,
          ease: ease.out,
          stagger: stagger.text,
        }, 0)

        // Subline fades up slightly delayed
        timeline.from(sublineRef.current, {
          y: 30,
          opacity: 0,
          duration: duration.base * 0.8,
          ease: ease.out,
        }, duration.base * 0.3)

        // CTA button scales in
        timeline.from(ctaRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: duration.fast,
          ease: ease.out,
        }, duration.base * 0.6)
      }

      // Image parallax effect on scroll
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: 100,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
            once: false,
          },
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const headline = 'Khám Phá Phong Cách Của Bạn'
  const subline = 'Thời trang nữ cao cấp tôn vinh cá tính riêng. Từ những chiếc đầm thanh lịch đến trang phục thường ngày thoải mái, OUTTA luôn có lựa chọn cho mọi khoảnh khắc.'
  const ctaLabel = 'Mua Ngay'
  const ctaHref = '#products'

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-12 md:pb-0 md:min-h-screen flex items-center
                 bg-gradient-to-b from-brand-cream to-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text Content */}
          <HeroText
            headline={headline}
            subline={subline}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            headlineRef={headlineRef}
            sublineRef={sublineRef}
            ctaRef={ctaRef}
          />

          {/* Hero Image */}
          <div className="hidden md:block">
            <HeroImage
              src="https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop"
              alt="Ảnh bìa"
              imageRef={imageRef}
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2
                      flex-col items-center animate-bounce">
        <span className="text-sm text-brand-muted mb-2">Cuộn xuống để khám phá</span>
        <svg className="w-6 h-6 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
