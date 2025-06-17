// test-gemini.js
require('dotenv').config(); // .env dosyasını yükle
const fetch = require('node-fetch');

async function testBasicGemini() {
  console.log('🧪 Basit Gemini Test Başlıyor...');
  console.log('🔑 API Key mevcut:', !!process.env.GEMINI_API_KEY);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Merhaba, nasılsın? Kısa cevap ver."
            }]
          }]
        })
      }
    );

    console.log('📊 HTTP Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hata Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Başarılı Response:', JSON.stringify(data, null, 2));
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('🤖 AI Cevabı:', aiResponse);

  } catch (error) {
    console.error('🚨 Network Hatası:', error.message);
  }
}

// Testi çalıştır
testBasicGemini();