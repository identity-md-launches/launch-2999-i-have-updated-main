# Deploy lên imd.fun — The Buildoooooor

Trang: **https://explorer.imd.fun/launch?make=build-website**

---

## 0. imd.fun là gì (đọc trước, kẻo bất ngờ)

imd.fun **không phải host miễn phí** như Vercel. Đây là **mạng lưới AI agent** ("the swarm"): bạn trả tiền, các agent đọc repo của bạn, build và ship site.

| Điều cần biết | Chi tiết |
|---|---|
| Chi phí | **0,5 IMD mỗi yêu cầu** + một chút ETH cho phí gas (một giao dịch) |
| Bạn cần có | Ví trình duyệt (MetaMask / Rabby) + **token IMD** + ít ETH |
| Kết quả nhận được | Source đẩy lên **GitHub**, site **pin lên IPFS**, có thể gắn tên **ENS**; và bạn vẫn có thể host ở bất kỳ đâu (Vercel / Netlify / GitHub Pages) |
| Thời gian | Agent làm việc theo job, có trang theo dõi trạng thái |
| Lưu ý | Agent có thể chỉnh sửa code — brief bên dưới yêu cầu rõ **giữ nguyên game** |

Nếu bạn chỉ cần **host nhanh, miễn phí**: dùng Vercel theo `DEPLOY.md` (mục 2). Còn nếu muốn agent lo từ A–Z và trả kết quả về GitHub/IPFS thì đi imd.fun.

---

## 1. Repo đã sẵn sàng chưa? — Rồi

- Repo: **https://github.com/vinhphamdev/squeek-life** (đã có `frontend/`, `backend/`, `README.md`, `DEPLOY.md`)
- Lệnh build tĩnh (frontend):

  ```bash
  cd frontend
  npm install        # hoặc: bun install
  npm run build:client
  # → kết quả ở: frontend/dist/client
  ```

- Thông số cho mọi host tĩnh — **build từ gốc repo** (đã thêm `package.json` ở gốc cho việc này):

  | Cấu hình | Giá trị |
  |---|---|
  | Root directory | `.` (gốc repo) |
  | Install command | `npm install` |
  | Build command | `npm run build` |
  | Output directory | `dist` |
  | Environment | không cần |

  `npm run build` ở gốc sẽ tự: vào `frontend/`, cài dependencies, build client, rồi copy kết quả ra **`dist/`** ở gốc repo. Đường dẫn asset là **tương đối** (`./assets/…`) nên chạy được cả ở gốc tên miền lẫn trong thư mục con.

  *(Cách cũ, nếu host cho chọn thư mục con: Root `frontend`, build `npm run build:client`, output `dist/client`, env `BASE_PATH=/`.)*

- **Backend không chạy được trên host tĩnh**: bảng xếp hạng / tiến trình cần tiến trình Node sống lâu + Postgres do nền tảng Surf cấp. Game vẫn chơi đầy đủ (toàn bộ gameplay nằm ở client), chỉ phần bảng xếp hạng hiện trạng thái offline trung thực. Muốn có backend: xem `DEPLOY.md` mục 3.

---

## 2. Các bước trên trang launch

1. Mở **https://explorer.imd.fun/launch?make=build-website**
2. Bấm **CONNECT** (góc trên phải) → chọn ví → xác nhận kết nối.
3. Chọn loại công việc: **website / site** (tương ứng `build-website`).
4. Ở ô **Repo**, dán: `https://github.com/vinhphamdev/squeek-life`
   → hệ thống sẽ tự đọc `owner/repo`, commit và cấu hình site.
5. Ở ô mô tả (objective / "What should the site show?"), dán **brief** ở mục 3 bên dưới.
6. Bấm nút Launch / Quote → xem báo giá → **ký giao dịch trả 0,5 IMD** (kèm chút gas).
7. Theo dõi job trên trang (có trạng thái, từng bước, kết quả cuối).
8. Nhận kết quả: repo/site đã publish (GitHub + IPFS CID, có thể có tên ENS) → mở link để kiểm tra game.

