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

API: `http://localhost:4000/api`

### 2) Web

```bash
cd web
npm install
npm run dev
```

Web: `http://localhost:3000`

## Demo login

| Rol | Login | Parol |
|-----|-------|-------|
| Admin | `admin` | `1234` |
| Haydovchi | `+998903333333` | `1478` |

## Stack

- NestJS, Prisma, JWT
- Next.js 16, Tailwind 4
- Dizayn: Syne + Manrope, ink/steel palette
