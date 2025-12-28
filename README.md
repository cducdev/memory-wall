# Memory Wall - Dự án cuối năm

Website lưu giữ kỷ niệm cuối năm với 2 phần chính:
- **Admin**: Viết lời nhắn riêng cho từng người với link cá nhân
- **Người dùng**: Gửi lời nhắn cho admin, có thể yêu cầu nhận memory từ admin

## 🚀 Công nghệ

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python 3.11+
- **Database**: PostgreSQL (Supabase)
- **Hand Gesture**: TensorFlow.js Hand Pose Detection
- **Image Upload**: Cloudinary

## 📁 Cấu trúc dự án

```
memory-wall/
├── frontend/          # Next.js application
│   ├── app/          # Pages và routes
│   ├── components/   # React components
│   ├── lib/          # Utilities và API client
│   └── styles/       # CSS styles
├── backend/          # FastAPI application
│   ├── main.py       # Main API file
│   └── init_db.py    # Database initialization
└── project-detail.md # Chi tiết dự án
```

## 🛠️ Cài đặt

### Backend

1. Cài đặt dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cập nhật các biến môi trường trong `.env`:
- `DATABASE_URL`: URL kết nối PostgreSQL
- `ADMIN_PASSWORD`: Mật khẩu admin
- `ALLOWED_ORIGINS`: Các domain được phép truy cập API (production)
  - Development: `*` hoặc `http://localhost:3000`
  - Production: `https://yourdomain.com,https://www.yourdomain.com` (phân cách bằng dấu phẩy)
- `CLOUDINARY_*`: Thông tin Cloudinary (nếu dùng)
- `SUPABASE_URL` và `SUPABASE_KEY`: Nếu dùng Supabase

4. Khởi tạo database:
```bash
python init_db.py
```

5. Chạy server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

1. Cài đặt dependencies:
```bash
cd frontend
npm install
```

2. Tạo file `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

3. Chạy development server:
```bash
npm run dev
```

## 📝 Các trang chính

- `/` - Trang chủ
- `/admin` - Trang quản lý admin (yêu cầu password)
- `/to/[token]` - Trang xem memory cá nhân (public)
- `/for-you` - Trang gửi lời nhắn cho admin (public)

## 🔐 Bảo mật

- Admin authentication: Password đơn giản lưu trong env
- Secret tokens: UUID không đoán được cho mỗi receiver
- Validation: Kiểm tra input, file size, file type
- Xác nhận danh tính: Người dùng cung cấp thông tin để admin xác nhận

## 🎨 Tính năng

- ✅ Admin tạo receivers và viết memory
- ✅ Người dùng xem memory qua link riêng
- ✅ Người dùng gửi message cho admin
- ✅ Upload ảnh (Cloudinary)
- ✅ Hand gesture detection (zoom in/out bằng cử chỉ tay)
- ✅ Xác nhận danh tính trước khi tạo receiver
- ✅ Animation với Framer Motion
- ✅ Responsive design

## 📦 Deploy

Xem chi tiết trong:
- `project-detail.md` - Kiến trúc và tổng quan dự án
- `DEPLOY_HTTPS.md` - **Hướng dẫn setup HTTPS/SSL cho VPS** (Let's Encrypt)
- `SETUP.md` - Hướng dẫn setup nhanh

### Tóm tắt:

1. Setup VPS với Node.js, Python, Nginx
2. Deploy backend với PM2
3. Deploy frontend (build static hoặc Next.js server)
4. Cấu hình Nginx reverse proxy
5. Setup SSL với Let's Encrypt

## 🐛 Troubleshooting

### Backend không kết nối được database
- Kiểm tra `DATABASE_URL` trong `.env`
- Đảm bảo PostgreSQL đang chạy
- Chạy `python init_db.py` để tạo tables

### Frontend không gọi được API
- Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
- Đảm bảo backend đang chạy trên port 8000
- Kiểm tra CORS settings trong backend

### Hand gesture không hoạt động
- Cần webcam và quyền truy cập camera
- Kiểm tra browser console để xem lỗi
- Đảm bảo đã cài đặt đầy đủ TensorFlow.js dependencies

## 📄 License

MIT