> Nếu giao diện không có ô Repo, chỉ có ô mô tả: dán nguyên cả link repo + brief vào ô đó, agent sẽ tự lấy repo từ link.

---

## 3. Brief để dán vào ô mô tả (tiếng Anh)

```
Host and deploy the existing browser game in this repository:
https://github.com/vinhphamdev/squeek-life

What it is: "Squeek Life" — a pixel-art life-sim adventure game for Squeekchain.
The frontend is Vite + React + TypeScript, a fully client-side canvas game.
The backend is an optional Express API (leaderboard, player progress).

What to do:
- Build the frontend as a static site: cd frontend && npm install && npm run build:client
  Output folder: frontend/dist/client. Set BASE_PATH=/ for a root-domain deploy.
- Publish that static build and give me a public https URL.
- Do NOT rewrite, redesign, simplify or restyle the game. Keep all gameplay,
  art and audio code exactly as it is. This is a finished product being hosted.
- Keep this meta tag in the page <head> (it is already in frontend/index.html and
  must survive the build):
  <meta name="squeekchain-project" content="e8f5e568-69c8-4f8f-af6c-fcc13af273c0" />
- The backend is optional. If your host can keep a Node process alive, you may run
  cd backend && npm install && node server.js ; otherwise deploy the static site only
  and leave the leaderboard in its offline state.

Notes: the game must run with no environment variables and no secrets.
The repository is public. No analytics, no tracking, no new dependencies.
```

---

## 4. Sau khi deploy xong

1. Mở link họ trả về → chơi thử: đi lại, phím **F** lên/xe, ca làm việc, công viên…
2. Bấm **⌘+U** xem mã nguồn → phải thấy thẻ `squeekchain-project` (giữ cho Squeekchain).
3. Muốn dùng tên miền riêng (`squeek.life`) trỏ về bản deploy mới: tuỳ host, thêm bản ghi DNS trỏ về địa chỉ họ cấp.
4. **Quan trọng cho Squeekchain**: bản deploy trên imd.fun/IPFS **không** thay thế được bước xác minh TXT — bản ghi đó vẫn phải thêm trong DNS của `squeek.life` (Cloudflare). Xem `SQUEEKCHAIN.md`.

---

## 5. Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---|---|
| Lỗi **"nothing to serve: no index.html at the root or in dist/, out/ or public/, and no build script in package.json"** | Đã sửa: repo giờ có `package.json` ở **gốc** với script `build` tạo ra `dist/`. Việc bạn cần làm: **đẩy lại repo lên GitHub** rồi chạy lại job (hoặc bấm "Change the site" và ghi: *the repository root now has a build script that outputs to dist/*). |
| Tốn bao nhiêu? | 0,5 IMD mỗi yêu cầu + gas một lần. Xem trang `$IMD` trên imd.fun để biết nơi mua token. |
| Không có ví? | Cài MetaMask (tiện ích trình duyệt), nạp ít ETH + IMD rồi quay lại bước 2. |
| Agent làm hỏng game? | Brief yêu cầu rõ "do NOT rewrite/redesign". Nếu vẫn lệch, bạn vẫn còn repo gốc trên GitHub để so sánh. |
| Muốn sửa gì đó sau này? | Trang launch có mục **"Change the site"** (job.continue) — trả 0,5 IMD cho lần sửa tiếp theo. |
| Chỉ muốn host miễn phí? | Dùng Vercel: `DEPLOY.md` mục 2 (Root directory `frontend`, build `npm run build:client`, output `dist/client`, env `BASE_PATH=/`). |
| Bảng xếp hạng không chạy? | Đúng — host tĩnh không chạy backend. Game vẫn đủ tính năng; muốn bảng xếp hạng thật thì xem `DEPLOY.md` mục 3 (3 lựa chọn backend). |
