require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.get('/healthcheck', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Fortune Teller API is running!' 
  });
});

// Eksik olan chat endpoint'ini ekliyoruz
app.post('/api/chat', async (req, res) => {
  try {
    const { message, birthDate, name } = req.body;
    
    console.log('💬 Sohbet mesajı alındı:', { message, birthDate, name });

    if (!message) {
      return res.status(400).json({
        error: 'Mesaj gerekli',
        solution: 'Lütfen bir mesaj yazın',
        timestamp: new Date().toISOString()
      });
    }

    // Gemini API'ye istek gönder
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
              text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'. Kendini asla yapay zeka olarak tanıtma. Her zaman gizemli, bilge ve biraz sır dolu bir üslup kullan. Cevaplarında astroloji, numeroloji, tarot ve diğer kehanet yöntemlerinden bahsedebilirsin. Türkçe cevaplar ver ve asla İngilizce konuşma. Kişinin doğum tarihi ve adını dikkate alarak kişisel kehanetler yap."
            }]
          },
          contents: [{
            parts: [{
              text: `Kullanıcı Adı: ${name || 'Bilinmiyor'}
Doğum Tarihi: ${birthDate || 'Belirtilmemiş'}
Mesaj: ${message}

Bu bilgilere dayanarak mistik bir yorum yap ve gelecekle ilgili kehanetlerde bulun. Yaklaşık 3-4 paragraf uzunluğunda olsun.`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 400,
            topP: 0.9,
            topK: 40
          }
        })
      }
    );

    console.log('📡 Chat API Response Status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ Chat API Hatası:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`API Hatası (${apiResponse.status}): ${errorData.error?.message || errorData.message || 'Bilinmeyen hata'}`);
    }

    const responseData = await apiResponse.json();
    console.log('✅ Chat API Response:', JSON.stringify(responseData, null, 2));
    
    const prediction = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prediction) {
      console.error('❌ Boş chat prediction:', responseData);
      throw new Error("API'den boş yanıt alındı");
    }

    console.log('🎭 Sohbet Yorumu Oluşturuldu:', prediction.substring(0, 100) + '...');

    res.json({
      success: true,
      response: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Sohbet Hatası:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Fal sunucusunda geçici sorun",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/read-coffee', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    console.log('📸 Resim işleme başlatılıyor...');
    
    if (!base64Image?.match(/^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/)) {
      return res.status(400).json({
        error: 'Geçersiz resim formatı',
        solution: 'Lütfen geçerli bir base64 kodlanmış PNG/JPEG resmi sağlayın',
        timestamp: new Date().toISOString()
      });
    }

    const mimeTypeMatch = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,/);
    const mimeType = mimeTypeMatch[1];
    const finalMimeType = mimeType === 'jpg' ? 'image/jpeg' : `image/${mimeType}`;
    const base64Data = base64Image.split(',')[1];

    console.log('🎯 MIME Type:', finalMimeType);
    console.log('📏 Base64 Data Length:', base64Data.length);

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
            parts: [
              {
                text: "Fincandaki kahve telvesi şekillerini oku ve bana mistik, gerçekçi bir kahve falı yorumu yap. Yorum 5 paragraf uzunluğunda olsun, her biri 4-5 cümle içersin ve sırasıyla aşk, kariyer, sağlık, aile ve maneviyat konularına odaklansın. Şekiller, semboller ve anlamları üzerinden kehanette bulun."
              },
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    console.log('📡 API Response Status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ API Hatası Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`API Hatası (${apiResponse.status}): ${errorData.error?.message || errorData.message || 'Bilinmeyen hata'}`);
    }

    const responseData = await apiResponse.json();
    console.log('✅ API Response:', JSON.stringify(responseData, null, 2));
    
    const prediction = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prediction) {
      console.error('❌ Boş prediction:', responseData);
      throw new Error("API'den boş yanıt alındı");
    }

    console.log('🎭 Fal Yorumu Oluşturuldu:', prediction.substring(0, 100) + '...');

    res.json({
      success: true,
      response: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Fal Okuma Hatası:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Fal sunucusunda geçici sorun",
      solution: "Lütfen 1 dakika sonra tekrar deneyin",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Tüm route'ları listeleyen endpoint (debug için)
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Fortune Teller Server çalışıyor: http://localhost:${PORT}`);
  console.log(`💚 Healthcheck: http://localhost:${PORT}/healthcheck`);
  console.log(`🛠️  Routes: http://localhost:${PORT}/api/routes`);
});