import { cn } from '../../utils/cn.js'

export const ProductBadge = ({ type }) => {
  if (!type) return null

  const badgeClasses = {
    new: 'badge-new',
    sale: 'badge-sale',
    bestseller: 'badge-bestseller',
  }

  const labelMap = {
    new: 'New',
    sale: 'Sale',
    bestseller: 'Bestseller',
  }

  return (
    <div className={cn('badge', badgeClasses[type])}>
      {labelMap[type]}
    </div>
  )
}
