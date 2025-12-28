# MEMORY WALL – END YEAR PROJECT

## MỤC TIÊU DỰ ÁN

Xây dựng một website lưu giữ kỷ niệm cuối năm, gồm 2 phần riêng biệt:

### Admin (chủ web)

-   Viết lời nhắn riêng cho từng người
-   Mỗi người có một link cá nhân
-   Chỉ người nhận mới xem được nội dung

### Người dùng (bạn bè)

-   Gửi lời nhắn cho admin
-   Có thể ẩn danh
-   Chỉ admin đọc được

**Dự án hướng tới:**

-   Nhẹ
-   Cảm xúc
-   Riêng tư
-   Dễ triển khai
-   Phù hợp làm project cuối năm

## KIẾN TRÚC TỔNG QUÁT

**Frontend:** Next.js  
**Backend:** FastAPI  
**Database:** PostgreSQL (Supabase)

### Các trang chính:

-   `/admin` → trang quản lý (yêu cầu password đơn giản)
-   `/to/{token}` → trang xem lời nhắn cá nhân (public)
-   `/for-you` → trang gửi lời nhắn cho admin (public)

## PHẦN 1: ADMIN GỬI MEMORY RIÊNG

### Mục tiêu

Admin viết lời nhắn riêng cho từng người, mỗi người có link riêng.

### Luồng hoạt động

1. Admin nhập password (lưu trong env, không cần database)
2. Tạo người nhận
3. Viết memory cho người đó
4. Hệ thống sinh link dạng: `/to/{secret_token}`
5. Gửi link cho người nhận

### DATABASE – PHẦN ADMIN

#### Bảng: `receivers`

-   `id` (UUID)
-   `name` (text)
-   `secret_token` (text, unique)
-   `created_at` (timestamp)

#### Bảng: `admin_memories`

-   `id` (UUID)
-   `receiver_id` (UUID)
-   `content` (text)
-   `image_url` (text)
-   `emoji` (text)
-   `created_at` (timestamp)

### API – PHẦN ADMIN

#### Authentication (đơn giản)

**POST** `/api/admin/login`

**Body:**

```json
{
  "password": "password_từ_env"
}
```

**Response:**

```json
{
  "success": true
}
```

> Lưu session hoặc cookie đơn giản, không cần JWT phức tạp

#### Tạo người nhận

**POST** `/api/admin/receiver`

**Body:**

```json
{
  "name": "Minh"
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Minh",
  "secret_token": "generated_token",
  "link": "/to/{secret_token}"
}
```

#### Xem danh sách người nhận

