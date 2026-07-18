# OUTTA — Project Context

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
3. Khi nhận HTTP 401, interceptor dùng single-flight queue để chỉ gọi một request refresh rồi retry các request đang chờ. Request trong queue được đánh dấu chỉ retry một lần; refresh có timeout 10 giây và không giữ Bearer header mặc định sau logout. Chỉ lỗi xác thực rõ ràng (`success=false`, HTTP 401/403, HTTP 400 kèm `success=false` hoặc token mới vẫn bị 401) mới xóa phiên; lỗi mạng, response sai contract, HTTP 5xx hoặc HTTP 400 sai chuẩn giữ token để người dùng có thể thử lại.
4. Role được đọc từ JWT để quyết định giao diện quản trị.

### Giỏ hàng và checkout

1. Người đăng nhập dùng cart trên BE; hook còn hỗ trợ cart local nhưng giao diện hiện yêu cầu đăng nhập trước khi thêm hàng.
2. Cart item phải tham chiếu một product variant.
3. `CheckoutRequest` không có `cartItemIds`; FE và BE đều checkout toàn bộ item còn hiệu lực trong cart.
4. FE gửi đủ chuỗi giao nhận và `province`/`district`/`ward`, đồng thời gọi shipping-fee để hiển thị dự toán từ BE.
5. BE khóa tồn kho trong transaction, tạo order `CREATED`, trừ tồn kho, áp coupon, cộng phí vận chuyển và xóa toàn bộ cart.
6. FE tải phương thức từ `/payment-methods`; chỉ bật COD và MOMO vì đây là hai phương thức có flow BE thực tế. VNPAY vẫn bị khóa.
7. Với COD, FE gọi `/payments/cod`; BE chuyển order sang `CONFIRMED`.
8. Với MOMO, checkout tự tạo payment và trả `payUrl`; FE redirect sang MoMo, nhận lại tại `/payment-success`, rồi gọi payment status để xác minh thay vì tin query redirect. Với đơn `CREATED` chưa có bất kỳ payment nào, khách có thể khởi tạo MoMo từ lịch sử đơn qua `POST /momo/create`; FE không hiện nút nếu payment đã tồn tại để tránh tạo trùng.

### Địa chỉ giao hàng

1. BE lưu chuỗi `shippingAddress` và ba field riêng `province`, `district`, `ward` trên order.
2. FE dùng `formatShippingAddress`/`parseShippingAddress` tại `src/utils/shippingAddress.js` cho người nhận, số điện thoại và địa chỉ; đồng thời gửi ba cấp hành chính riêng đúng DTO.
3. Luồng GPS/Nominatim đang tạm tắt vì dữ liệu bản đồ và danh mục hành chính sau sáp nhập chưa đồng bộ, từng tạo địa chỉ ghép sai giữa hai tỉnh.
4. Checkout hiện chỉ nhận địa chỉ nhập thủ công từ một nguồn: chọn đủ Tỉnh/Quận/Phường theo dropdown rồi nhập số nhà/tên đường. Chỉ khi đủ bốn phần FE mới gọi shipping-fee và cho phép checkout.

### Trạng thái đơn và COD

1. `CREATED` có thể xác nhận thành `CONFIRMED` hoặc hủy.
2. `CONFIRMED` có thể chuyển `SHIPPING`, hủy, hoặc xác nhận đã thu COD.
3. `SHIPPING` có thể chuyển `DELIVERED`; BE tự xác nhận COD pending khi đánh dấu đã giao.
4. Khách `USER` chỉ được hủy đơn của chính mình ở `CREATED`/`CONFIRMED`; ADMIN/STAFF có thể hủy theo quyền BE. Đơn có payment `SUCCESS`, `SHIPPING`, `DELIVERED` hoặc đã `CANCELED` không được hủy. FE hiển thị nút theo trạng thái đơn; BE là nơi kiểm tra cuối cùng payment/chủ sở hữu và hoàn tồn kho.

### Sản phẩm

1. Product chứa category, base price, images và variants.
2. Variant chứa size, color, SKU, giá và tồn kho.
3. Public API loại sản phẩm soft-deleted; admin detail dùng endpoint riêng.
4. Payload tạo mới phải gửi `variants`, không dùng cặp mảng `colors`/`sizes` để mong BE tự sinh.
5. STAFF không dùng endpoint quản trị product; FE gọi danh sách/detail public để tra cứu sản phẩm đang hoạt động. ADMIN mới dùng `/products/admin`, admin detail và các mutation.

## Sai lệch và lỗi đã biết

### Mức nghiêm trọng

| ID | Khu vực | Hiện trạng | Hướng xử lý |
|---|---|---|---|
| CRIT-07 | Secret management | `application.yml` BE vẫn chứa credential/secret tích hợp trong source | Blocker BE; phải chuyển sang biến môi trường và thay các secret đã lộ |

