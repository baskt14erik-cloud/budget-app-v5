# Guía de despliegue profesional

## 1) Backend en Ubuntu

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Sube el proyecto y luego:

```bash
cd budget-app-pro-v2/backend
cp .env.example .env
npm install
npm run seed
npm install -g pm2
pm2 start src/server.js --name presupuesto-backend
pm2 save
```

## 2) Frontend web

```bash
cd ../frontend
cp .env.example .env
npm install
npm run build
```

Sirve `dist/` con Nginx.

## 3) Nginx ejemplo

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    root /var/www/presupuesto/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4) SSL

Usa certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## 5) iOS con Expo

### Desarrollo local

```bash
cd mobile-ios-expo
cp .env.example .env
npm install
npm run ios
```

### Build para distribución

```bash
npm install -g eas-cli
npx eas login
npx eas build:configure
npx eas build --platform ios
```

## 6) Recomendación para IA en producción

- usa una variable `OPENAI_API_KEY` en el backend
- registra logs de prompts y errores en forma resumida
- no apliques parches automáticamente al repositorio de producción
- usa la IA para diagnóstico, propuesta de patch y revisión humana antes de desplegar
