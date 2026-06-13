import { cn } from '../../utils/cn.js'

export const NavLinks = ({ links, mobile = false }) => {
  return (
    <nav
      className={cn(
        mobile
          ? 'flex flex-col space-y-4 px-4 py-6'
          : 'hidden md:flex items-center space-x-8'
      )}
    >
      {links.map(link => (
        <a
          key={link.label}
          href={link.href}
          className={cn(
            'font-medium transition-colors hover:text-brand-blush',
            mobile ? 'text-base block' : 'text-sm uppercase tracking-wider'
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
