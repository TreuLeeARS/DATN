import { useState, useEffect } from 'react'

export const AddressSelector = ({ value, onAddressChange, disabled, error }) => {
  // Administrative API state (Vietnam Location API)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedWard, setSelectedWard] = useState(null)
  const [streetAddress, setStreetAddress] = useState('')

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  // 1. Fetch 63 Provinces/Cities on mount
  useEffect(() => {
    let isMounted = true
    async function loadProvinces() {
      setIsLoadingProvinces(true)
      try {
        const res = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
        if (res.ok) {
          const json = await res.json()
          if (isMounted && json.error === 0 && Array.isArray(json.data)) {
            setProvinces(json.data)
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách Tỉnh/Thành:', err)
      } finally {
        if (isMounted) setIsLoadingProvinces(false)
      }
    }
    loadProvinces()
    return () => { isMounted = false }
  }, [])

  // 2. Fetch Districts whenever Province changes
  useEffect(() => {
    if (!selectedProvince?.id) {
      return
    }

    let isMounted = true
    async function loadDistricts() {
      setIsLoadingDistricts(true)
      try {
        const res = await fetch(`https://esgoo.net/api-tinhthanh/2/${selectedProvince.id}.htm`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted && json.error === 0 && Array.isArray(json.data)) {
            setDistricts(json.data)
          }
        }
      } catch (err) {
        console.error('Lỗi tải Quận/Huyện:', err)
      } finally {
        if (isMounted) setIsLoadingDistricts(false)
      }
    }
    loadDistricts()
    return () => { isMounted = false }
  }, [selectedProvince])

  // 3. Fetch Wards whenever District changes
  useEffect(() => {
    if (!selectedDistrict?.id) {
      return
    }

    let isMounted = true
    async function loadWards() {
      setIsLoadingWards(true)
      try {
        const res = await fetch(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict.id}.htm`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted && json.error === 0 && Array.isArray(json.data)) {
            setWards(json.data)
          }
        }
      } catch (err) {
        console.error('Lỗi tải Phường/Xã:', err)
      } finally {
        if (isMounted) setIsLoadingWards(false)
      }
    }
    loadWards()
    return () => { isMounted = false }
  }, [selectedDistrict])

  // Concatenate full address string
  const fullCompiledAddress = [
    streetAddress.trim(),
    selectedWard?.full_name,
    selectedDistrict?.full_name,
    selectedProvince?.full_name
  ].filter(Boolean).join(', ')

  // Chỉ đồng bộ lên checkout khi có đủ địa chỉ chi tiết và cả ba cấp hành chính.
  const isComplete = Boolean(
    streetAddress.trim() && selectedProvince && selectedDistrict && selectedWard
  )

  // Sync with parent form
  useEffect(() => {
    const details = {
      province: selectedProvince?.full_name || selectedProvince?.name || '',
      district: selectedDistrict?.full_name || selectedDistrict?.name || '',
      ward: selectedWard?.full_name || selectedWard?.name || '',
    }

    if (isComplete && fullCompiledAddress !== value) {
      onAddressChange(fullCompiledAddress, details)
    } else if (!isComplete && value !== '') {
      onAddressChange('', { province: '', district: '', ward: '' })
    }
  }, [
    fullCompiledAddress,
    isComplete,
    onAddressChange,
    selectedDistrict,
    selectedProvince,
    selectedWard,
    value,
  ])

  const handleProvinceSelect = (e) => {
    const pId = e.target.value
    const found = provinces.find((p) => String(p.id) === String(pId))
    setSelectedProvince(found || null)
    setDistricts([])
    setSelectedDistrict(null)
    setWards([])
    setSelectedWard(null)
  }

  const handleDistrictSelect = (e) => {
    const dId = e.target.value
    const found = districts.find((d) => String(d.id) === String(dId))
    setSelectedDistrict(found || null)
    setWards([])
    setSelectedWard(null)
  }

  const handleWardSelect = (e) => {
    const wId = e.target.value
    const found = wards.find((w) => String(w.id) === String(wId))
    setSelectedWard(found || null)
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3.5">
      {/* Header Label */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🚚</span>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Địa chỉ nhận hàng chi tiết
          </label>
        </div>
        <span className="text-[10px] font-medium text-brand-muted">Nhập địa chỉ hành chính thủ công</span>
      </div>

      {/* Row 1: 3-Tier Cascading Select Dropdowns (Tỉnh -> Quận -> Phường) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Province / City */}
        <div>
          <select
            value={selectedProvince?.id || ''}
            onChange={handleProvinceSelect}
            disabled={disabled || isLoadingProvinces}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal bg-white"
          >
            <option value="">
              {isLoadingProvinces ? '-- Đang tải Tỉnh/Thành... --' : '-- Chọn Tỉnh / Thành --'}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.name}
              </option>
            ))}
          </select>
        </div>

        {/* District (Includes Thành phố Thủ Đức & districts) */}
        <div>
          <select
            value={selectedDistrict?.id || ''}
            onChange={handleDistrictSelect}
            disabled={disabled || !selectedProvince || isLoadingDistricts}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {isLoadingDistricts
                ? '-- Đang tải Quận/Huyện... --'
                : '-- Chọn Quận / Huyện / TP --'}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name || d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div>
          <select
            value={selectedWard?.id || ''}
            onChange={handleWardSelect}
            disabled={disabled || !selectedDistrict || isLoadingWards}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {isLoadingWards
                ? '-- Đang tải Phường/Xã... --'
                : '-- Chọn Phường / Xã --'}
            </option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name || w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Street Address Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            disabled={disabled}
            placeholder="Nhập số nhà, tên đường, tòa nhà..."
            className="input-base text-xs py-2.5 pl-9 pr-3 shadow-sm focus:ring-2 focus:ring-brand-charcoal/20"
          />
          <span className="absolute left-3 top-2.5 text-sm text-amber-600">
            🏠
          </span>
        </div>
      </div>

      {/* Row 3: Unified Live Address Preview */}
      {isComplete ? (
        <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 shadow-sm">
          <span className="text-base">🏡</span>
          <div className="flex-1">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-emerald-950 mb-0.5">
              Địa chỉ hoàn chỉnh dùng để giao hàng:
            </span>
            <span className="font-semibold text-emerald-900 leading-relaxed text-xs">
              {fullCompiledAddress}
            </span>
          </div>
        </div>
      ) : null}

      {/* Validation Error Message */}
      {error && (
        <p className="text-red-400 text-xs mt-1 animate-slide-up">{error}</p>
      )}

    </div>
  )
}
