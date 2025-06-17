// coffee-endpoint-test.js
const fetch = require('node-fetch');

async function testCoffeeEndpoint() {
  console.log('☕ Coffee Reading Endpoint Test...');
  
  // Basit bir test resmi (1x1 pixel PNG)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('http://localhost:3000/api/read-coffee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: testImage
      })
    });

    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Coffee Reading Başarılı!');
      console.log('🎭 Fal Yorumu:', data.response);
    } else {
      const errorData = await response.json();
      console.error('❌ Hata:', errorData);
    }
    
  } catch (error) {
    console.error('🚨 Test Hatası:', error.message);
  }
}

testCoffeeEndpoint();