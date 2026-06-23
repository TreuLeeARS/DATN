import { showAuthToast } from '../../utils/authToast.jsx'

export const HeroText = ({ headline, subline, ctaLabel, ctaHref, headlineRef, sublineRef, ctaRef }) => {
  // Split headline into words for animation
  const words = headline.split(' ')

  return (
    <div className="space-y-6 max-w-2xl">
      <h1
        ref={headlineRef}
        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                   text-brand-charcoal font-semibold leading-tight"
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block mr-2"
            style={{ display: 'inline-block' }}
          >
            {word}
          </span>
        ))}
      </h1>

      <p
        ref={sublineRef}
        className="text-lg md:text-xl text-brand-muted leading-relaxed max-w-xl"
      >
        {subline}
      </p>

      <div>
        <a
          ref={ctaRef}
          href={ctaHref}
          className="btn-primary inline-block"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  )
}
