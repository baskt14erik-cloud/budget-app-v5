# Guía paso a paso para desplegar en un servidor

A continuación te dejo una ruta simple y realista con **Ubuntu + Nginx + PM2**. Es una de las más fáciles para dejar esta app en línea.

## Arquitectura recomendada

- **Frontend**: archivos estáticos generados por Vite
- **Backend**: Node.js con Express corriendo con PM2
- **Base de datos**: SQLite guardada en el servidor
- **Proxy**: Nginx para servir frontend y redirigir `/api` al backend

---

## 1. Crear el servidor

Puedes usar un VPS de:
- DigitalOcean
- Hetzner
- Contabo
- Vultr
- AWS Lightsail

Recomendación mínima:
- 2 GB RAM
- 1 vCPU
- Ubuntu 24.04 LTS

---

## 2. Entrar al servidor por SSH

```bash
ssh root@TU_IP_DEL_SERVIDOR
```

---

## 3. Instalar Node, Nginx y utilidades

```bash
apt update && apt upgrade -y
apt install -y nginx curl git ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Verifica:

```bash
node -v
npm -v
pm2 -v
```

---

## 4. Copiar el proyecto al servidor

Desde tu computadora:

```bash
scp -r budget-app root@TU_IP_DEL_SERVIDOR:/var/www/
```

O si lo subes a GitHub:

```bash
cd /var/www
git clone TU_REPO budget-app
```

---

## 5. Configurar backend

```bash
cd /var/www/budget-app/backend
cp .env.example .env
npm install
npm run seed
```

Edita `.env`:

```env
PORT=4000
FRONTEND_URL=https://tudominio.com
DB_PATH=./data/budget.sqlite
```

Prueba localmente:

```bash
npm start
```

Debes poder abrir:

```bash
curl http://localhost:4000/api/health
```

---

## 6. Levantar backend con PM2

```bash
cd /var/www/budget-app/backend
pm2 start src/server.js --name presupuesto-api
pm2 save
pm2 startup
```

Verifica:

```bash
pm2 status
pm2 logs presupuesto-api
```

---

## 7. Configurar frontend

```bash
cd /var/www/budget-app/frontend
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=https://tudominio.com/api
```

Instala y compila:

```bash
npm install
npm run build
```

Esto generará la carpeta:

```bash
/var/www/budget-app/frontend/dist
```

---

## 8. Configurar Nginx

Crea el archivo:

```bash
nano /etc/nginx/sites-available/presupuesto-app
```

Pega esto:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/budget-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el sitio:

```bash
ln -s /etc/nginx/sites-available/presupuesto-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 9. Abrir firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## 10. Instalar SSL con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tudominio.com -d www.tudominio.com
```

Esto activará HTTPS.

---

## 11. Actualizar la app después de cambios

### Backend

```bash
cd /var/www/budget-app/backend
npm install
pm2 restart presupuesto-api
```

### Frontend

```bash
cd /var/www/budget-app/frontend
npm install
npm run build
systemctl reload nginx
```

---

## 12. Respaldo de base de datos

La base SQLite estará en:

```bash
/var/www/budget-app/backend/data/budget.sqlite
```

Haz copia con:

```bash
cp /var/www/budget-app/backend/data/budget.sqlite /var/www/budget-app/backend/data/budget-$(date +%F).sqlite
```

---

## 13. Recomendaciones de producción

- Crear un usuario no root para desplegar
- Mover secretos a variables seguras
- Agregar autenticación si la usarán varias personas
- Cambiar SQLite por PostgreSQL si crecerá mucho
- Configurar backups automáticos diarios
- Monitorear con Uptime Kuma o similar

---

## 14. Ruta rápida de validación

Cuando termines, revisa esto:

- `https://tudominio.com` carga el frontend
- `https://tudominio.com/api/health` responde JSON
- Puedes crear movimientos, presupuestos y metas
- PM2 mantiene vivo el backend
- Nginx sirve el sitio con HTTPS
