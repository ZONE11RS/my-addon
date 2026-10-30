const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
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

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
