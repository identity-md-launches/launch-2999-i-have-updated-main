# Squeekchain — Xác minh dự án "Squeek Life"

Trang xác minh yêu cầu **3 thứ**. Tình trạng hiện tại:

| # | Yêu cầu | Tình trạng |
|---|---------|-----------|
| 1 | Thẻ `<meta name="squeekchain-project" content="e8f5e568-69c8-4f8f-af6c-fcc13af273c0">` trong `<head>` của trang | ✅ **ĐÃ ĐẠT** — tra ngày 05/11: bản live `https://finish-product-322f7d.surf.computer/` đã chứa thẻ này (bạn đã publish bản mới). |
| 2 | Bản ghi **DNS TXT** cho miền `finish-product-322f7d.surf.computer` | ⛔ **KHÔNG THỂ LÀM** — vùng DNS thuộc AWS Route 53 của nền tảng Surf. Xem phần "Vì sao" bên dưới. |
| 3 | Một dòng trong **repository** | 🟡 Source đã lên GitHub (`frontend/`, `backend/`, `README.md`, `DEPLOY.md`…). Còn thiếu **dòng xác minh** mà form cấp — cần chụp phần dưới của form (ảnh bị cắt). |

### Bản đối chiếu với form Squeekchain

| Form yêu cầu | Làm được với địa chỉ hiện tại? | Làm được sau khi dùng `squeek.life`? |
|---|---|---|
| 1. TXT record trong DNS | ❌ Không (không có quyền với `surf.computer`) | ✅ Có — `_squeekchain.squeek.life` trong Cloudflare |
| 2. Tag trên trang | ✅ Đã đạt (bản live đã có thẻ) | ✅ Giữ nguyên (custom domain trỏ vào **cùng bản deployment**) |
| 3. Line trong repository | ✅ Repo đã có source | 🟡 Cần thêm dòng xác minh |

➡️ Vì mục 1 bất khả thi ở địa chỉ cũ, **bấm VERIFY ở địa chỉ hiện tại sẽ mãi báo "not verified"**. Con đường duy nhất: đưa trang sang `squeek.life` rồi đổi địa chỉ dự án sang miền đó.

---

## ✅ Cách gỡ chặn: dùng **Custom Domain** của Studio với `squeek.life`

Studio có sẵn tính năng **Custom Domain** — gắn tên miền riêng vào bản web đã publish (thay cho địa chỉ tự sinh `…surf.computer`). Bạn đã nhập `squeek.life`, trạng thái *Pending verification* — chỉ còn thiếu **2 bản ghi DNS**.

**Kết quả tra DNS thực tế:**

| Kiểm tra | Kết quả |
|----------|---------|
| Nameserver của `squeek.life` | `alberto.ns.cloudflare.com`, `elma.ns.cloudflare.com` → **quản lý DNS ở Cloudflare** |
| Bản ghi A hiện tại | `216.150.16.193`, `216.150.16.1` → trang **Wix** "SQK LIFE · Squeek Life" (có gọi `api.squeekchain.com`) |
| Bản ghi TXT xác minh | **Chưa có** → đó là lý do còn *Pending* |
| IP của `cname.surf.computer` | `44.238.118.24` (dự phòng nếu cần dùng A record) |

### ⚠️ Chọn 1 trong 2 cách

**Cách 1 — Đưa game lên chính `squeek.life` (thay trang Wix hiện tại)**

1. Cloudflare → `squeek.life` → **DNS → Records** → **xoá 2 bản ghi A của `@`** (`216.150.16.193`, `216.150.16.1`).
2. Thêm: `CNAME` · Name `@` · Target `cname.surf.computer` · Proxy **DNS only (mây xám)**.
   - Nếu Cloudflare không nhận CNAME ở `@`: dùng `A` · `@` · `44.238.118.24`.
3. Thêm: `TXT` · Name `_surf-studio-verify.squeek.life` · Content `surf-studio-verify=…`
   → bấm nút **COPY** trong panel Studio để lấy giá trị **đầy đủ** (ảnh chụp bị cắt).
4. Quay lại Studio → bấm **Refresh** → chờ 1–5 phút → trạng thái chuyển *Verified*.