### Mức cao/trung bình

| ID | Khu vực | Hiện trạng |
|---|---|---|
| HIGH-10 | MoMo payment | `createPayment` chưa chặn order đã có payment nên có thể tạo nhiều payment cho một order; repository khác lại giả định một payment/order. Khi IPN thành công, BE xác nhận order nhưng chưa tạo invoice như luồng COD |
| HIGH-11 | COD partial transaction | Checkout tạo order trước, FE mới gọi riêng `/payments/cod`. Nếu request COD lỗi, order/cart/tồn kho đã commit nhưng payment chưa tồn tại, tạo đơn dở dang; FE hiển thị lý do BE trả về và cho khách hủy đơn, nhưng BE nên tạo COD cùng transaction checkout hoặc có cơ chế retry an toàn. |
| MED-14 | MoMo duplicate payment | `POST /momo/create` không kiểm tra payment có sẵn trước khi tạo mới. FE chỉ cho khởi tạo MoMo từ lịch sử đơn khi payment status là `NOT_CREATED`, nhưng BE vẫn cần chặn/idempotent endpoint để chống request song song hoặc client khác gọi lặp. |
| MED-01 | Action log | Mới gắn annotation ở một số endpoint order; checkout của khách cũng bị ghi, còn xác nhận COD/category/popup và các thao tác STAFF khác chưa ghi. Description vẫn là literal và API chỉ nhận page/size, chưa lọc server theo username/action/date |
| MED-13 | MoMo callback | `ipn-url` đã đổi sang URL ngrok public, không còn localhost; cần bảo đảm tunnel còn hoạt động và cấu hình theo từng môi trường, nếu không payment có thể giữ `PENDING` |
| MED-02 | Popup/promo | Popup API chỉ dành ADMIN/STAFF nên storefront không hiển thị; cần endpoint public nếu muốn bật lại |
| MED-03 | Coupon public | `GET /coupons` dùng `findAll(pageable)` nên trả cả coupon soft-deleted cho storefront. Checkout đã chặn coupon deleted, nhưng API public vẫn lộ dữ liệu không còn hiệu lực và buộc FE tự lọc |
| MED-04 | Register response | `CreateUserResponse` thiếu accessor rõ ràng; form FE đã bám validation request hiện tại |
| MED-05 | Category | BE chưa ngăn chọn descendant làm parent, có thể tạo cycle |
| MED-10 | Invoice DTO | Invoice chưa trả tách tạm tính, giảm giá, phí ship và ba cấp địa chỉ mới; FE chỉ có thể hiển thị tổng cuối cùng trong hóa đơn |
| MED-11 | Category permission | BE chỉ ADMIN được update nhưng vẫn cho STAFF restore; cần xác nhận đây có phải nghiệp vụ chủ ý không |
| MED-12 | Refresh session scope | BE lưu và so khớp nguyên chuỗi `User-Agent`; trình duyệt đổi phiên bản có thể bị coi là thiết bị khác. Logout/reset password thu hồi refresh token theo toàn username nên có thể làm các thiết bị khác hết phiên sau khi access token hết hạn |

### Đã xử lý ở FE đến ngày 2026-07-16

