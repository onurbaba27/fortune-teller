// test-coffee-api.js
require('dotenv').config();
const fetch = require('node-fetch');

async function testCoffeeReading() {
  console.log('☕ Coffee Reading API Test Başlıyor...');
  
  try {
    // 1. Önce systemInstruction ile test
    console.log('\n1️⃣ System Instruction Test...');
    const systemResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'. Türkçe cevap ver."
            }]
          },
          contents: [{
            parts: [{
              text: "Merhaba, kendini tanıt."
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      }
    );

    console.log('📊 System Test Status:', systemResponse.status);
    
    if (systemResponse.ok) {
      const systemData = await systemResponse.json();
      console.log('✅ System Test Başarılı:', systemData.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      const errorText = await systemResponse.text();
      console.error('❌ System Test Hatası:', errorText);
    }

    // 2. Küçük test resmi ile image test
    console.log('\n2️⃣ Image Test...');
    
    // 1x1 piksel şeffaf PNG (en küçük test resmi)
    const testImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    
    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen mistik bir falcısın. Türkçe cevap ver."
            }]
          },
          contents: [{
            parts: [
              {
                text: "Bu resimde ne görüyorsun? Kısa açıkla."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: testImageBase64.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      }
    );

    console.log('📊 Image Test Status:', imageResponse.status);
    
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      console.log('✅ Image Test Başarılı:', imageData.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      const errorText = await imageResponse.text();
      console.error('❌ Image Test Hatası:', errorText);
    }

    // 3. Server endpoint test
    console.log('\n3️⃣ Local Server Test...');
    console.log('Server çalışıyor mu kontrol et: http://localhost:3000/healthcheck');
    
  } catch (error) {
    console.error('🚨 Test Hatası:', error.message);
  }
}

testCoffeeReading();