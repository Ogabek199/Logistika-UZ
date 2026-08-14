#!/bin/sh
# set -e OLIB TASHLANDI: baza yetib bo'lmasa ham API ishga tushib, health-check o'tsin.

echo "==> Baza sxemasini sinxronlash (prisma db push)..."
if npx prisma db push --skip-generate; then
  echo "==> Baza sinxron qilindi."
else
  echo "⚠️  prisma db push MUVAFFAQIYATSIZ — API baribir ishga tushiriladi (log'ni tekshiring)."
fi

echo "==> API ishga tushmoqda..."
exec "$@"
