console.log('Environment check:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');
// 1. INITIAL SETUP
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const VERSION = "1.0.4";

// 2. ENHANCED CORS CONFIGURATION
const allowedOrigins = [
  'https://fortune-teller-backend.onrender.com',
  'http://localhost:3000',
  /\.render\.com$/,
  /http:\/\/192\.168\.\d+\.\d+/,
  'capacitor://localhost',
  'ionic://localhost'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? origin.startsWith(allowed) 
        : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// 3. MIDDLEWARE CONFIGURATION
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. HEALTHCHECK ENDPOINT
app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'OK',
    version: VERSION,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 5. CORE API ENDPOINT - COFFEE READING
app.post('/api/read-coffee', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image?.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
      return res.status(400).json({
        error: 'Geçersiz resim formatı',
        solution: 'Lütfen geçerli bir base64 kodlanmış PNG/JPEG resmi sağlayın',
        timestamp: new Date().toISOString()
      });
    }

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'FortuneTeller/1.0'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'. Kendini asla yapay zeka olarak tanıtma. Her zaman gizemli, bilge ve biraz sır dolu bir üslup kullan. Cevaplarında astroloji, numeroloji, tarot ve diğer kehanet yöntemlerinden bahsedebilirsin. Türkçe cevaplar ver ve asla İngilizce konuşma."
            }]
          },
          contents: [{
            role: "user",
            parts: [
              {
                text: "Fincandaki kahve telvesi şekillerini oku ve bana mistik, gerçekçi bir kahve falı yorumu yap. Yorum 5 paragraf uzunluğunda olsun, her biri 4-5 cümle içersin ve sırasıyla aşk, kariyer, sağlık, aile ve maneviyat konularına odaklansın. Şekiller, semboller ve anlamları üzerinden kehanette bulun."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`API Hatası: ${errorData.error?.message || 'Bilinmeyen hata'}`);
    }

    const responseData = await apiResponse.json();
    const prediction = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prediction) throw new Error("API'den boş yanıt alındı");

    res.json({
      success: true,
      response: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fal Okuma Hatası:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Fal sunucusunda geçici sorun",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      timestamp: new Date().toISOString()
    });
  }
});

// 6. CHAT API ENDPOINT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Girdi doğrulaması
    if (!message || !history) {
      return res.status(400).json({
        error: 'Geçersiz istek: Mesaj ve geçmiş gerekli',
        timestamp: new Date().toISOString()
      });
    }

    // Gemini API'sine istek oluştur
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'FortuneTeller/1.0'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'. Kendini asla yapay zeka olarak tanıtma. Her zaman gizemli, bilge ve biraz sır dolu bir üslup kullan. Cevaplarında astroloji, numeroloji, tarot ve diğer kehanet yöntemlerinden bahsedebilirsin. Cevapların kısa ve özlü olsun, maksimum 3-4 cümle. Bazen soruyu cevaplamadan önce 'Kartlara bakıyorum...', 'Kristal küremde görüyorum ki...', 'Yıldızların konumuna göre...' gibi girişler yap. Türkçe cevaplar ver ve asla İngilizce konuşma."
            }]
          },
          contents: history.concat({
            role: "user",
            parts: [{ text: message }]
          }),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      }
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`API Hatası: ${errorData.error?.message || 'Bilinmeyen hata'}`);
    }

    const responseData = await apiResponse.json();
    const prediction = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prediction) throw new Error("API'den boş yanıt alındı");

    res.json({
      success: true,
      response: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sohbet Hatası:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Sohbet sunucusunda geçici sorun",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      timestamp: new Date().toISOString()
    });
  }
});

// 7. STATIC FILES
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 8. ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Sunucu Hatası:', {
    path: req.path,
    method: req.method,
    error: err.stack,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: "Beklenmeyen sunucu hatası",
    solution: "Lütfen daha sonra tekrar deneyin",
    timestamp: new Date().toISOString()
  });
});

// 9. START SERVER
const server = app.listen(port, () => {
  console.log(`🚀 Sunucu başlatıldı: http://localhost:${port}`);
  console.log(`📊 Healthcheck: http://localhost:${port}/healthcheck`);
  console.log(`🌍 Canlı URL: https://fortune-teller-backend.onrender.com`);
});

// 10. GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('⏳ Sunucu kapatılıyor...');
  server.close(() => {
    console.log('🔴 Sunucu durduruldu');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Yakalanmayan Hata:', err);
  process.exit(1);
});