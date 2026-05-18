# Production Checklist

## A. Trước khi deploy

- [ ] `npm install`
- [ ] `npm run build`
- [ ] Kiểm tra biến môi trường:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_PUBLIC_APP_URL`
- [ ] Kiểm tra Supabase tables:
  - [ ] `events`
  - [ ] `final_outputs`
- [ ] Kiểm tra Supabase buckets:
  - [ ] `photobooth-frames`
  - [ ] `photobooth-final-images`
- [ ] Kiểm tra RLS/policies cho database + storage

## B. Sau khi deploy

- [ ] Mở `/admin/login`
- [ ] Đăng nhập admin
- [ ] Tạo event mới
- [ ] Upload frame cho event
- [ ] Copy event link
- [ ] Tải QR PNG
- [ ] Mở link/QR bằng điện thoại
- [ ] Cấp quyền camera
- [ ] Chụp 6 ảnh
- [ ] Chọn 3 ảnh
- [ ] Tạo final image
- [ ] Verify upload lên Supabase Storage
- [ ] Verify insert metadata vào `final_outputs`
- [ ] Kiểm tra gallery trên laptop
- [ ] Test mất mạng và verify queue retry khi online lại

## C. Test thiết bị

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Laptop Chrome
- [ ] Laptop Edge/Safari (nếu có)

## D. Test lỗi

- [ ] Từ chối camera
- [ ] Không có camera
- [ ] Mạng yếu/chập chờn
- [ ] Reload giữa flow
- [ ] Upload fail
- [ ] Event inactive
- [ ] Event không tồn tại

## E. Route refresh (SPA)

Verify refresh trực tiếp không bị 404:
- [ ] `/e/:slug`
- [ ] `/admin/login`
- [ ] `/admin`
- [ ] `/admin/events`
- [ ] `/admin/events/:id`
- [ ] `/admin/events/:id/gallery`