| ID cũ | Nội dung đã xử lý |
|---|---|
| CRIT-01/02/03 | Checkout toàn giỏ, dùng đúng `CREATED`/`CANCELED`/`orderDate`; COD và MoMo bám flow thật, VNPAY chưa có flow vẫn bị khóa |
| HIGH-01/02 | Bỏ upload file không tồn tại; create product gửi `variants`, update ảnh qua endpoint ảnh riêng |
| HIGH-03 | `addItem` truyền lỗi về caller và chỉ nhận đúng variant màu/size đã chọn; không toast thành công/chuyển trang khi API thất bại |
| MED-01 | STAFF vào dashboard/category/product/order/invoice/user/popup; product chỉ tra cứu qua danh sách public và public detail, category chỉ ADMIN update/create/delete nhưng STAFF vẫn được restore đúng quyền hiện tại của BE; coupon/action-log ADMIN-only |
| Action log/Order permission | Action Log đọc được raw `Page<ActionLog>` hiện tại và dự phòng `BaseResponse`; USER được hủy đơn của chính mình, ADMIN/STAFF có thể hủy theo quyền service BE khi đơn `CREATED`/`CONFIRMED` và chưa thanh toán thành công |
| Shipping address/fee | Checkout gửi riêng Tỉnh/Quận/Phường, chỉ đồng bộ khi người dùng chọn đủ dropdown và nhập địa chỉ chi tiết; phí vận chuyển lấy từ `/shipping-fee/calculate` thay vì FE tự gán. GPS tạm tắt do nguồn hành chính không đồng bộ |
| MED-02 cũ | Gỡ popup/fallback coupon giả khỏi storefront |
| MED-03 cũ | Coupon hiển thị và tính theo số tiền VND, không coi là phần trăm |
| MED-04 cũ | Form yêu cầu đủ họ/tên và bám giới hạn DTO register |
| Register legal consent | Chặn tạo tài khoản khi chưa đồng ý; Điều khoản dịch vụ và Chính sách bảo mật mở trong modal riêng, không thêm field ngoài DTO BE |
| Payment/order/invoice source | Bỏ dữ liệu payment/order/VAT/phương thức nhận hàng do FE tự gán; checkout lấy phương thức từ BE, order refetch sau mutation, hóa đơn dùng `InvoiceDTO.totalAmount` và gọi payment status theo `orderId` |
| BE version 2 | Đồng bộ `CheckoutRequest`/`OrderResponse`, shipping fee, MoMo redirect + status verification và ma trận quyền product/category/order mới; không sửa BE |
| MED-07/08 | Decode JWT base64url đúng; màu/size lấy từ variant thật, bỏ field trình bày tự suy diễn |
| MED-09 | Xóa module chatbot mock, dữ liệu product/response tĩnh và các hook không còn được import; khu gợi ý sản phẩm tiếp tục lấy dữ liệu thật từ BE |
| Auth refresh resilience | Interceptor phân biệt refresh token bị từ chối với lỗi tạm thời; dọn Bearer header khi hết phiên, đánh dấu retry cho cả request trong queue, giới hạn refresh 10 giây và chặn lặp nếu token mới vẫn 401; không tự logout khi mất mạng/BE 5xx/response sai contract; trang đăng nhập hiển thị flash message khi phiên thật sự hết hạn |
| FE flow audit 2026-07-17 | Resend activation kiểm tra `success`; coupon tìm đủ mọi trang; pending purchase lỗi được dọn; phí ship chỉ gọi khi đủ ba cấp địa chỉ; thao tác confirm/cancel/COD bám order/payment state và khóa khi không đọc được payment; escape dữ liệu in hóa đơn; dashboard dùng ngày local, all-settled và xử lý biểu đồ một điểm; bỏ social/newsletter giả, link `#` và mô tả product tự suy diễn; danh sách product/order đọc đủ phân trang thay giới hạn 1000 |
| Payment ownership | BE hiện đã gọi `ensureCanAccessOrder` cho đọc payment và tạo MoMo; lỗi CRIT-04 cũ đã được giải quyết ở source BE hiện tại |
| Profile cá nhân | BE mới có `GET /users/{username}` và `PATCH /users/{id}` cho hồ sơ cá nhân; FE cần dùng UUID claim `jti` trong access token vì `LoadUserResponse` không trả id. API PATCH chỉ cho sửa `email`, `firstName`, `lastName`, `phone`; không sửa username, role hay password. **Blocker BE:** `SecurityConfig` đang để `PATCH /api/v1/users/*` rơi vào rule `/users/**` chỉ ADMIN/STAFF, làm USER nhận 403 trước khi service kiểm tra chủ sở hữu. |

## Chất lượng và kiểm tra

