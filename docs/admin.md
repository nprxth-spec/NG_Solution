# Admin consoles

## Unified admin (`/admin`)

- **Login:** `/admin/login` — username/password จาก `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- **Session:** cookie `admin_session` เป็น token ที่ลงนามด้วย HMAC โดยใช้ `ADMIN_SESSION_TOKEN` เป็นความลับ (ไม่ใช่ค่า cookie ตรง ๆ) — แต่ละครั้งล็อกอินได้ token ใหม่
- **Rate limit:** `POST /api/admin/login` จำกัดจำนวนครั้งต่อ IP (สูงสุด ~10 ครั้ง / 15 นาที — ใช้ Upstash Redis ถ้ามี `UPSTASH_*` env)
- **Edge:** การตรวจ session ใช้ `src/proxy.ts` (Next 16) — ไม่ใช้ `node:crypto` ใน `admin-session`
- **API ที่ป้องกัน:** `/api/admin/*` ตรวจ cookie ด้วย `verifyAdminSessionCookie`

## FilesGo admin APIs (`/api/files-go/admin/*`)

- ใช้ cookie **`filesgo_admin`** + HMAC ใน `src/lib/admin-auth.ts` (คนละระบบกับ `/admin` ด้านบน)
- ล็อกอินผ่าน `/api/files-go/admin/login` (รหัส `ADMIN_PASSWORD`)