**GET** `/api/admin/receivers`

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Minh",
    "created_at": "timestamp"
  }
]
```

#### Ghi memory

**POST** `/api/admin/memory`

**Body:**

```json
{
  "receiver_id": "uuid",
  "content": "Cảm ơn vì một năm tuyệt vời",
  "emoji": "🎄",
  "image_url": ""
}
```

#### Xem memory theo link (public)

**GET** `/api/public/to/{token}`

**Response:**

```json
{
  "receiver_name": "Minh",
  "memories": [
    {
      "content": "Cảm ơn vì một năm tuyệt vời",
      "emoji": "🎄",
      "image_url": "url"
    }
  ]
}
```

### GIAO DIỆN NGƯỜI NHẬN

-   Hiển thị nội dung memory
-   Có ảnh, emoji
-   Animation nhẹ
-   **Hand control detection** - Zoom in/out bằng cử chỉ tay (pinch gesture)
-   Không có input
-   Không xem được dữ liệu người khác

## PHẦN 2: MỌI NGƯỜI GỬI MEMORY CHO ADMIN

### Mục tiêu

Ai cũng có thể gửi lời nhắn cho admin. Chỉ admin đọc được.  
Người dùng có thể chọn muốn nhận recap memory của admin, nếu có thì cần cung cấp thông tin để admin xác nhận danh tính (tránh fake).

### LUỒNG HOẠT ĐỘNG

1. Người dùng truy cập: `/for-you`
2. Điền form:
    - Tên (có thể bỏ trống)
    - Nội dung
    - Emoji
    - Upload ảnh (optional)
    - Ẩn danh
    - **Muốn nhận recap memory của admin?** (checkbox)
        - Nếu có: Điền form xác nhận danh tính (Tên, Facebook, Email, Kỷ niệm)
3. Gửi
4. Admin xem inbox, xác nhận danh tính, sau đó tạo receiver và gửi link cho người đó

### DATABASE – MESSAGE TO ADMIN

#### Bảng: `messages_to_admin`

-   `id` (UUID)
-   `sender_name` (text)
-   `content` (text)
-   `emoji` (text)
-   `image_url` (text, nullable)
-   `is_anonymous` (boolean)
-   `wants_memory` (boolean) - muốn nhận recap memory của admin
-   `verification_name` (text, nullable) - tên để xác nhận (required nếu wants_memory = true)
-   `verification_facebook` (text, nullable) - link Facebook (required nếu wants_memory = true)
-   `verification_email` (text, nullable) - email (required nếu wants_memory = true)
-   `verification_memory` (text, nullable) - kỷ niệm mà chỉ 2 người biết (required nếu wants_memory = true)
-   `is_verified` (boolean, default: false) - admin đã xác nhận chưa
-   `receiver_id` (UUID, nullable) - nếu đã tạo receiver thì link đến bảng receivers
-   `created_at` (timestamp)

### API – MESSAGE

#### Gửi lời nhắn (public)

**POST** `/api/message`

**Body (multipart/form-data):**

```json
{
  "sender_name": "An",
  "content": "Chúc bạn năm mới vui vẻ",
  "emoji": "💖",
  "image": "file" (optional),
  "is_anonymous": false,
  "wants_memory": true,
  "verification_name": "An",
  "verification_facebook": "https://facebook.com/an.profile",
  "verification_email": "an@email.com",
  "verification_memory": "Kỷ niệm mà chỉ 2 ta biết..."
}
```

**Response:**

```json
{
  "message": "Gửi thành công!",
  "id": "uuid"
}
```

> Nếu `wants_memory = true` thì `verification_name`, `verification_facebook`, `verification_email`, và `verification_memory` là bắt buộc để admin xác nhận danh tính

#### Admin xem inbox

**GET** `/api/admin/messages`

**Response:**

```json
[
  {
    "id": "uuid",
    "sender_name": "An",
    "content": "Chúc bạn năm mới vui vẻ",
    "emoji": "💖",
    "image_url": "url",
    "is_anonymous": false,
    "wants_memory": true,
    "verification_name": "An",
    "verification_facebook": "https://facebook.com/an.profile",
    "verification_email": "an@email.com",
    "verification_memory": "Kỷ niệm mà chỉ 2 ta biết...",
    "is_verified": false,
    "receiver_id": null,
    "created_at": "timestamp"
  }
]
```

#### Admin xác nhận và tạo receiver từ message

**POST** `/api/admin/verify-message/{message_id}`

**Body:**

```json
{
  "name": "An" (tên để tạo receiver)
}
```

**Response:**

```json
{
  "message": "Đã xác nhận và tạo receiver",
  "receiver_id": "uuid",
  "secret_token": "generated_token",
  "link": "/to/{secret_token}"
}
```

> Sau khi xác nhận, admin có thể gửi link cho người đó. Message sẽ được đánh dấu `is_verified = true` và link đến `receiver_id`.

## GIAO DIỆN

### Trang người nhận (`/to/{token}`)

-   Card đẹp, hiển thị memory
-   Nền nhẹ, gradient hoặc pattern tinh tế
-   Animation fade-in khi load
-   Font viết tay cho nội dung (optional)
-   Hiển thị emoji và ảnh (nếu có)
-   **Hand control detection** - Zoom in/out bằng cử chỉ tay:
    -   Pinch gesture (2 ngón tay) để zoom in/out
    -   Sử dụng webcam để detect hand gestures
    -   Có thể bật/tắt tính năng này
    -   Hiển thị hướng dẫn ngắn gọn khi lần đầu sử dụng
-   Responsive design (mobile-friendly)

### Trang gửi lời (`/for-you`)

-   Form đơn giản, dễ sử dụng
-   Emoji picker đơn giản (hoặc input text)
-   **Upload ảnh** (optional) - preview ảnh sau khi chọn
-   Checkbox "Gửi ẩn danh"
-   **Checkbox "Muốn nhận recap memory của admin?"**
    -   Nếu check: hiện form xác nhận danh tính với các trường:
        -   **Tên** → input text (tên đầy đủ hoặc tên thường gọi)
        -   **Facebook** → input text (link Facebook profile)
        -   **Email** → input email
        -   **Kỷ niệm** → textarea (một kỷ niệm mà chỉ bạn và admin biết, ví dụ: "Chúng ta gặp nhau lần đầu ở đâu?", "Tên con vật cưng của tôi là gì?", "Sự kiện đặc biệt giữa chúng ta là gì?")
-   Nút "Gửi lời nhắn 💌"
-   Hiển thị thông báo sau khi gửi thành công

### Trang admin (`/admin`)

-   Form đăng nhập đơn giản (chỉ password)
-   **Tab 1: Quản lý người nhận**
    -   Danh sách receivers
    -   Tạo mới
    -   Copy link nhanh
-   **Tab 2: Inbox**
    -   Danh sách messages
    -   Hiển thị tên hoặc "Ẩn danh"
    -   Hiển thị ảnh (nếu có)
    -   **Filter:** Tất cả / Chưa xác nhận / Đã xác nhận
    -   **Messages muốn nhận memory:** Hiển thị badge "Muốn nhận memory" và form xác nhận với:
        -   Tên
        -   Facebook (có thể click để mở)
        -   Email
        -   Kỷ niệm
    -   **Nút "Xác nhận & Tạo receiver"** cho messages chưa xác nhận
    -   Nếu đã xác nhận: hiển thị link receiver và copy button
-   Design clean, dễ sử dụng

## BẢO MẬT

### Authentication

-   **Người dùng:** Không cần login, có thể gửi message tự do
-   **Admin:** Password đơn giản lưu trong env variable
-   Dùng session/cookie đơn giản (không cần JWT phức tạp)

### Bảo mật dữ liệu

-   Link người nhận dùng `secret_token` (UUID), không đoán được
-   Không public danh sách receivers
-   Không public danh sách messages
-   Chỉ admin mới xem được inbox

### Validation

-   Validate input: content không được rỗng
-   Validate ảnh: chỉ chấp nhận file ảnh, max size 5MB
-   Nếu `wants_memory = true` thì các trường sau là bắt buộc:
    -   `verification_name` - không được rỗng
    -   `verification_facebook` - không được rỗng (có thể là link hoặc username)
    -   `verification_email` - phải đúng format email
    -   `verification_memory` - không được rỗng
-   Sanitize input cơ bản để tránh XSS

### XÁC NHẬN DANH TÍNH

Để admin xác nhận người dùng là bạn bè thật (tránh fake), người dùng cần cung cấp:

1. **Tên** - Tên đầy đủ hoặc tên thường gọi
2. **Facebook** - Link Facebook profile hoặc username
3. **Email** - Email để admin kiểm tra
4. **Kỷ niệm** - Một kỷ niệm mà chỉ bạn và admin biết (ví dụ: "Chúng ta gặp nhau lần đầu ở đâu?", "Tên con vật cưng của tôi là gì?", "Sự kiện đặc biệt giữa chúng ta là gì?")

Admin sẽ kiểm tra các thông tin này để xác nhận danh tính trước khi tạo receiver và gửi link memory.

## CÔNG NGHỆ

### Frontend

-   Next.js
-   Tailwind CSS
-   Framer Motion (animations - optional)
-   **MediaPipe Hands** hoặc **TensorFlow.js Hand Pose Detection** - để detect hand gestures
-   **@mediapipe/hands** hoặc **@tensorflow-models/hand-pose-detection** - thư viện hand tracking

### Backend

-   FastAPI
-   Python 3.11+
-   Pydantic (data validation)
-   SQLAlchemy (ORM) hoặc Supabase client đơn giản

### Database

-   Supabase (PostgreSQL)

### Upload ảnh

-   Cloudinary hoặc Supabase Storage
-   Hỗ trợ upload ảnh trong message (bắt buộc)
-   Validate: chỉ chấp nhận file ảnh (jpg, png, gif), max size 5MB

### Deploy

-   **VPS:** Deploy toàn bộ trên VPS của bạn
-   **Frontend:** Next.js build static và serve qua Nginx
-   **Backend:** FastAPI chạy với PM2 hoặc systemd
-   **Reverse Proxy:** Nginx
-   **SSL:** Let's Encrypt (Certbot)
-   **Database:** Supabase (managed) hoặc PostgreSQL trên VPS
-   **Process Manager:** PM2 cho Node.js/FastAPI hoặc systemd service

### Environment Variables

-   `DATABASE_URL`
-   `ADMIN_PASSWORD` (password đơn giản cho admin)
-   `CLOUDINARY_URL` (nếu dùng Cloudinary, optional)
-   `NEXT_PUBLIC_API_URL` (URL của backend API)
-   `NODE_ENV` (production)

### HƯỚNG DẪN DEPLOY TRÊN VPS

#### 1. Chuẩn bị VPS

-   Ubuntu/Debian server
-   Domain name trỏ về IP VPS (nếu có)
-   SSH access

#### 2. Cài đặt dependencies

```bash
# Cài đặt Node.js, Python, Nginx
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip nginx

