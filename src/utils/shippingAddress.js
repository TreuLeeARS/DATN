const PHONE_LABEL = /^(?:SĐT|SDT|Số điện thoại)\s*:\s*(.*)$/iu
const ADDRESS_LABEL = /^(?:Địa chỉ|Dia chi)\s*:\s*(.*)$/iu

export const formatShippingAddress = ({ fullName, phone, address }) => (
  `${fullName.trim()} | SĐT: ${phone.trim()} | Địa chỉ: ${address.trim()}`
)

export const parseShippingAddress = (value) => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return { fullName: '', phone: '', address: '' }

  const parts = raw.split(/\s*\|\s*/u).map(part => part.trim()).filter(Boolean)
  const phoneIndex = parts.findIndex(part => PHONE_LABEL.test(part))
  const addressIndex = parts.findIndex(part => ADDRESS_LABEL.test(part))

  // Older orders may contain only a plain address. Do not mistake it for a name.
  if (phoneIndex === -1 && addressIndex === -1) {
    return { fullName: '', phone: '', address: raw }
  }

  const firstLabelIndex = Math.min(
    phoneIndex === -1 ? parts.length : phoneIndex,
    addressIndex === -1 ? parts.length : addressIndex
  )
  const fullName = parts.slice(0, firstLabelIndex).join(' | ')
  const phone = phoneIndex === -1 ? '' : (parts[phoneIndex].match(PHONE_LABEL)?.[1] || '').trim()
  const addressHead = addressIndex === -1
    ? ''
    : (parts[addressIndex].match(ADDRESS_LABEL)?.[1] || '').trim()
  const addressTail = addressIndex === -1 ? [] : parts.slice(addressIndex + 1)

  return {
    fullName,
    phone,
    address: [addressHead, ...addressTail].filter(Boolean).join(' | ')
  }
}
