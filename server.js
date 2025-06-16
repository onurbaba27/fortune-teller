const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Kahve Falı API Çağrısı
app.post('/api/read-coffee', async (req, res) => {
    const { base64Image } = req.body;

    if (!base64Image) {
        return res.status(400).json({ error: 'Görüntü verisi eksik.' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                                    data: base64Image
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Bilinmeyen hata'}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.json({ response: data.candidates[0].content.parts[0].text });
        } else {
            throw new Error("API'den geçerli bir yanıt alınamadı.");
        }
    } catch (error) {
        console.error("Kahve Falı Hatası:", error.message);
        res.status(500).json({ error: "Fincan bulanıklaştı... Şekilleri okuyamadım. Lütfen tekrar deneyin." });
    }
});

// Mistik Falcı Sohbet API Çağrısı
app.post('/api/chat', async (req, res) => {
    const { message, conversationHistory } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mesaj eksik.' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{
                            text: "Sen mistik bir falcısın. Adın 'Mistik Falcı'. Kendini asla yapay zeka olarak tanıtma. Her zaman gizemli, bilge ve biraz sır dolu bir üslup kullan. Cevaplarında astroloji, numeroloji, tarot ve diğer kehanet yöntemlerinden bahsedebilirsin. Cevapların kısa ve özlü olsun, maksimum 3-4 cümle. Bazen soruyu cevaplamadan önce 'Kartlara bakıyorum...', 'Kristal küremde görüyorum ki...', 'Yıldızların konumuna göre...' gibi girişler yap. Türkçe cevaplar ver ve asla İngilizce konuşma."
                        }]
                    },
                    contents: conversationHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 100
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Bilinmeyen hata'}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.json({ response: data.candidates[0].content.parts[0].text });
        } else {
            throw new Error("API'den geçerli bir yanıt alınamadı.");
        }
    } catch (error) {
        console.error("Sohbet Hatası:", error.message);
        res.status(500).json({ error: "Kristal kürem bulanıklaştı... Lütfen tekrar deneyin." });
    }
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});