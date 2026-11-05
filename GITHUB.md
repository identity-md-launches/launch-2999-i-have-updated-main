# Đẩy Squeek Life lên GitHub (rồi import vào imd.fun nếu muốn)

Mục tiêu đơn giản nhất: **đưa toàn bộ mã nguồn lên GitHub ở chế độ Public**. Chọn **một trong
bốn cách** ở Bước 2 — cách nào cũng ra cùng kết quả. Không quen gõ lệnh thì dùng **Cách A**.

---

## Bước 0 — Giải nén cho đúng

Giải nén `squeek-life-source.zip` ra một thư mục (ví dụ `Downloads/squeek-life`). Mở thư mục đó,
bạn **phải** thấy đúng những thứ này nằm cạnh nhau:

```
README.md   GITHUB.md   DEPLOY.md
push-to-github.command   push-to-github.sh   .gitignore   .github/   frontend/   backend/
```

- Nếu chỉ thấy **một thư mục con** (ví dụ `squeek-life-source/`) → mở tiếp vào trong đó.
- ⚠️ **Đừng** chọn thư mục `frontend` hay `backend` làm repo — repo phải là thư mục cha chứa cả hai.
- Trên macOS, file bắt đầu bằng dấu chấm (`.gitignore`, `.github`) bị Finder ẩn đi. Bấm
  **⌘ + Shift + .** để hiện chúng.

## Bước 1 — Tạo repository trên GitHub

1. Mở https://github.com/new (đăng nhập trước nếu chưa).
2. **Repository name**: `squeek-life`
3. Chọn **Public**.
4. **KHÔNG** tick "Add a README file", "Add .gitignore", "Choose a license" — nếu repo đã có file
   sẵn thì lần đẩy đầu sẽ bị từ chối (xem mục *"Chỉ thấy README.md"* ở cuối).
5. Bấm **Create repository**.

---

## Bước 2 — Đẩy code lên (chọn 1 trong 4)

### Cách A — macOS: nháy đúp `push-to-github.command` (dễ nhất, không gõ lệnh)

1. Trong Finder, mở thư mục ở Bước 0 (thư mục có `frontend`, `backend`, `README.md`).
2. **Nháy đúp** vào file **`push-to-github.command`** → cửa sổ Terminal mở ra.
   - Nếu macOS báo *"cannot be opened because it is from an unidentified developer"* →
     **chuột phải vào file → Open → Open**.
3. Dán link repo khi được hỏi: `https://github.com/vinhphamdev/squeek-life.git` → Enter.
4. Script tự kiểm tra đúng thư mục, tự commit và đẩy lên. Nếu repo đã có sẵn file, nó sẽ hỏi có
   ghi đè không — gõ `y` rồi Enter (ghi đè an toàn: thư mục này đã có đủ mọi file, kể cả `README.md`).
5. Kết thúc, mở `https://github.com/<tên-bạn>/squeek-life` kiểm tra.

### Cách B — macOS/Linux: dán lệnh vào Terminal

Mở **Terminal** (Applications → Utilities → Terminal), rồi:

```bash
cd ~/Downloads/squeek-life          # ← gõ "cd " rồi KÉO THẢ thư mục từ Finder vào Terminal để lấy đúng đường dẫn
git init
git add -A
git commit -m "Squeek Life — From Rags to Riches"
git branch -M main
git remote add origin https://github.com/vinhphamdev/squeek-life.git
git push -u origin main
```

- Lần đầu chạy `git`, macOS có thể hiện cửa sổ **"Install Command Line Tools"** → bấm **Install**,
  đợi vài phút rồi chạy lại.
- Nếu push bị **`! [rejected] main -> main (fetch first)`** → repo đã có sẵn file, chạy thêm:
  `git push -u origin main --force`
- Khi GitHub hỏi mật khẩu: **mật khẩu tài khoản không dùng được**. Tạo **Personal Access Token**:
  GitHub → ảnh đại diện → *Settings → Developer settings → Personal access tokens →
  Fine-grained tokens → Generate new token*, cấp quyền **Contents: Read and write** cho repo
  `squeek-life`, rồi dán token vào chỗ mật khẩu (username = tên đăng nhập GitHub).

### Cách C — GitHub Desktop (giao diện, có bản macOS)

1. Tải và cài: https://desktop.github.com → mở app → **Sign in to GitHub.com**.
2. **File → Clone repository → tab URL** → dán `https://github.com/vinhphamdev/squeek-life` →
   **Clone** (chọn nơi lưu, ví dụ `~/Documents/GitHub/squeek-life`).
3. Mở thư mục vừa clone bằng Finder, rồi **copy toàn bộ file** từ thư mục đã giải nén (Bước 0)
   dán vào đó. Khi macOS hỏi file trùng (`README.md`) → chọn **Replace**.
4. Quay lại GitHub Desktop: ô **Summary** gõ `Squeek Life — From Rags to Riches` → **Commit to main**
   → nút **Push origin** ở thanh trên.
5. Kiểm tra repo trên web.

> Đừng dùng **"Publish repository"** trong trường hợp này — nó tạo một repo *mới*, trong khi bạn
> đã có repo trên GitHub rồi.

### Cách D — Kéo thả trên web GitHub (không cài gì)

1. Ở trang repo, bấm **Add file → Upload files**.
2. Trong Finder, mở thư mục ở Bước 0 rồi **kéo thả** các mục vào khung: **`frontend`** (cả thư mục)
   → **Commit changes**; lặp lại với **`backend`**, **`scripts`**, và các file lẻ
   `push-to-github.sh`, `push-to-github.command`, `GITHUB.md`, `DEPLOY.md`.