**Cách 2 — Giữ trang Wix, đưa game lên subdomain `play.squeek.life`**

1. Studio → Custom Domain → nhập `play.squeek.life` (thử xem Studio có nhận subdomain không).
2. Cloudflare → thêm `CNAME` · Name `play` · Target `cname.surf.computer` · **DNS only (mây xám)**.
3. Thêm TXT xác minh mà Studio cấp cho subdomain đó.
4. Studio → **Refresh**.

### ⚠️ Điều quan trọng nhất: phải ĐỔI ĐỊA CHỈ DỰ ÁN, không chỉ bấm "GET A NEW RECORD"

Form Squeekchain hiện ghi `finish-product-322f7d.surf.computer not verified` — challenge đang **gắn cứng với hostname cũ**. Nút **"GET A NEW RECORD"** chỉ tạo **giá trị TXT mới** cho **cùng hostname cũ** → bấm bao nhiêu lần cũng vẫn không thêm được vào DNS (vì `surf.computer` không thuộc quyền bạn).

➡️ Bắt buộc: **đổi địa chỉ website của dự án trong Squeekchain sang `https://squeek.life`** (tìm mục sửa dự án / Edit project / Website URL). Nếu không có chỗ sửa → gửi lại / đăng ký lại dự án với địa chỉ mới. Khi đó họ mới cấp bản ghi `_squeekchain.squeek.life`.

### Sau khi xác minh xong → làm lại phần Squeekchain

1. Vào form Squeekchain, **đăng ký dự án với địa chỉ mới** (`https://squeek.life` hoặc `https://play.squeek.life`).
2. Họ cấp **giá trị TXT mới** → thêm `TXT` `_squeekchain.squeek.life` (hoặc `_squeekchain.play.squeek.life`) trong **cùng màn hình Cloudflare** ở trên.
3. Thẻ `<meta name="squeekchain-project">` trên trang: ✅ **đã có sẵn** trong game.
4. Dòng trong repository: xem mục cuối file.

---

## ⛔ Vì sao bản ghi DNS trong ảnh đầu tiên KHÔNG dùng được

Bản ghi họ yêu cầu là:

- Name: `_squeekchain.finish-product-322f7d`
- Full name: `_squeekchain.finish-product-322f7d.surf.computer`
- Value: `squeekchain-verify=a9925ca09212422fbe5ee0a56a847bd9229e5b0bf1c2fe1b`

Vấn đề: bản ghi này phải nằm trong **vùng DNS của `surf.computer`**. Vùng đó do **nền tảng Surf quản lý**, không phải bạn:

```
NS của surf.computer:  ns-713.awsdns-25.net / ns-220.awsdns-27.com / …
                       ns-1031.awsdns-00.org / ns-1919.awsdns-47.co.uk   (AWS Route 53)
```

Bạn chỉ đang "thuê" một tên con (`finish-product-322f7d.surf.computer`) — người thuê tên con **không có quyền thêm bản ghi DNS** cho tên đó. Chỉ chủ vùng (Surf) mới thêm được. Kiểm tra thực tế: bản ghi TXT này hiện **không tồn tại**.

➡️ Kết luận: **với địa chỉ `*.surf.computer` thì mục số 2 không thể hoàn thành.** Cần một địa chỉ mà **bạn** quản lý DNS, rồi **thêm dự án lại với địa chỉ đó** để nhận một giá trị TXT **mới** (giá trị `a9925ca…` trong ảnh chỉ đúng cho miền surf.computer, đổi miền là đổi giá trị).

Lưu ý thêm: miền `*.imd.site` (nơi The Buildoooooor host dự án) cũng do imd.fun quản lý (Namecheap DNS) — cũng không tự thêm TXT cho bạn.

---

## 3 hướng xử lý

