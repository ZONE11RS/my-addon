const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const builder = new addonBuilder({
    id: 'org.akwam.addon',
    version: '1.0.0',
    name: 'Akwam Addon',
    resources: ['stream'],
    types: ['movie', 'series'],
    catalogs: []
});

builder.defineStreamHandler(async (args) => {
    try {
        // البحث في موقع أكوام
        const searchUrl = `https://akwams.org/?s=${encodeURIComponent(args.id)}`; 
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        const streams = [];
        
        // استخراج الروابط من أزرار السيرفرات
        $('.server-btn').each((index, element) => {
            const link = $(element).attr('data-link');
            if (link) {
                streams.push({
                    title: `Akwam Server ${index + 1}`,
                    url: link 
                });
            }
        });

        return { streams };

    } catch (error) {
        console.error(error);
        return { streams: [] };
    }
});

// --- الجزء الخاص بـ Vercel (بدلاً من serveHTTP) ---
module.exports = async (req, res) => {
    // السماح لـ Stremio بالوصول (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // إذا طلب Stremio ملف الإعدادات (manifest)
    if (req.url === '/manifest.json') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(builder.getInterface().manifest);
        return;
    }

    // إذا طلب Stremio روابط البث (stream)
    if (req.url.startsWith('/stream/')) {
        try {
            const parts = req.url.split('/');
            const type = parts[2]; 
            const id = parts[3].split('.')[0]; 
            
            const result = await builder.getInterface().get('stream', type, id);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
        return;
    }

    // أي طلب آخر
    res.status(404).send('Not Found');
};
