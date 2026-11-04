# Squeek Life — hướng dẫn deploy

Gói zip này chứa toàn bộ mã nguồn của game **Squeek Life — From Rags to Riches**.

## Trong gói có gì

| Thư mục | Nội dung |
| --- | --- |
| `frontend/` | Game (Vite + React + Tailwind). Toàn bộ logic game nằm ở `frontend/src/game/` (bản đồ, nhân vật, kinh tế, nhạc), giao diện ở `frontend/src/components/game/`. |
| `backend/` | API Express: `/api/progress` (lưu tiến trình + thành tích), `/api/leaderboard`, `/api/squeekchain` (proxy dữ liệu onchain thật). |
| `frontend/vercel.json` | Cấu hình sẵn để deploy frontend lên Vercel. |
| `CLAUDE.md` | Quy ước của scaffold gốc (không bắt buộc khi deploy). |

## 1. Chạy thử trên máy

```bash
# Backend (cần SURF_API_KEY của nền tảng Surf)
cd backend && bun install
SURF_API_KEY=... BACKEND_PORT=3001 bun run dev

# Frontend (mở tab khác)
cd frontend && bun install
PORT=5173 BACKEND_PORT=3001 BASE_PATH=/ bun run dev
# → http://localhost:5173
```

Yêu cầu: Node 20+ hoặc Bun. `BASE_PATH=/` nghĩa là chạy ở gốc tên miền; khi dev trong sandbox thì để mặc định.

## 2. Deploy frontend lên Vercel

1. Đưa thư mục này lên GitHub (hoặc chạy `vercel` CLI ngay trong thư mục `frontend/`).
2. Trên Vercel: **New Project → chọn repo → Root Directory = `frontend`**.
3. Framework preset: **Vite** (build command + output đã khai báo sẵn trong `frontend/vercel.json`).
4. Environment Variables cần thêm:

   | Biến | Giá trị | Vì sao |
   | --- | --- | --- |
   | `BASE_PATH` | `/` | Build ở gốc tên miền, đường dẫn asset/API thành tuyệt đối. |
   | `BACKEND_PORT` | `3001` | Chỉ để script kiểm tra env của scaffold chạy qua; bản build client không dùng giá trị này. |

5. Mở `frontend/vercel.json`, sửa dòng proxy `/api/*` thành địa chỉ backend thật của bạn (xem mục 3). Mặc định mình để sẵn địa chỉ bản publish trên nền tảng Surf.

## 3. Backend chạy ở đâu?

Backend được viết trên `@surf-ai/sdk/server` (`createServer().start()`): SDK này **tự cấp Postgres, tự đồng bộ bảng Drizzle khi khởi động** và tự gắn mọi file trong `backend/routes/` vào `/api/<tên file>`. Vì vậy backend **không chạy trực tiếp trong Vercel Functions** — serverless không có tiến trình khởi động lâu dài, và SDK cần `SURF_API_KEY` cùng database do nền tảng Surf cấp.

Ba lựa chọn thực tế:

- **A. Giữ backend trên nền tảng Surf** (app đã publish) và để Vercel proxy `/api/*` sang đó — dễ nhất, `frontend/vercel.json` đã cấu hình mẫu.
- **B. Chạy backend trên host Node thường** (Render / Railway / Fly.io / VPS):

  ```bash
  cd backend && bun install
  SURF_API_KEY=... BACKEND_PORT=8080 bun run dev   # hoặc node server.js
  ```

  Rồi trỏ rewrite `/api/*` của Vercel sang `https://<host-backend-cua-ban>/api/*`.
- **C. Viết lại backend để nối trực tiếp Postgres của bạn** (bỏ `@surf-ai/sdk/db`, thay `dbQuery` bằng driver `pg`) — cần sửa code, nhắn mình nếu bạn muốn hướng này.

## 4. Biến môi trường

| Biến | Dùng ở | Ghi chú |
| --- | --- | --- |
| `SURF_API_KEY` | backend | Bắt buộc. Khoá truy cập nền tảng Surf (DB + API). |
| `BACKEND_PORT` | backend, script build frontend | Cổng backend. |
| `PORT` | frontend dev | Cổng dev server. |
| `BASE_PATH` | frontend build | `/` khi deploy ở tên miền gốc. |

## 5. Ghi chú khi vận hành

- Tiến trình người chơi lưu ở Postgres (bảng `players`, `achievements`). Đổi backend = đổi database, bảng xếp hạng sẽ bắt đầu lại từ đầu.
- Dữ liệu Squeekchain (bánh xe, SQK, block, hoạt động onchain) được backend gọi live từ `https://api.squeekchain.com/v1/...` và cache ngắn hạn; khi chain nghỉ thì UI hiện trạng thái nghỉ chứ không hiện số giả.
- Game chỉ dùng một trang duy nhất nên không cần rewrite SPA. Nếu bạn thêm route phía client, thêm rewrite `{"source": "/(.*)", "destination": "/index.html"}`.
- Ví chỉ dùng để liên kết địa chỉ với tiến trình (read-only, không ký giao dịch). Coins là điểm trong game, không phải token SQK.
