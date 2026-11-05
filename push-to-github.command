#!/bin/bash
# ============================================================================
#  Squeek Life — đẩy mã nguồn lên GitHub (dành cho macOS)
#
#  Cách dùng: NHÁY ĐÚP vào file này trong Finder (hoặc chuột phải → Open).
#  Nếu macOS chặn: chuột phải vào file → Open → Open.
# ============================================================================

cd "$(dirname "$0")" || exit 1
[ -n "${TERM:-}" ] && command -v clear >/dev/null 2>&1 && clear

echo "=========================================================="
echo "  SQUEEK LIFE  →  GitHub"
echo "=========================================================="
echo
echo "Thư mục sẽ được đẩy lên:"
echo "  $(pwd)"
echo

# --- Kiểm tra đúng thư mục --------------------------------------------------
if [ ! -d frontend ] || [ ! -d backend ]; then
  echo "❌ Không thấy thư mục frontend/ và backend/ ở đây."
  echo
  echo "Bạn đang chạy file này sai chỗ. Hãy chạy nó trong thư mục đã giải nén,"
  echo "thư mục mà bạn nhìn thấy frontend, backend, README.md nằm cạnh nhau."
  echo "(Nếu chỉ thấy 1 thư mục con, hãy mở vào trong đó rồi chạy lại.)"
  echo
  printf "Nhấn Enter để thoát..."
  read -r _
  exit 1
fi

# --- Kiểm tra git -----------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  echo "❌ Máy bạn chưa có git."
  echo "macOS sẽ hiện cửa sổ cài 'Command Line Tools' — bấm Install, đợi vài phút rồi chạy lại file này."
  xcode-select --install 2>/dev/null
  printf "Nhấn Enter để thoát..."
  read -r _
  exit 1
fi

# --- Hỏi link repo ----------------------------------------------------------
echo "Dán link repository GitHub của bạn rồi nhấn Enter."
echo "Ví dụ: https://github.com/vinhphamdev/squeek-life.git"
echo
printf "Link repo: "
read -r REPO
echo

if [ -z "$REPO" ]; then
  echo "❌ Bạn chưa dán link. Thoát."
  printf "Nhấn Enter để thoát..."
  read -r _
  exit 1
fi

# Thêm .git vào cuối nếu người dùng dán link web
case "$REPO" in
  *.git) ;;
  *) REPO="${REPO%/}.git" ;;
esac

# --- Chuẩn bị repo ----------------------------------------------------------
echo "→ Đang chuẩn bị..."
[ -d .git ] || git init -q

git config user.name  >/dev/null 2>&1 || git config user.name  "$(git config --global user.name  || echo 'Squeek Life')"
git config user.email >/dev/null 2>&1 || git config user.email "$(git config --global user.email || echo 'squeek@example.com')"

git add -A
if git diff --cached --quiet; then
  echo "→ Không có file mới để commit."
else
  COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
  echo "→ Đã gom $COUNT file để commit."
  git commit -q -m "Squeek Life — From Rags to Riches"
fi

git branch -M main

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

# --- Push -------------------------------------------------------------------
echo
echo "→ Đang đẩy lên GitHub (có thể sẽ hỏi đăng nhập)..."
echo "  Nếu GitHub hỏi mật khẩu: mật khẩu tài khoản KHÔNG dùng được nữa."
echo "  Hãy tạo Personal Access Token (Settings → Developer settings →"
echo "  Personal access tokens → Fine-grained tokens, quyền Contents: Read and write)"
echo "  rồi dán token vào chỗ mật khẩu."
echo

if git push -u origin main; then
  echo
  echo "✅ Xong! Mã nguồn đã lên GitHub."
else
  echo
  echo "⚠️  Lần đẩy đầu bị từ chối — thường vì repo đã có sẵn file (ví dụ README)."
  echo "    Ghi đè bằng nội dung trong thư mục này sẽ AN TOÀN: thư mục này đã có"
  echo "    đầy đủ mọi file, kể cả README.md."
  echo
  printf "Gõ y rồi Enter để ghi đè (force push): "
  read -r ANSWER
  if [ "$ANSWER" = "y" ] || [ "$ANSWER" = "Y" ]; then
    if git push -u origin main --force; then
      echo
      echo "✅ Xong! Mã nguồn đã lên GitHub."
    else
      echo
      echo "❌ Vẫn chưa đẩy được. Kiểm tra: link repo đúng chưa, đã đăng nhập GitHub chưa,"
      echo "   và token đã có quyền 'Contents: Read and write' chưa."
    fi
  else
    echo "→ Đã bỏ qua. Không có gì thay đổi trên GitHub."
  fi
fi

echo
echo "Mở repo để kiểm tra: ${REPO%.git}"
echo "(Phải thấy frontend/, backend/, README.md, GITHUB.md, package.json)"
echo
printf "Nhấn Enter để đóng cửa sổ này..."
read -r _
