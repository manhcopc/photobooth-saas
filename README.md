# Photobooth SaaS (React + Vite)

Ứng dụng photobooth theo sự kiện, chạy user flow qua `/e/:slug` và admin qua `/admin/*`, tích hợp Supabase Auth + Database + Storage.

## 1) Cài đặt project

```bash
npm install
```

## 2) Chạy local

```bash
npm run dev
```

Mặc định Vite chạy ở `http://localhost:5173`.

## 3) Cấu hình `.env`

Tạo file `.env` (hoặc cấu hình biến môi trường trên nền tảng deploy):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_APP_URL=
```

Lưu ý:
- Không hard-code Supabase key trong source code.
- Không dùng `service_role` key ở frontend.
- `VITE_PUBLIC_APP_URL` dùng để tạo link QR/event production (ví dụ `https://your-domain.com`).
- Nếu thiếu `VITE_PUBLIC_APP_URL`, app sẽ fallback sang `window.location.origin`.

## 4) Build production

```bash
npm run build
```

Preview bản build local:

```bash
npm run preview
```

## 5) Deploy Vercel

Project đã có `vercel.json` rewrite về `index.html` để refresh trực tiếp các route SPA không bị 404:
- `/e/:slug`
- `/admin/login`
- `/admin`
- `/admin/events`
- `/admin/events/:id`
- `/admin/events/:id/gallery`

Checklist nhanh trên Vercel:
1. Import repo lên Vercel.
2. Set 3 env vars (ở Project Settings → Environment Variables).
3. Deploy.
4. Verify các route ở trên bằng cách truy cập trực tiếp và refresh.

## 6) Deploy Netlify (tuỳ chọn)

Project đã có `public/_redirects` để rewrite SPA route:

```txt
/*    /index.html   200
```

Checklist nhanh trên Netlify:
1. Import repo lên Netlify.
2. Set env vars giống mục `.env`.
3. Deploy.
4. Verify direct refresh route `/e/:slug` và `/admin/events`.

## 7) Supabase requirements

### Bảng cần có
- `events`
- `final_outputs`

Tham khảo migration SQL trong thư mục `supabase/`.

### Buckets cần có
- `photobooth-frames`
- `photobooth-final-images`

### RLS / Policies
- Cần bật và cấu hình đúng cho đọc/ghi theo đúng flow admin + user.
- Test kỹ insert/select vào `events` và `final_outputs`, upload/download từ 2 buckets.

## 8) HTTPS note (camera)

Camera trên web yêu cầu **secure context**:
- Production: cần HTTPS (Vercel/Netlify đều có HTTPS mặc định).
- Local dev: `localhost` vẫn dùng được để test camera.

Nếu không có HTTPS ở domain production, camera có thể không mở được.

## 9) Checklist test mobile

Xem file chi tiết: `docs/PRODUCTION_CHECKLIST.md`.

Các điểm quan trọng:
- Scan QR mở đúng `/e/:slug` trên điện thoại.
- Cấp quyền camera, chụp đủ flow.
- Upload final image lên Supabase thành công.
- Gallery hiển thị cloud-first, fallback local khi offline.
- Test retry queue khi mất mạng rồi online lại.
