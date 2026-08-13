# OOO "MUSFIRA SAVDO TRANS"

Haydovchi hujjatlari, qarz va muddatlarni boshqarish tizimi.

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