# Cài đặt PM2 (process manager)
sudo npm install -g pm2
```

#### 3. Deploy Backend (FastAPI)

```bash
# Clone repo hoặc upload code
cd /var/www/memory-wall/backend

# Cài đặt dependencies
pip3 install -r requirements.txt

# Tạo file .env
nano .env
# Thêm: DATABASE_URL, ADMIN_PASSWORD, etc.

# Chạy với PM2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name memory-wall-api
pm2 save
pm2 startup
```

#### 4. Deploy Frontend (Next.js)

```bash
cd /var/www/memory-wall/frontend

# Cài đặt dependencies
npm install

# Build production
npm run build

# Export static (nếu dùng static export)
# hoặc chạy Next.js server với PM2
pm2 start "npm start" --name memory-wall-frontend
pm2 save
```

#### 5. Cấu hình Nginx

```nginx
# /etc/nginx/sites-available/memory-wall
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/memory-wall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Cài đặt SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 7. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 8. Tùy chọn: Docker (nếu muốn)

Có thể dùng Docker Compose để deploy dễ dàng hơn:

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
```

#### Lưu ý

-   Đảm bảo VPS có đủ RAM (tối thiểu 1GB, khuyến nghị 2GB+)
-   Có thể dùng Supabase database (managed) hoặc cài PostgreSQL trên VPS
-   Backup database thường xuyên
-   Monitor logs với `pm2 logs` hoặc `journalctl`

## NÂNG CẤP (KHÔNG BẮT BUỘC)

-   Hiệu ứng năm mới (confetti, snow, etc.)
-   Xuất PDF kỷ niệm (download memory card)
-   Share memory lên social media
-   Hẹn giờ mở lời nhắn (scheduled release)
-   Thêm các hand gestures khác: swipe để chuyển memory, wave để like, etc.