### Hướng A — Mua một domain riêng (chắc ăn nhất, ~1–5 $/năm cho năm đầu)
1. Mua domain ở Namecheap / Porkbun / Cloudflare (đuôi `.xyz`, `.top`, `.click` thường rẻ nhất).
2. Deploy web lên Vercel (xem `DEPLOY.md` trong repo) rồi **Add Domain** trong Vercel = domain vừa mua.
3. Vào trang quản lý DNS của nơi mua domain → **Add record** → điền TXT (bảng bên dưới).
4. Quay lại Squeekchain: **thêm dự án với địa chỉ domain mới** → họ hiện ra giá trị TXT **mới** → dán giá trị mới đó vào bản ghi TXT.
5. Bấm **Verify**.

### Hướng B — Miền miễn phí nhưng có toàn quyền DNS (deSEC)
1. Tạo tài khoản tại `desec.io` → nhận miền miễn phí dạng `tên-bạn.dedyn.io` (quản lý DNS đầy đủ, có TXT).
2. Trong Vercel → Add Domain → nhập `tên-bạn.dedyn.io` → Vercel cho bạn 1 bản ghi để trỏ về (CNAME/A) → dán vào deSEC.
3. Thêm bản ghi TXT `_squeekchain` với giá trị mới từ Squeekchain.
4. Verify.

### Hướng C — Hỏi đội Squeekchain
Nếu bạn **không muốn mua domain**: hỏi họ (Discord/Telegram/X của Squeekchain) xem có cách xác minh thay thế không — ví dụ chỉ bằng repository GitHub công khai, hoặc bằng địa chỉ miền họ cấp. Họ đã yêu cầu "một dòng trong repository", nên rất có thể có luồng chỉ dùng repo.

---

## Cách thêm bản ghi TXT (khi đã có domain)

| Trường | Giá trị |
|--------|---------|
| Type | `TXT` |
| Name / Host | `_squeekchain` + tên miền, tuỳ nhà cung cấp: <br>• Đa số (Cloudflare, Porkbun…): chỉ điền `_squeekchain` <br>• Một số nơi hỏi tên đầy đủ: `_squeekchain.ten-mien-cua-ban.com` |
| Value / Content | giá trị Squeekchain cấp cho domain đó (dạng `squeekchain-verify=…`) |
| TTL | Auto / 3600 |

Sau khi lưu: chờ **1–5 phút** (đôi khi tới 30 phút). Kiểm tra bằng lệnh trong Terminal trên máy bạn:

```bash
dig TXT _squeekchain.ten-mien-cua-ban.com +short
```

Thấy dòng `"squeekchain-verify=…"` là xong → bấm **Verify** trên trang Squeekchain.

---

## Mục số 3 — repository

Cần: **đẩy toàn bộ mã nguồn lên GitHub trước** (repo `vinhphamdev/squeek-life` hiện mới chỉ có `README.md`), rồi thêm dòng xác minh mà Squeekchain cấp.

- Đẩy source: nháy đúp `push-to-github.command` (macOS) → dán link repo → `y` để ghi đè. Hướng dẫn chi tiết: `GITHUB.md`.
- Sau đó chụp lại phần **dưới** của form xác minh (phần bị cắt trong ảnh) để biết dòng cần thêm — sẽ bổ sung vào đây.

---

## Trạng thái kiểm tra gần nhất (tra DNS lúc 15:30)

| Kiểm tra | Kết quả |
|----------|---------|
| `squeek.life` A | `216.150.16.193`, `216.150.16.1` → vẫn là **trang Wix**, chưa trỏ về Studio |
| `_surf-studio-verify.squeek.life` TXT | chưa có |
| `_squeekchain.squeek.life` TXT | chưa có |
| `_squeekchain.play.squeek.life` TXT | chưa có |
| Thẻ `squeekchain-project` trên trang `squeek.life` | chưa có (vì đang là trang Wix, không phải game) |

➡️ Nghĩa là chưa có bản ghi nào được thêm — cần làm theo thứ tự: **Studio (Save domain) → Cloudflare (2 bản ghi) → Studio Refresh → đổi địa chỉ dự án ở Squeekchain → thêm TXT mới → Verify**.

## Deadline
Trang Squeekchain ghi: bản ghi phải được xác minh **trước Nov 12, 3:25 PM**. Bản ghi cần giữ lâu dài (họ kiểm tra lại mỗi ngày).
