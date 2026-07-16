import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const documents = {
  terms: {
    title: 'Điều khoản dịch vụ',
    intro: 'Khi tạo tài khoản và sử dụng BEE Store, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây.',
    sections: [
      {
        title: '1. Tài khoản người dùng',
        content: 'Bạn cần cung cấp thông tin chính xác, kích hoạt tài khoản theo hướng dẫn và tự bảo mật thông tin đăng nhập của mình.'
      },
      {
        title: '2. Đặt hàng và thanh toán',
        content: 'Đơn hàng chỉ được ghi nhận khi hệ thống xác nhận tạo đơn thành công. Phương thức thanh toán hiện được hỗ trợ là thanh toán khi nhận hàng (COD).'
      },
      {
        title: '3. Giá, khuyến mại và tồn kho',
        content: 'Giá bán, mã giảm giá và số lượng tồn kho được xác định theo dữ liệu tại thời điểm hệ thống xử lý đơn hàng.'
      },
      {
        title: '4. Hủy đơn và giao nhận',
        content: 'Bạn có thể yêu cầu hủy đơn khi đơn còn ở trạng thái cho phép. Sau khi đơn được giao, yêu cầu đổi trả cần được xử lý theo chính sách hỗ trợ của cửa hàng.'
      },
      {
        title: '5. Hành vi không được phép',
        content: 'Không sử dụng dịch vụ để gian lận, gây gián đoạn hệ thống, xâm phạm tài khoản khác hoặc thực hiện hành vi trái pháp luật.'
      },
      {
        title: '6. Thay đổi điều khoản',
        content: 'BEE Store có thể cập nhật điều khoản khi dịch vụ thay đổi. Phiên bản áp dụng sẽ được công bố trên giao diện đăng ký hoặc khu vực thông báo.'
      }
    ]
  },
  privacy: {
    title: 'Chính sách bảo mật',
    intro: 'Chính sách này mô tả cách BEE Store sử dụng thông tin bạn cung cấp khi đăng ký, đặt hàng và sử dụng dịch vụ.',
    sections: [
      {
        title: '1. Thông tin được thu thập',
        content: 'Hệ thống có thể lưu họ tên, tên đăng nhập, email, số điện thoại, địa chỉ giao hàng và lịch sử đơn hàng để cung cấp dịch vụ.'
      },
      {
        title: '2. Mục đích sử dụng',
        content: 'Thông tin được dùng để xác thực tài khoản, xử lý đơn hàng, giao nhận, hỗ trợ khách hàng và bảo vệ an toàn hệ thống.'
      },
      {
        title: '3. Chia sẻ thông tin',
        content: 'Thông tin chỉ nên được chia sẻ với bên cần thiết để hoàn thành đơn hàng hoặc khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền.'
      },
      {
        title: '4. Bảo mật tài khoản',
        content: 'Bạn không nên chia sẻ mật khẩu hoặc mã xác thực. Hãy thông báo cho cửa hàng khi phát hiện tài khoản có dấu hiệu bị truy cập trái phép.'
      },
      {
        title: '5. Quyền của người dùng',
        content: 'Bạn có thể yêu cầu kiểm tra hoặc cập nhật thông tin cá nhân thông qua chức năng tài khoản hoặc kênh hỗ trợ của cửa hàng.'
      }
    ]
  }
}

export const LegalDocumentModal = ({ documentType, onClose }) => {
  const legalDocument = documents[documentType]

  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!legalDocument) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-document-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
              BEE Store
            </p>
            <h2 id="legal-document-title" className="font-display text-2xl font-bold text-brand-charcoal">
              {legalDocument.title}
            </h2>
            <p className="mt-1 text-[11px] text-brand-muted">Cập nhật ngày 15/07/2026</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-brand-muted transition-colors hover:bg-gray-100 hover:text-brand-charcoal"
            aria-label={`Đóng ${legalDocument.title}`}
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5 text-sm leading-6 text-brand-charcoal">
          <p className="mb-5 rounded-xl border border-brand-blush/40 bg-brand-blush/10 p-4 text-brand-muted">
            {legalDocument.intro}
          </p>
          <div className="space-y-5">
            {legalDocument.sections.map(section => (
              <section key={section.title}>
                <h3 className="mb-1 font-semibold text-brand-charcoal">{section.title}</h3>
                <p className="text-brand-muted">{section.content}</p>
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-charcoal px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
          >
            Đã hiểu
          </button>
        </footer>
      </section>
    </div>,
    window.document.body
  )
}
