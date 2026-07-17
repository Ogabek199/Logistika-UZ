# Logistika UZ

Haydovchi hujjatlari, qarz va muddatlarni boshqarish tizimi.

## Struktura

```
Logistika-UZ/
  backend/   NestJS + Prisma + SQLite (local) / PostgreSQL (prod)
  web/       Next.js + Tailwind
```

## Ishga tushirish

### 1) Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

### 2) Web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` da `JWT_SECRET` backend bilan bir xil bo‘lishi kerak (middleware JWT tekshiradi).

## Demo login

| Rol | Login | Parol |
|-----|-------|-------|
| Admin | `admin` | `1234` |
| Haydovchi | `+998903333333` | `1478` |