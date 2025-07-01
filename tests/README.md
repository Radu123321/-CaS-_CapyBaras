# 🧹 CaS - Cleaning as a Service
## Complete Management System v2.0

[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

**CaS** este un sistem complet de management pentru servicii de curățenie, oferind o platformă integrată pentru gestionarea comenzilor, echipamentelor, personalului și statisticilor în timp real.

## 🚀 Quick Start

### Pornire Rapidă
```bash
# Instalare dependențe
npm install

# Pornire sistem complet
npm start
# sau
npm run cas
```

Accesează [http://localhost:3000](http://localhost:3000) în browser.

### Demo Credentials
- **Admin**: `admin@cas.ro` / `admin123`
- **Manager**: `manager@cas.ro` / `manager123`  
- **Employee**: `employee@cas.ro` / `employee123`

## 📋 Cerințe de Sistem

- **Node.js** 14.0.0 sau mai nou
- **PostgreSQL** 13 sau mai nou
- **NPM** sau **Yarn**
- **Browser modern** (Chrome, Firefox, Safari, Edge)

## 🏗️ Instalare & Configurare

### 1. Clonare & Instalare
```bash
git clone <repository-url>
cd TWCaS
npm install
```

### 2. Configurare Bază de Date
```bash
# Conectare la PostgreSQL
psql -U postgres

# Creare bază de date
CREATE DATABASE cas_db;

# Import schema
\c cas_db
\i createschema_enhanced.sql
\i seed_data.sql
\i seed_equipment.sql
```

### 3. Configurare Environment
Creează fișierul `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cas_db
DB_USER=postgres
DB_PASS=your_password

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=cas-super-secret-key-2024

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Weather API (optional)
WEATHER_API_KEY=your-api-key
```

### 4. Pornire Sistem
```bash
npm start
```

## 🌟 Funcționalități

### ✅ Sistem de Autentificare Complet
- **Înregistrare & Autentificare** cu JWT
- **Control acces bazat pe roluri** (Admin/Manager/Employee)
- **Sesiuni persistente** cu refresh token
- **Protecție rute** și validare

### ✅ Dashboard Interactiv
- **Statistici în timp real** cu Chart.js
- **KPI-uri și tendințe** pentru toate modulele
- **Interface responsive** pentru desktop și mobile
- **WebSocket updates** pentru date live

### ✅ Management Echipamente
- **Monitorizare status** echipamente în timp real
- **Programare întreținere** automată
- **Alerte preventive** pentru defecțiuni
- **Istorică întrețineri** și costuri

### ✅ Integrare Meteo
- **Analiză impact** condițiilor meteo
- **Recomandări programare** servicii
- **Alerte vreme severă** 
- **Statistici correlație** meteo-performanță

### ✅ Sistem Notificări
- **Email notifications** prin SMTP
- **Browser push notifications**
- **WebSocket real-time** updates
- **RSS feeds** pentru status updates

### ✅ Detecție Excepții
- **Monitorizare automată** probleme sistem
- **Alertare proactivă** pentru:
  - Indisponibilitate personal
  - Pene de curent
  - Defecțiuni echipamente
  - Întârzieri transport

### ✅ Analytics & Rapoarte
- **Statistici complete** pentru toate modulele
- **Tendințe și predicții** bazate pe date
- **Rapoarte personalizabile** în format JSON
- **Comparații inter-locații**

## 🗂️ Structura Proiect

```
TWCaS/
├── 📁 src/                      # Backend API
│   ├── 📁 controllers/          # HTTP Controllers
│   ├── 📁 services/            # Business Logic
│   ├── 📁 repositories/        # Data Access Layer
│   ├── 📁 core/                # Core Components
│   ├── 📁 jobs/                # Background Jobs
│   └── 📁 public/              # Backend Static Files
├── 📁 Cas-front/               # Frontend Interface
│   ├── 📁 css/                 # Stylesheets
│   ├── 📁 js/                  # JavaScript Modules
│   ├── 📁 assets/              # Images & Resources
│   └── 📄 *.html               # HTML Pages
├── 📁 logs/                    # Application Logs
├── 📄 createschema_enhanced.sql # Database Schema
├── 📄 start-cas.js             # System Startup Script
└── 📄 package.json             # Dependencies
```

## 🔗 API Endpoints

### Autentificare
- `POST /api/auth/register` - Înregistrare utilizator
- `POST /api/auth/login` - Autentificare
- `POST /api/auth/logout` - Deconectare
- `GET /api/auth/profile` - Profil utilizator

### Management Comenzi
- `GET /api/orders` - Lista comenzi
- `POST /api/orders` - Comandă nouă
- `PUT /api/orders/:id/status` - Update status

### Echipamente
- `GET /api/equipment` - Lista echipamente
- `POST /api/equipment/:id/maintenance` - Programare întreținere
- `GET /api/equipment/dashboard` - Dashboard echipamente

### Statistici
- `GET /api/stats/dashboard` - Dashboard principal
- `GET /api/stats/orders/trends` - Tendințe comenzi
- `GET /api/stats/equipment/health` - Sănătate echipamente

### Notificări
- `POST /api/notifications/subscribe` - Abonare notificări
- `GET /api/notifications/stats` - Statistici notificări

**Vezi documentația completă în `API_ENDPOINTS.md`**

## 🔌 WebSocket Integration

Conectare la WebSocket pentru updates în timp real:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/status');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## 📊 Dashboard Features

### Overview Tab
- **KPI Cards**: Revenue, Orders, Equipment Status
- **Trend Charts**: Daily/Weekly/Monthly comparisons
- **Alert Summary**: Critical issues overview

### Orders Management
- **Status Distribution**: Pie charts pentru status comenzi
- **Revenue Trends**: Line charts pentru venituri
- **Location Comparison**: Bar charts inter-locații

### Equipment Monitoring
- **Health Status**: Real-time equipment condition
- **Maintenance Schedule**: Upcoming maintenance tasks
- **Efficiency Metrics**: Equipment performance trends

### Employee Analytics
- **Productivity Metrics**: Individual și team performance
- **Workload Distribution**: Task allocation analysis
- **Availability Tracking**: Staff scheduling optimization

### Weather Impact
- **Service Correlation**: Weather impact pe servicii
- **Scheduling Recommendations**: Optimal timing suggestions
- **Historical Analysis**: Weather patterns și business impact

## 🔧 Configurare Avansată

### Background Jobs
Sistemul rulează următoarele job-uri automate:
- **Equipment Status Check**: la 6 ore
- **Weather Data Update**: la 3 ore  
- **Daily Statistics**: zilnic la miezul nopții
- **Exception Detection**: la 30 minute
- **Inventory Check**: orar

### Email Configuration
Pentru notificări email, configurează SMTP:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password pentru Gmail
```

### Database Optimization
Pentru performanță optimă:
```sql
-- Index-uri recomandate
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_equipment_status ON equipment(status);
CREATE INDEX CONCURRENTLY idx_employees_location ON employees(location_id);
```

## 🚀 Deployment

### Production Build
```bash
# Set environment
export NODE_ENV=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start start-cas.js --name "cas-system"
pm2 startup
pm2 save
```

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoring & Logs

### Log Files
- `logs/cas-YYYY-MM-DD.log` - Daily application logs
- `cas.log` - Current session log

### Health Checks
- `GET /api/ping` - Server health
- `GET /api/stats/dashboard` - System status
- `GET /api/websocket/stats` - WebSocket statistics

## 🛠️ Development

### Rulare în Development
```bash
npm run dev
# sau
npm run server
```

### Debugging
```bash
# Enable debug logs
export DEBUG=cas:*
npm start
```

### Testing API
Folosește colecția Postman inclusă:
- `CaS_Complete_API_Collection.postman_collection.json`

## 🤝 Contributing

1. Fork repository
2. Creează feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Deschide Pull Request

## 📝 License

Acest proiect este licențiat sub ISC License - vezi fișierul [LICENSE](LICENSE) pentru detalii.

## 🆘 Support

Pentru probleme și întrebări:
- **Issues**: Deschide un issue pe GitHub
- **Email**: support@cas.ro
- **Documentație**: Vezi fișierele `*.md` din proiect

## 🎯 Roadmap Viitor

- [ ] **Mobile App** - React Native sau Flutter
- [ ] **AI Integration** - Machine Learning pentru predicții
- [ ] **Multi-tenant** - Support pentru mai multe companii
- [ ] **Advanced Analytics** - Dashboards personalizabile
- [ ] **Integration APIs** - Conectare cu sisteme externe

---

**Dezvoltat cu ❤️ pentru industria de curățenie**

*CaS v2.0 - Complete Management System* 