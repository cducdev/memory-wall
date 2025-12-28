# Hướng dẫn Setup HTTPS cho VPS

## Yêu cầu
- VPS đã cài đặt Nginx
- Domain đã trỏ về IP VPS
- Port 80 và 443 đã mở trong firewall

## Bước 1: Cài đặt Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

## Bước 2: Cấu hình Nginx cơ bản

Tạo file cấu hình Nginx tại `/etc/nginx/sites-available/memory-wall`:

```nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/memory-wall /etc/nginx/sites-enabled/
sudo nginx -t  # Kiểm tra cấu hình
sudo systemctl reload nginx
```

## Bước 3: Lấy SSL Certificate với Certbot

### Cách 1: Tự động cấu hình (Khuyến nghị)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot sẽ:
- Tự động lấy certificate
- Cấu hình Nginx để sử dụng HTTPS
- Thiết lập tự động renew

### Cách 2: Chỉ lấy certificate (manual)
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

Sau đó cập nhật Nginx config thủ công.

## Bước 4: Kiểm tra cấu hình Nginx sau khi cài SSL

Certbot sẽ tự động cập nhật file config. File sẽ trông như thế này:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;  # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration (Certbot tự động thêm)
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # Quan trọng cho HTTPS
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # Quan trọng cho HTTPS
    }
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 5: Cấu hình Auto-renewal

Certbot tự động tạo cron job để renew certificate. Kiểm tra:

```bash
sudo certbot renew --dry-run
```

Nếu thành công, certificate sẽ tự động renew trước khi hết hạn (90 ngày).

## Bước 6: Cập nhật Environment Variables

### Backend `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production
```

## Bước 7: Firewall

Đảm bảo port 443 (HTTPS) đã mở:

```bash
# UFW
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp  # Cần cho Let's Encrypt verification
sudo ufw status

# hoặc iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

## Troubleshooting

### Lỗi: "Failed to obtain certificate"
- Kiểm tra domain đã trỏ về IP VPS: `dig yourdomain.com`
- Kiểm tra port 80 đã mở: `sudo ufw status`
- Kiểm tra Nginx đang chạy: `sudo systemctl status nginx`

### Lỗi: "Connection refused"
- Kiểm tra backend/frontend đang chạy: `pm2 list` hoặc `ps aux | grep node`
- Kiểm tra proxy_pass đúng port

### Kiểm tra SSL:
```bash
# Test SSL từ server
curl -I https://yourdomain.com

# Test từ browser
# Truy cập: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### Renew certificate thủ công:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Lưu ý bảo mật

1. **HSTS (HTTP Strict Transport Security)**: Certbot tự động thêm header này
2. **Redirect HTTP → HTTPS**: Certbot tự động cấu hình
3. **SSL/TLS version**: Certbot sử dụng cấu hình an toàn mặc định
4. **Certificate expiry**: Let's Encrypt certificate có hiệu lực 90 ngày, tự động renew

## Cấu hình nâng cao (Optional)

### Tăng cường bảo mật SSL trong Nginx:

Thêm vào server block HTTPS:

```nginx
# Chỉ cho phép TLS 1.2 và 1.3
ssl_protocols TLSv1.2 TLSv1.3;

# Cipher suites
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## Kiểm tra sau khi setup

1. Truy cập `https://yourdomain.com` - phải redirect từ HTTP
2. Kiểm tra certificate trong browser - phải hiển thị "Secure"
3. Test API: `curl https://yourdomain.com/api/` - phải hoạt động
4. Kiểm tra frontend load đúng

## Tài liệu tham khảo

- [Certbot Documentation](https://certbot.eff.org/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

