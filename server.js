const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Gelişmiş CORS Ayarları (Telefon için kritik)
const corsOptions = {
  origin: [
    'https://fortune-teller-backend.onrender.com', // Canlı sunucu
    'http://localhost:*', // Local geliştirme
    'https://your-frontend-site.com', // Frontend adresi
    /\.yourdomain\.com$/ // Tüm alt domainler
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body Parser Ayarları
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Kahve Falı Endpoint'i (Güncellendi)
app.post('/api/read-coffee', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ 
        error: 'Görüntü verisi eksik.',
        solution: 'Lütfen geçerli bir base64 resim gönderin'
      });
    }

    // API'ye özel header'lar
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Custom-Header': 'CoffeeReader/1.0'
    };

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'..."
            }]
          },
          contents: [{
            role: "user",
            parts: [
              {
                text: "Fincandaki kahve telvesi şekillerini oku..."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Image.includes(',') ? 
                    base64Image.split(',')[1] : 
                    base64Image
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
      console.error('Google API Hatası:', errorData);
      return res.status(502).json({
        error: "Fal sunucusu geçici olarak hizmet veremiyor",
        details: errorData.error?.message || 'Bilinmeyen API hatası'
      });
    }

    const responseData = await apiResponse.json();
    const falMetni = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!falMetni) {
      throw new Error("API'den boş yanıt alındı");
    }

    // Başarılı yanıt
    res.json({ 
      success: true,
      response: falMetni,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sunucu Hatası:', error);
    res.status(500).json({
      error: "Kristal kürem bulanıklaştı...",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      technicalDetails: process.env.NODE_ENV === 'development' ? 
        error.message : undefined
    });
  }
});

// Sohbet Endpoint'i
app.post('/api/chat', async (req, res) => {
  /* ... (önceki kodun aynısı, hata yönetimi ekleyebilirsiniz) ... */
});

// Statik dosyalar ve sunucu başlatma
app.use(express.static('public'));

// Tüm istekler için log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.listen(port, () => {
  console.log(`🌍 Sunucu http://localhost:${port} adresinde çalışıyor`);
  console.log(`⚡ Canlı URL: https://fortune-teller-backend.onrender.com`);
});