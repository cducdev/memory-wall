# Hướng dẫn Setup nhanh

## Bước 1: Setup Database

### Option 1: Sử dụng Supabase (Khuyến nghị)

1. Tạo tài khoản tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Lấy connection string từ Settings > Database
4. Thêm vào `.env` của backend:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Option 2: PostgreSQL local

1. Cài đặt PostgreSQL
2. Tạo database:
```sql
CREATE DATABASE memory_wall;
```
3. Thêm vào `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/memory_wall
```

## Bước 2: Setup Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
python init_db.py
uvicorn main:app --reload
```

Backend sẽ chạy tại: http://localhost:8000

## Bước 3: Setup Cloudinary (cho upload ảnh)

1. Tạo tài khoản tại [cloudinary.com](https://cloudinary.com)
2. Lấy Cloud Name, API Key, API Secret
3. Thêm vào `.env` của backend:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Bước 4: Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Chỉnh sửa .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Bước 5: Test

1. Truy cập http://localhost:3000
2. Đăng nhập admin tại http://localhost:3000/admin
   - Password: giá trị trong `ADMIN_PASSWORD` của backend `.env`
3. Tạo receiver và memory
4. Test trang `/for-you` để gửi message
5. Test trang `/to/{token}` để xem memory

## Lưu ý

- Đảm bảo backend chạy trước khi start frontend
- Hand gesture detection cần webcam và quyền truy cập
- Trong production, cần cấu hình CORS đúng domain