| Kiểm tra gần nhất | Kết quả |
|---|---|
| ESLint toàn FE | 0 errors, 0 warnings tại 2026-07-17 (`npm.cmd run lint`) |
| Vite production build | Thành công, 156 modules; còn cảnh báo main chunk khoảng 531 kB sau minify |
| Interceptor runtime simulation | PASS: 3 request 401 đồng thời chỉ gọi refresh 1 lần và retry mỗi request 1 lần; token mới vẫn 401 không lặp refresh; lỗi refresh 500 giữ phiên và lần gọi sau phục hồi; login sai không xóa phiên cũ |
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
| 2026-07-17 | Danh sách sản phẩm STAFF | Tách nguồn dữ liệu theo quyền: ADMIN tiếp tục gọi `/products/admin` để quản lý cả bản ghi xóa mềm, STAFF gọi `/products` và public detail đúng nghiệp vụ chỉ tra cứu; không sửa BE. |
| 2026-07-17 | Audit refresh token | Sửa Bearer header bị lưu sau logout, đánh dấu retry cho request chờ, thêm timeout 10 giây cho `/auth/refresh`, chặn vòng refresh khi token mới vẫn 401 và không xóa phiên khi login sai; kiểm thử mô phỏng queue/transient failure/recovery đều pass; ghi nhận ràng buộc `User-Agent`/thu hồi đa thiết bị là blocker BE. |
| 2026-07-17 | Audit flow toàn FE | Sửa auth/coupon/cart/shipping/order-payment/invoice/dashboard/pagination; gỡ social login, newsletter và link giả chưa có API; cập nhật điều khoản MoMo; lint sạch và production build 157 modules thành công; đối chiếu lại blocker BE mới nhất. |
| 2026-07-17 | Đồng bộ GPS và dropdown | Map GPS theo kiểu all-or-nothing đủ Tỉnh/Quận/Phường, ưu tiên exact match toàn bộ candidate, chặn race giữa các lần map, khóa dropdown sau GPS và chỉ mở bằng thao tác chuyển sang nhập thủ công; lint/build thành công. |
| 2026-07-17 | Tạm tắt GPS | Gỡ nút bản đồ, Nominatim/autocomplete và `AddressMapModal` do dữ liệu hành chính sau sáp nhập chưa đồng bộ; checkout dùng duy nhất dropdown ba cấp và ô số nhà/tên đường để tránh ghép sai địa chỉ. |
| 2026-07-17 | Đồng bộ thương hiệu OUTTA | Đồng bộ tên thương hiệu trong auth, điều khoản, hóa đơn, hỗ trợ, local cart key và tài liệu FE thành OUTTA; giữ nguyên định danh kỹ thuật thuộc contract BE. |
| 2026-07-17 | Responsive Admin | Chuyển các nhóm input quản trị từ hai cột sang một cột ở mobile, giữ hai cột từ `sm`; tiêu đề Admin có truncate và giảm padding mobile để không tràn thanh đầu trang. |
| 2026-07-17 | Responsive product modal | Tách thanh CTA Thêm vào giỏ/Mua ngay ra khỏi vùng cuộn chi tiết; trên mobile nút luôn cố định ở đáy phần chi tiết sản phẩm sau gallery. |
| 2026-07-17 | Product modal mobile height | Đặt chiều cao modal mobile rõ ràng, giới hạn gallery theo viewport và cấp phần còn lại cho chi tiết/CTA; tránh gallery làm cắt toàn bộ nút thao tác trên iPhone SE. |
| 2026-07-17 | Responsive admin modal | Modal coupon và popup giới hạn chiều cao màn hình; nội dung form cuộn riêng còn nút Hủy/Tạo/Cập nhật luôn hiển thị ở footer. |
| 2026-07-17 | Mobile account access | Thêm menu Tài khoản ngay trên header mobile, tương đương menu desktop: khách có Đăng nhập/Đăng ký; người đã đăng nhập có Lịch sử mua hàng/Quản trị/Đăng xuất, không phải mở menu điều hướng trước. |
| 2026-07-17 | Hồ sơ cá nhân | Thêm `/profile`, API get/patch hồ sơ bám `ProfileUpdateRequest`; lấy UUID từ JWT `jti`, chỉ gửi field thay đổi và validation email/họ/tên/số điện thoại theo BE. Thêm lối vào Hồ sơ trong menu Tài khoản desktop/mobile. |
| 2026-07-17 | Profile permission diagnosis | Xác định `PATCH /users/{id}` của USER bị SecurityConfig chặn 403 bởi rule tổng chỉ ADMIN/STAFF; FE chặn request tải hồ sơ lặp trong React StrictMode để không spam toast, nhưng cập nhật profile cần BE thêm rule PATCH authenticated trước rule tổng. |
| 2026-07-18 | Khách hủy đơn | Đồng bộ nghiệp vụ hủy đơn BE mới: USER hủy đơn sở hữu ở `CREATED`/`CONFIRMED` nếu chưa thanh toán thành công; hiển thị nút không phụ thuộc request payment phụ, khóa khi đang gửi và render lỗi nghiệp vụ trực tiếp từ BE. |
| 2026-07-18 | Chẩn đoán COD | Bỏ field `amount` dư khỏi request COD, hiển thị message lỗi thực từ BE khi payment tạo sau checkout thất bại; ghi nhận checkout/COD hiện là hai transaction tách rời, cần BE xử lý để tránh order dở dang. |
| 2026-07-18 | Thanh toán MoMo từ lịch sử đơn | Thêm nút MoMo cho đơn `CREATED` được BE xác nhận chưa có payment; gọi `/momo/create`, kiểm tra `resultCode`/`payUrl` rồi redirect. Không hiển thị khi payment đã tồn tại để tránh tạo trùng do giới hạn endpoint BE hiện tại. |
| 2026-07-18 | Việt hóa trạng thái payment | Thêm mapper trạng thái payment dùng chung cho storefront, kết quả MoMo và hóa đơn admin; không render trực tiếp enum kỹ thuật `PENDING`/`SUCCESS`/`FAILED`/`REFUNDED`. COD pending hiển thị đúng nghiệp vụ “Chờ thu tiền khi giao hàng”. |
