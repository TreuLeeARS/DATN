import { useState, useEffect, useRef } from 'react'
import { AddressMapModal } from './AddressMapModal.jsx'

export const AddressSelector = ({ value, onAddressChange, disabled, error }) => {
  // Administrative API state (Vietnam Location API)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedWard, setSelectedWard] = useState(null)
  const [streetAddress, setStreetAddress] = useState('')

  // Map & Autocomplete Suggestions State
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  const dropdownRef = useRef(null)

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
      setDistricts([])
      setSelectedDistrict(null)
      setWards([])
      setSelectedWard(null)
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
      setWards([])
      setSelectedWard(null)
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

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 4. Live autocomplete search as user types in street input
  useEffect(() => {
    if (!streetAddress || streetAddress.trim().length < 3) {
      setSuggestions([])
      return
    }

    const queryContext = [
      streetAddress,
      selectedWard?.full_name,
      selectedDistrict?.full_name,
      selectedProvince?.full_name
    ].filter(Boolean).join(', ')

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryContext + ', Việt Nam'
          )}&accept-language=vi&limit=5`
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const formatted = data.map((item) => ({
              raw: item,
              displayName: item.display_name
                .replace(', Việt Nam', '')
                .replace(', Vietnam', '')
            }))
            setSuggestions(formatted)
            setShowSuggestions(formatted.length > 0)
          }
        }
      } catch (err) {
        console.error('Lỗi gợi ý địa chỉ:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince])

  // Concatenate full address string
  const fullCompiledAddress = [
    streetAddress.trim(),
    selectedWard?.full_name,
    selectedDistrict?.full_name,
    selectedProvince?.full_name
  ].filter(Boolean).join(', ')

  // Check completeness: truthy if street address or dropdown selections
  const isComplete = Boolean(
    streetAddress.trim() || (selectedProvince && selectedDistrict)
  )

  // Sync with parent form
  useEffect(() => {
    if (isComplete && fullCompiledAddress !== value) {
      onAddressChange(fullCompiledAddress)
    } else if (!isComplete && value !== '') {
      onAddressChange('')
    }
  }, [fullCompiledAddress, isComplete])

  const handleProvinceSelect = (e) => {
    const pId = e.target.value
    const found = provinces.find((p) => String(p.id) === String(pId))
    setSelectedProvince(found || null)
    setSelectedDistrict(null)
    setSelectedWard(null)
  }

  const handleDistrictSelect = (e) => {
    const dId = e.target.value
    const found = districts.find((d) => String(d.id) === String(dId))
    setSelectedDistrict(found || null)
    setSelectedWard(null)
  }

  const handleWardSelect = (e) => {
    const wId = e.target.value
    const found = wards.find((w) => String(w.id) === String(wId))
    setSelectedWard(found || null)
  }

  const handleMapSelect = (mapAddress) => {
    const cleanAddr = mapAddress.replace(', Việt Nam', '').replace(', Vietnam', '')
    setStreetAddress(cleanAddr)
    setShowSuggestions(false)
  }

  const handleSelectSuggestion = (item) => {
    setStreetAddress(item.displayName)
    setShowSuggestions(false)
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3.5">
      {/* Header Label & Map Button */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🚚</span>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Địa chỉ nhận hàng chi tiết
          </label>
        </div>
        <button
          type="button"
          onClick={() => setIsMapOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <span className="animate-pulse">📌</span> Chọn trên bản đồ GPS
        </button>
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

      {/* Row 2: Street Address Input & Live Autocomplete Suggestions */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => {
              setStreetAddress(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            disabled={disabled}
            placeholder="Số nhà, Tên đường (Gõ tên đường để hiện danh sách gợi ý địa chỉ chuẩn)..."
            className="input-base text-xs py-2.5 pl-9 pr-8 shadow-sm focus:ring-2 focus:ring-brand-charcoal/20"
          />
          <span className="absolute left-3 top-2.5 text-sm text-amber-600">
            🏠
          </span>
          {isSearching && (
            <span className="absolute right-3 top-2.5 text-xs animate-spin text-gray-400">
              ⌛
            </span>
          )}
        </div>

        {/* Live Suggestions Dropdown Menu */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto divide-y divide-gray-100">
            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1">
              <span>💡</span> Gợi ý địa chỉ từ bản đồ (Bấm để chọn):
            </div>
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50/90 transition-colors flex items-start gap-2.5 text-brand-charcoal group"
              >
                <span className="text-amber-600 group-hover:scale-110 transition-transform text-sm mt-0.5">
                  📍
                </span>
                <span className="flex-1 leading-relaxed font-medium">
                  {item.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: Unified Live Address Preview */}
      {fullCompiledAddress ? (
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

      {/* Interactive Leaflet Map Modal */}
      <AddressMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectAddress={handleMapSelect}
      />
    </div>
  )
}
