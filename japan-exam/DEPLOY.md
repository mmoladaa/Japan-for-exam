# วิธี Deploy ขึ้น Vercel

## วิธีที่ 1 — ง่ายที่สุด (แนะนำ)

1. ไปที่ [vercel.com](https://vercel.com) → Sign in ด้วย GitHub
2. กด **"Add New Project"**
3. กด **"Import Third-Party Git Repository"** หรือลาก folder `japan-exam` ขึ้น
4. กด **Deploy** — Vercel จัดการให้อัตโนมัติ ✅

## วิธีที่ 2 — Vercel CLI

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# เข้าไปใน folder
cd japan-exam

# Deploy
vercel
```

## รัน Local

```bash
cd japan-exam
yarn install   # หรือ npm install
yarn dev       # หรือ npm run dev
```

จากนั้นเปิด http://localhost:3000

## เนื้อหา

- บทที่ 1: แนะนำตัว, อาชีพ, สัญชาติ (23 คำ)
- บทที่ 2: สิ่งของรอบตัว, this/that (37 คำ)
- บทที่ 3: สถานที่, ทิศทาง, ราคา (37 คำ)
- **รวม 97 คำศัพท์** พร้อมระบบ SRS

## Features

- 🃏 Flashcard + SRS (Spaced Repetition)
- ✏️ Quiz: เลือกตอบ, เติมคำ, สำนวน, ตัวเลข
- 📊 Progress Tracker รายบท