3. ⚠️ **Hai điểm phải biết:**
   - Kéo thả **bỏ qua file ẩn**, nên `.gitignore` và `.github/` sẽ bị thiếu. Bấm
     **Add file → Create new file**, đặt tên `.gitignore` (gõ đúng cả dấu chấm), dán nội dung:

     ```
     node_modules/
     dist/
     .vite/
     *.tsbuildinfo
     .env
     .env.local
     *.zip
     ```

     Bấm **Commit changes**. (Thiếu `.github/` không sao — chỉ là workflow kiểm tra tự động.)
   - Web giới hạn **100 file mỗi lần**; thư mục `frontend` có khoảng 82 file nên vừa, nhưng nếu bị
     báo giới hạn thì kéo thả thêm lần nữa cho phần còn lại.

---

## Bước 3 (tuỳ chọn) — Import vào imd.fun

Chỉ làm khi bạn muốn có website chạy được. Mở
https://explorer.imd.fun/launch?make=build-website → **Import from GitHub** → dán link repo →
nếu trang hỏi cấu hình build, điền:

| Mục | Giá trị |
| --- | --- |
| Root directory | `frontend` |
| Install command | `bun install` (không có Bun thì `npm install`) |
| Build command | `bun run build:client` |
| Output directory | `dist/client` |
| Environment | `BASE_PATH=/` |

**Sau khi deploy:** trang mở ra hiện màn hình **SQUEEK LIFE**; bấm **New game** là chơi được
(nhạc chỉ chạy sau cú click đầu tiên — bình thường). Riêng bảng **Squeekchain** và **Ranks** có
thể hiện "offline" vì host tĩnh không chạy được backend (backend cần tiến trình Node chạy liên
tục + Postgres + `SURF_API_KEY`) — xem `DEPLOY.md` nếu muốn bật chúng.

---

## Kiểm tra sau khi đẩy lên

Mở `https://github.com/<tên-bạn>/squeek-life`, bạn phải thấy:

- Thư mục **`frontend`** và **`backend`** (bấm vào được, có file bên trong).
- Các file `README.md`, `GITHUB.md`, `DEPLOY.md`, `push-to-github.sh`, `push-to-github.command`.
- **Không** thấy `node_modules/`, `dist/`, hay file `.env` nào.

---

## "Chỉ thấy README.md, không thấy frontend và backend"

Đây là lỗi phổ biến nhất, và **file trên máy bạn vẫn còn nguyên** — chỉ có lần đẩy vừa rồi chưa
đưa các thư mục lên. Nguyên nhân thường gặp:

| Nguyên nhân | Cách sửa |
| --- | --- |
| Chỉ kéo thả vài file lẻ lên web (không kéo cả thư mục) | Làm **Cách D**: kéo thả **cả thư mục** `frontend`, rồi `backend`. |
| Repo được tạo kèm README, sau đó chưa commit/push phần còn lại | Làm **Cách A** hoặc **Cách B** với `git push -u origin main --force`. |
| Chạy lệnh ở sai thư mục (đang đứng trong `frontend/`) | `cd` ra thư mục cha (thư mục có `frontend` **và** `backend`), rồi chạy lại. |
| GitHub Desktop báo "create a repository" nhưng chưa bấm **Commit to main** | Commit rồi **Push origin**. |

Sau khi sửa, kiểm tra lại bằng đúng danh sách ở mục *"Kiểm tra sau khi đẩy lên"*.

---

## Lỗi thường gặp khác

| Thông báo | Nguyên nhân & cách xử |
| --- | --- |
| `remote: Repository not found` | Sai link, repo đang **Private**, hoặc đăng nhập sai tài khoản. |
| `! [rejected] main -> main (fetch first)` | Repo không trống. Chạy `git push -u origin main --force` (an toàn vì thư mục của bạn có đủ file). |
| `src refspec main does not match any` | Chưa commit. Chạy `git add -A` rồi `git commit -m "Squeek Life"` trước khi push. |
| `Support for password authentication was removed` | Dùng **Personal Access Token** thay mật khẩu (xem Cách B). |
| `fatal: not a git repository` | Đang đứng sai thư mục — `cd` vào thư mục ở Bước 0. |
| macOS: `cannot be opened because it is from an unidentified developer` | Chuột phải vào `push-to-github.command` → **Open** → **Open**. |
| macOS: `xcrun: error: invalid active developer path` | Chạy `xcode-select --install` rồi thử lại. |
| imd.fun báo không đọc được repo | Repo đang Private → *Settings → General → Danger Zone → Change visibility → Public*. |
| Build trên host báo `vite: command not found` | Host chưa cài thư viện cho `frontend/`. Đặt **Root directory = `frontend`** để host tự chạy `bun install` ở đó. |

---

## Trong repo có gì

| Đường dẫn | Nội dung |
| --- | --- |
| `frontend/` | Toàn bộ game: `src/game/` (engine, world, sprites, data, music), `src/components/game/` (HUD, panel, modal), `src/lib/` (api, progress, wallet, share). |
| `backend/` | Express + Surf SDK: `/api/progress`, `/api/leaderboard`, `/api/squeekchain`. |
| `README.md` | Giới thiệu dự án, tính năng, cách chạy, cách deploy (tiếng Anh). |
| `DEPLOY.md` | Ba phương án deploy chi tiết, gồm cách chạy backend. |
| `push-to-github.command` | macOS: nháy đúp để đẩy code lên GitHub. |
| `push-to-github.sh` | Terminal (macOS/Linux/Git Bash): đẩy code bằng một lệnh. |
| `.github/workflows/ci.yml` | GitHub tự kiểm tra type + build mỗi lần push. |
