const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'https://expomap.ru/expo/theme/nedvizhimost/';

async function parseEvents() {
  const { data } = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const $ = cheerio.load(data);
  const events = [];

  $('.cl-item').each((i, el) => {
    const title = $(el).find('.cli-title a').text().trim();
    const description = $(el).find('.cli-descr').text().trim();
    const dateText = $(el).find('.cli-date').text().replace(/\s+/g, ' ').trim();
    const startDate = $(el).find('meta[itemprop="startDate"]').attr('content') || '';
    const endDate = $(el).find('meta[itemprop="endDate"]').attr('content') || '';
    const place = $(el).find('.cli-place').text().replace(/\s+/g, ' ').trim();
    const link = 'https://expomap.ru' + ($(el).find('.cli-title a').attr('href') || '');
    const img = $(el).find('.cli-pict img').attr('src') 
      ? 'https://expomap.ru' + $(el).find('.cli-pict img').attr('src') 
      : '';

    if (title) {
      events.push({
        title,
        description,
        dateText,
        startDate,
        endDate,
        place,
        link,
        img
      });
    }
  });

  fs.writeFileSync('real_events.json', JSON.stringify(events, null, 2), 'utf-8');
  console.log(`Сохранено мероприятий: ${events.length}`);
}

parseEvents().catch(console.error); 