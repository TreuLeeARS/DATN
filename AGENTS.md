# BEE Store — Project Context

> Cập nhật gần nhất: 2026-07-17
> Mục đích: đọc file này trước khi làm việc để không phải quét lại toàn bộ FE và BE.

## Quy tắc làm việc

- FE nằm tại `D:\FE_DATN`; BE nằm tại `D:\BE_DATN`.
- BE là nguồn sự thật cho API, DTO, quyền truy cập và business logic. FE phải bám theo contract thực tế của BE, không tự giả định thêm field hoặc luồng.
- Không sửa BE khi yêu cầu chỉ thuộc phạm vi FE. Nếu BE thiếu hoặc sai, ghi rõ đó là blocker cần đội BE xử lý.
- Trước mỗi thay đổi, đọc file này rồi chỉ mở các file thuộc module liên quan. Chỉ quét lại toàn project khi cấu trúc thực tế không còn khớp tài liệu.
- Sau mỗi thay đổi làm ảnh hưởng kiến trúc, route, API, DTO, state, quyền, business flow hoặc dependency: cập nhật các bảng tương ứng và thêm một dòng vào `Lịch sử cập nhật` trong cùng lượt làm việc.
- Không ghi token, mật khẩu, JWT secret hoặc thông tin nhạy cảm vào file này.
- Không xóa/ghi đè thay đổi có sẵn của người dùng. Không đặt script debug hoặc thao tác dữ liệu tạm vào source chính; các script scratch cũ đã được dọn khỏi workspace.

## Tổng quan công nghệ

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| FE | React 19, Vite 8, React Router, Axios, Tailwind CSS, GSAP | SPA bán hàng và trang quản trị |
| BE | Java 17, Spring Boot 3.5.3, Spring Security, JPA, JWT, MapStruct/ModelMapper | REST API |
| Database | MySQL | Cấu hình trong `D:\BE_DATN\src\main\resources\application.yml` |
| API envelope | `BaseResponse<T>` | `{ success, message, errorCode, errorName, data, meta }` |
| Auth | Access token + refresh token | FE lưu trong `localStorage`; Axios tự gắn Bearer token |

## Cấu trúc FE

| Khu vực | Vị trí | Trách nhiệm |
|---|---|---|
| Khởi tạo/router | `src/main.jsx`, `src/App.jsx` | Mount app và khai báo route |
| API client | `src/api/` | Axios instance và API theo module |
| Hooks/state | `src/hooks/` | Cart, auth và logic dùng chung |
| Auth UI | `src/pages/AuthPage/` | Login/register/reset; đăng ký bắt buộc đồng ý điều khoản và đọc nội dung qua `LegalDocumentModal.jsx` |
| Storefront | `src/pages/ShopPage/`, `src/pages/CartPage/` | Sản phẩm, giỏ hàng, checkout, đơn cá nhân |
| Admin | `src/pages/Admin/` | Product, category, order, user, coupon, popup, invoice, dashboard, action log |
| Layout/guard | `src/components/AdminLayout.jsx`, `src/components/AdminProtectedRoute.jsx` | Menu và guard theo quyền ADMIN/STAFF; STAFF được tra cứu product, coupon/action-log chỉ ADMIN |
| Kết quả thanh toán | `src/pages/PaymentResultPage.jsx` | Nhận redirect MoMo tại `/payment-success` và xác minh trạng thái lại qua BE |
| Mapping | `src/utils/productMapper.js`, `src/utils/auth.js` | Chuẩn hóa product và đọc role JWT |
| Static config | `src/data/navLinks.js` | Cấu hình liên kết điều hướng/footer; sản phẩm thực lấy từ BE |

## Module và contract BE chính

