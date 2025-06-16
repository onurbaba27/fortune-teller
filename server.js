const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 1. GELİŞMİŞ CORS AYARLARI (Tüm cihazlar için)
const allowedOrigins = [
  'https://fortune-teller-backend.onrender.com',
  'http://localhost:3000', // Frontend geliştirme adresi
  /\.render\.com$/, // Tüm Render subdomainleri
  'http://192.168.*', // Yerel ağdaki tüm IP'ler (telefon için)
  'capacitor://localhost', // Capacitor uygulamaları
  'ionic://localhost' // Ionic uygulamaları
];

const corsOptions = {
  origin: function (origin, callback) {
    // Postman gibi araçlardan gelen isteklere izin ver
    if (!origin || allowedOrigins.some(allowed => {
      return typeof allowed === 'string' 
        ? origin.startsWith(allowed) 
        : allowed.test(origin);
    })) {
      callback(null, true);
    } else {
      console.warn('CORS Engellendi:', origin);
      callback(new Error('CORS politikası tarafından engellendi'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  maxAge: 86400 // Önbellek süresi (saniye)
};

app.use(cors(corsOptions));

// 2. OPTIONS METODU İÇİN ÖZEL HANDLER
app.options('*', cors(corsOptions));

// 3. BODY PARSER AYARLARI
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000
}));

// 4. HEALTHCHECK ENDPOINT (Render için kritik)
app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'OK',
    serverTime: new Date().toISOString(),
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 5. KAHVE FALI ENDPOINT (Güncellendi)
app.post('/api/read-coffee', async (req, res) => {
  try {
    /* ... (Önceki kodunuz aynen kalacak) ... */
  } catch (error) {
    console.error('Hata Detayı:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      error: "Fal sunucusunda geçici sorun",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
});

// 6. GELİŞMİŞ HATA YÖNETİMİ
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: "Geçersiz JSON verisi",
      solution: "Lütfen istek gövdesini kontrol edin"
    });
  }
  next();
});

// 7. STATİK DOSYALAR
app.use(express.static('public', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 8. BAŞLANGIÇ KONTROLLERİ
app.listen(port, async () => {
  console.log(`🚀 Sunucu başlatıldı: http://localhost:${port}`);
  console.log(`🌐 Canlı URL: https://fortune-teller-backend.onrender.com`);
  
  // Sunucu başlangıç testi
  try {
    const healthcheck = await fetch(`http://localhost:${port}/healthcheck`);
    console.log(healthcheck.ok ? '✅ Sağlık kontrolü başarılı' : '❌ Sağlık kontrolü başarısız');
  } catch (error) {
    console.error('⛔ Sunucu başlatma hatası:', error);
  }
});

// 9. SİNYAL YÖNETİMİ (Render için önemli)
process.on('SIGTERM', () => {
  console.log('⏳ Sunucu kapatılıyor...');
  server.close(() => {
    console.log('🔴 Sunucu durduruldu');
    process.exit(0);
  });
});