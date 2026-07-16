import { useState, useEffect, useRef } from 'react'

const DEFAULT_COORDS = { lat: 10.7769, lon: 106.7009 }

export const AddressMapModal = ({ isOpen, onClose, onSelectAddress }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedAddressDetails, setSelectedAddressDetails] = useState({})
  const mapContainerRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerRef = useRef(null)

  // Load Leaflet CSS and JS CDN dynamically
  useEffect(() => {
    if (!isOpen) return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet Script
    function initMap() {
      if (!window.L || !mapContainerRef.current) return

      // Destroy previous map instance if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }

      const L = window.L
      const map = L.map(mapContainerRef.current).setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], 15)
      leafletMapRef.current = map

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map)

      // Custom Red Pin Marker
      const marker = L.marker([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], { draggable: true }).addTo(map)
      markerRef.current = marker

      // Reverse geocode helper
      async function updateAddressFromCoords(lat, lon) {
        setLoading(true)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=vi`
          )
          const data = await res.json()
          if (data && data.display_name) {
            setSelectedAddress(data.display_name)
            setSelectedAddressDetails(data.address || {})
          }
        } catch (err) {
          console.error('Lỗi đọc tọa độ:', err)
        } finally {
          setLoading(false)
        }
      }

      // Handle Map Click (User clicks anywhere on map)
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        updateAddressFromCoords(lat, lng)
      })

      // Handle Marker Drag
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        updateAddressFromCoords(position.lat, position.lng)
      })

      // Initial address lookup
      updateAddressFromCoords(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon)
    }

    if (window.L) {
      setTimeout(initMap, 100)
    } else {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setTimeout(initMap, 100)
      document.head.appendChild(script)
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  // Search location via Nominatim API
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          searchQuery + ', Việt Nam'
        )}&addressdetails=1&accept-language=vi`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const place = data[0]
        const lat = parseFloat(place.lat)
        const lon = parseFloat(place.lon)
        setSelectedAddress(place.display_name)
        setSelectedAddressDetails(place.address || {})

        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([lat, lon], 16)
          markerRef.current.setLatLng([lat, lon])
        }
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm bản đồ:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    const finalAddr = selectedAddress || searchQuery || 'Chưa chọn địa chỉ chi tiết'
    onSelectAddress({
      displayName: finalAddr,
      address: selectedAddressDetails
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-brand-cream/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="font-semibold text-brand-charcoal text-base">
                Bản đồ chọn vị trí nhận hàng
              </h3>
              <p className="text-[11px] text-brand-muted">
                Bấm vào bất kỳ đâu trên bản đồ hoặc kéo thả ghim đỏ để chọn nhà bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên đường, phường, quận để tìm kiếm trên bản đồ..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-charcoal text-white rounded-xl text-xs font-medium hover:bg-black transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                '🔍 Tìm vị trí'
              )}
            </button>
          </form>

          {/* Real Interactive Leaflet Map Container */}
          <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-[11px] text-gray-700 border border-gray-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Click chọn trực tiếp trên bản đồ
            </div>
          </div>

          {/* Selected Address Preview */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <span className="text-base">📍</span>
            <div className="flex-1">
              <strong className="font-semibold block text-amber-950 mb-0.5">
                Vị trí đã chọn (Tự động đọc địa chỉ):
              </strong>
              {loading ? (
                <span className="text-amber-700 italic animate-pulse">Đang định vị địa chỉ...</span>
              ) : (
                <span className="font-medium">{selectedAddress || 'Hãy bấm vào bản đồ để chọn vị trí'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAddress}
            className="px-6 py-2 bg-brand-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            Xác nhận vị trí này
          </button>
        </div>
      </div>
    </div>
  )
}
