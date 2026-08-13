# ============================================================
#  MUSFIRA SAVDO TRANS — backend (NestJS + Prisma + LibreOffice)
#  AWS Lightsail Container Service uchun. Platforma: linux/amd64
# ============================================================

# ---- 1-bosqich: build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- 2-bosqich: runtime ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
# LibreOffice o'z profilini yozishi uchun writable HOME kerak
ENV HOME=/tmp
# Kodda LIBREOFFICE_PATH birinchi tekshiriladi
ENV LIBREOFFICE_PATH=/usr/bin/soffice

# LibreOffice (docx -> pdf) + shriftlar (kiril/lotin) + Prisma uchun openssl
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer \
      fonts-dejavu fonts-liberation fonts-noto-core \
      openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/templates ./templates
COPY --from=build /app/assets ./assets
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]