| Module | API/đối tượng chính | Contract cần nhớ |
|---|---|---|
| Auth | `/api/v1/auth/**` | Login, register, activate, refresh, logout; username/email/password có giới hạn độ dài theo DTO |
| User | `/api/v1/users/**` | Entity dùng `id`, không phải `userId`; ADMIN/STAFF có một số quyền đọc |
| Product | `/api/v1/products/**` | Create nhận `variants` và `imageUrls`; update cơ bản không nhận ảnh, phải dùng endpoint `/images` riêng |
| Category | `/api/v1/categorys/**` | Có cây cha/con và soft delete/restore |
| Cart | `/api/v1/cart/**` | Cart item gắn với product variant; chưa thực sự giữ tồn kho |
| Checkout/order | `/api/v1/orders/**` | `CheckoutRequest` có `shippingAddress`, `province`, `district`, `ward`, `couponCode`, `paymentMethodType`; checkout toàn bộ giỏ |
| Order status | `OrderStatus` | `CREATED`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELED` |
| Order response | `OrderResponse` | Có `orderDate`, `subtotalAmount`, `discountValue`, `shippingFee`, `totalAmount`, ba cấp địa chỉ và URL thanh toán MoMo |
| Shipping fee | `POST /api/v1/shipping-fee/calculate` | Gửi `{ subtotalAmount, province, district, ward, shippingAddress }`; BE quyết định phí và ngưỡng miễn phí |
| Payment | `/api/v1/payment-methods`, `/api/v1/payments/**`, `/api/v1/momo/**` | COD tạo payment riêng; checkout MoMo trả URL thanh toán; `/payments/status/{orderOrMomoPaymentId}` dùng để đối chiếu kết quả |
| Coupon | `/api/v1/coupons/**` | `discountValue` là số tiền trừ trực tiếp, không phải phần trăm |
| Invoice | `/api/v1/invoices/**` | `InvoiceDTO` vẫn chỉ có `id`, `invoiceDate`, `totalAmount`, `order`; chưa expose tách `subtotalAmount`/`shippingFee`. Payment phải gọi riêng theo `orderId` |
| Dashboard | `/api/v1/admin/dashboard/**` | Doanh thu, thống kê, best seller cho admin/staff |
| Popup | `/api/v1/popup-coupon/**` | BE hiện bảo vệ bằng quyền ADMIN/STAFF |
| Action log | `/api/admin/action-logs` | Nằm ngoài prefix `/api/v1`; chỉ ADMIN; description hiện lưu dạng literal |

## Luồng nghiệp vụ hiện tại

### Đăng nhập

1. FE gọi login và lưu access/refresh token.
2. Axios gắn access token vào request.
3. Khi nhận HTTP 401, interceptor dùng single-flight queue để chỉ gọi một request refresh rồi retry các request đang chờ. Chỉ lỗi xác thực rõ ràng (`success=false`, HTTP 401/403 hoặc HTTP 400 kèm `success=false`) mới xóa phiên; lỗi mạng, response sai contract, HTTP 5xx hoặc HTTP 400 sai chuẩn giữ token để người dùng có thể thử lại.
4. Role được đọc từ JWT để quyết định giao diện quản trị.

### Giỏ hàng và checkout

1. Người đăng nhập dùng cart trên BE; hook còn hỗ trợ cart local nhưng giao diện hiện yêu cầu đăng nhập trước khi thêm hàng.
2. Cart item phải tham chiếu một product variant.
3. `CheckoutRequest` không có `cartItemIds`; FE và BE đều checkout toàn bộ item còn hiệu lực trong cart.
4. FE gửi đủ chuỗi giao nhận và `province`/`district`/`ward`, đồng thời gọi shipping-fee để hiển thị dự toán từ BE.
5. BE khóa tồn kho trong transaction, tạo order `CREATED`, trừ tồn kho, áp coupon, cộng phí vận chuyển và xóa toàn bộ cart.
6. FE tải phương thức từ `/payment-methods`; chỉ bật COD và MOMO vì đây là hai phương thức có flow BE thực tế. VNPAY vẫn bị khóa.
7. Với COD, FE gọi `/payments/cod`; BE chuyển order sang `CONFIRMED`.
8. Với MOMO, checkout tự tạo payment và trả `payUrl`; FE redirect sang MoMo, nhận lại tại `/payment-success`, rồi gọi payment status để xác minh thay vì tin query redirect.

### Địa chỉ giao hàng

1. BE lưu chuỗi `shippingAddress` và ba field riêng `province`, `district`, `ward` trên order.
2. FE dùng `formatShippingAddress`/`parseShippingAddress` tại `src/utils/shippingAddress.js` cho người nhận, số điện thoại và địa chỉ; đồng thời gửi ba cấp hành chính riêng đúng DTO.
3. Khi chọn GPS, Nominatim được gọi với `addressdetails=1`; FE khớp dữ liệu có cấu trúc vào ba cấp Tỉnh/Quận/Phường của danh sách hành chính và giữ phần số nhà/tên đường riêng.

### Trạng thái đơn và COD

1. `CREATED` có thể xác nhận thành `CONFIRMED` hoặc hủy.
2. `CONFIRMED` có thể chuyển `SHIPPING`, hủy, hoặc xác nhận đã thu COD.
3. `SHIPPING` có thể chuyển `DELIVERED`; BE tự xác nhận COD pending khi đánh dấu đã giao.
4. Chỉ `CREATED`/`CONFIRMED` được hiển thị thao tác hủy trên FE.

### Sản phẩm

1. Product chứa category, base price, images và variants.
2. Variant chứa size, color, SKU, giá và tồn kho.
3. Public API loại sản phẩm soft-deleted; admin detail dùng endpoint riêng.
4. Payload tạo mới phải gửi `variants`, không dùng cặp mảng `colors`/`sizes` để mong BE tự sinh.
5. STAFF được gọi danh sách `/products/admin` nhưng không được gọi admin detail hoặc mutation; FE chỉ cho xem chi tiết sản phẩm đang hoạt động bằng public detail.

## Sai lệch và lỗi đã biết

### Mức nghiêm trọng

| ID | Khu vực | Hiện trạng | Hướng xử lý |
|---|---|---|---|
| CRIT-04 | Payment security | API đọc payment và `POST /momo/create` chưa kiểm tra chủ sở hữu order | Blocker BE; FE không thể bảo vệ thay server |
| CRIT-07 | Secret management | `application.yml` BE vẫn chứa credential/secret tích hợp trong source | Blocker BE; phải chuyển sang biến môi trường và thay các secret đã lộ |

### Mức cao/trung bình

| ID | Khu vực | Hiện trạng |
|---|---|---|
| HIGH-10 | MoMo callback | `ipn-url` đang trỏ localhost; máy chủ MoMo không thể callback vào môi trường local nếu không dùng URL public/tunnel, payment có thể giữ `PENDING` |
| MED-02 | Popup/promo | Popup API chỉ dành ADMIN/STAFF nên storefront không hiển thị; cần endpoint public nếu muốn bật lại |
| MED-03 | Coupon public | Danh sách coupon có thể chứa bản ghi soft-deleted; FE lọc trước khi áp dụng nhưng BE phải đảm bảo tại checkout |
| MED-04 | Register response | `CreateUserResponse` thiếu accessor rõ ràng; form FE đã bám validation request hiện tại |
| MED-05 | Category | BE chưa ngăn chọn descendant làm parent, có thể tạo cycle |
| MED-10 | Invoice DTO | Invoice chưa trả tách tạm tính, giảm giá, phí ship và ba cấp địa chỉ mới; FE chỉ có thể hiển thị tổng cuối cùng trong hóa đơn |
| MED-11 | Category permission | BE chỉ ADMIN được update nhưng vẫn cho STAFF restore; cần xác nhận đây có phải nghiệp vụ chủ ý không |

### Đã xử lý ở FE đến ngày 2026-07-16

| ID cũ | Nội dung đã xử lý |
|---|---|
| CRIT-01/02/03 | Checkout toàn giỏ, dùng đúng `CREATED`/`CANCELED`/`orderDate`; COD và MoMo bám flow thật, VNPAY chưa có flow vẫn bị khóa |
| HIGH-01/02 | Bỏ upload file không tồn tại; create product gửi `variants`, update ảnh qua endpoint ảnh riêng |
| HIGH-03 | `addItem` truyền lỗi về caller và chỉ nhận đúng variant màu/size đã chọn; không toast thành công/chuyển trang khi API thất bại |
| MED-01 | STAFF vào dashboard/category/product/order/invoice/user/popup; product chỉ tra cứu, category chỉ ADMIN update/create/delete nhưng STAFF vẫn được restore đúng quyền hiện tại của BE; coupon/action-log ADMIN-only |
| Action log/Order permission | Action Log đọc được raw `Page<ActionLog>` hiện tại và dự phòng `BaseResponse`; ADMIN/STAFF đều được hủy đơn `CREATED`/`CONFIRMED` theo service BE mới |
| Shipping address/fee | Checkout gửi riêng Tỉnh/Quận/Phường, GPS đồng bộ đủ ba cấp và phí vận chuyển được lấy từ `/shipping-fee/calculate` thay vì FE tự gán |
| MED-02 cũ | Gỡ popup/fallback coupon giả khỏi storefront |
| MED-03 cũ | Coupon hiển thị và tính theo số tiền VND, không coi là phần trăm |
| MED-04 cũ | Form yêu cầu đủ họ/tên và bám giới hạn DTO register |
| Register legal consent | Chặn tạo tài khoản khi chưa đồng ý; Điều khoản dịch vụ và Chính sách bảo mật mở trong modal riêng, không thêm field ngoài DTO BE |
| Payment/order/invoice source | Bỏ dữ liệu payment/order/VAT/phương thức nhận hàng do FE tự gán; checkout lấy phương thức từ BE, order refetch sau mutation, hóa đơn dùng `InvoiceDTO.totalAmount` và gọi payment status theo `orderId` |
| BE version 2 | Đồng bộ `CheckoutRequest`/`OrderResponse`, shipping fee, MoMo redirect + status verification và ma trận quyền product/category/order mới; không sửa BE |
| MED-07/08 | Decode JWT base64url đúng; màu/size lấy từ variant thật, bỏ field trình bày tự suy diễn |
| MED-09 | Xóa module chatbot mock, dữ liệu product/response tĩnh và các hook không còn được import; khu gợi ý sản phẩm tiếp tục lấy dữ liệu thật từ BE |
| Auth refresh resilience | Interceptor phân biệt refresh token bị từ chối với lỗi tạm thời; không còn tự logout khi mất mạng, BE 5xx hoặc response refresh sai contract; khi phiên thật sự hết hạn, trang đăng nhập hiển thị flash message giải thích lý do |

## Chất lượng và kiểm tra

| Kiểm tra gần nhất | Kết quả |
|---|---|
| ESLint toàn FE | 0 errors, 0 warnings tại 2026-07-17 (`npm.cmd run lint`) |
| Vite production build | Thành công, 156 modules; còn cảnh báo main chunk khoảng 544 kB sau minify |
| Smoke test với BE đang chạy | Product list/detail và category từng trả thành công; `/payment-methods` của BE version 2 trả 401 khi gọi không token, phù hợp vì checkout FE yêu cầu đăng nhập |
| Automated tests | Chưa có bộ test đủ để xác nhận các luồng tích hợp FE–BE |

Các lệnh kiểm tra FE thông thường:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Checklist cập nhật tài liệu

Khi sửa hoặc thêm tính năng, cập nhật tối thiểu:

1. `Cấu trúc FE` nếu thêm/di chuyển module.
2. `Module và contract BE chính` nếu endpoint, DTO, enum hoặc quyền đổi.
3. `Luồng nghiệp vụ hiện tại` nếu thứ tự xử lý đổi.
4. `Sai lệch và lỗi đã biết`: xóa/đánh dấu đã xử lý hoặc thêm lỗi mới.
5. `Chất lượng và kiểm tra` với kết quả lint/build/test mới.
6. Thêm một dòng lịch sử bên dưới.

## Lịch sử cập nhật

| Ngày | Phạm vi | Nội dung |
|---|---|---|
| 2026-07-15 | Toàn dự án | Tạo bản tóm tắt đầu tiên sau khi rà source FE và BE; ghi nhận kiến trúc, contract, business flow và lỗi đã biết. |
| 2026-07-15 | Đồng bộ FE theo BE mới | Sửa auth, cart/checkout COD, product/variant/image, order/payment, coupon, quyền ADMIN/STAFF và mapper; gỡ popup coupon giả; lint/build thành công. |
| 2026-07-15 | Action log và quyền STAFF | Sửa FE đọc đúng response `Page<ActionLog>`, giữ tương thích nếu BE bọc `BaseResponse`, và ẩn thao tác hủy đơn khỏi STAFF; lint/build toàn FE thành công. |
| 2026-07-15 | Địa chỉ giao hàng | Bám contract chuỗi `shippingAddress` của BE, dùng formatter/parser chung để render ba phần; tách dữ liệu GPS vào Tỉnh/Quận/Phường; lint/build toàn FE thành công. |
| 2026-07-15 | Điều khoản đăng ký | Bắt buộc tick đồng ý trước khi đăng ký; thêm modal đọc Điều khoản dịch vụ và Chính sách bảo mật; không đổi payload BE; lint/build thành công. |
| 2026-07-15 | Giao diện quyền STAFF | Đồng bộ menu, tiêu đề, lối tắt và nút thao tác theo ma trận quyền: STAFF chỉ cập nhật category/popup có sẵn, xử lý đơn/COD và tra cứu invoice/user; ẩn các thao tác vòng đời dữ liệu và module ADMIN-only; không sửa BE; lint/build toàn FE thành công. |
| 2026-07-15 | Payment, order và invoice | Bỏ dữ liệu FE fix cứng; lấy danh sách/phương thức/trạng thái payment từ BE, refetch order sau mutation, dùng đúng `InvoiceDTO` và bỏ VAT/phương thức nhận hàng tự suy diễn; phương thức chưa có flow BE bị khóa; lint/build toàn FE thành công. |
| 2026-07-16 | Đồng bộ BE version 2 | Thêm shipping-fee, gửi ba cấp địa chỉ, bật flow MoMo và trang `/payment-success`, render breakdown tiền đơn hàng, cập nhật quyền STAFF cho product/category/order; ghi nhận giới hạn Invoice DTO và callback MoMo local; lint/build toàn FE thành công. |
| 2026-07-16 | Dọn source legacy | Xóa `AIStylingAssistant`, `useAIChat`, `useScrollTrigger`, dữ liệu `aiResponses`/`products` mock không còn nằm trong cây import; cập nhật tài liệu liên quan. |
| 2026-07-16 | Dọn script tạm | Xóa toàn bộ `scratch/`, `debug_db.js` và các script `scratch_*` không thuộc runtime/build FE; loại bỏ các script có lệnh xóa dữ liệu để tránh chạy nhầm. |
| 2026-07-17 | Auth refresh | Chỉ logout khi refresh token bị BE từ chối, trả HTTP 401/403 hoặc HTTP 400 kèm `success=false`; giữ phiên khi mất mạng, HTTP 5xx, HTTP 400 sai chuẩn hay response sai contract; bảo toàn single-flight queue, đường dẫn quay lại và hiển thị flash message giải thích khi phiên thật sự hết hạn; lint/build thành công. |
