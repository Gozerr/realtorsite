const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'https://rgr.ru/educat/';

async function parseRgrCourses() {
  const { data } = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const $ = cheerio.load(data);
  const courses = [];

  $('.accordion-item').each((i, el) => {
    // Дата и время
    const dateTime = $(el).find('.accordion-button .col-md-3').text().trim();
    // Название
    const title = $(el).find('.accordion-button .col-md-9 strong').text().replace(/\s+/g, ' ').trim();
    // Описание
    let description = '';
    $(el).find('.accordion-body .h6.pt-2').each((j, descEl) => {
      description += $(descEl).text().replace(/\s+/g, ' ').trim() + ' ';
    });
    description = description.trim();
    // Ссылка на запись
    let link = '';
    $(el).find('.accordion-body a').each((j, aEl) => {
      const text = $(aEl).text().toLowerCase();
      if (text.includes('смотреть запись')) {
        link = $(aEl).attr('href');
      }
    });

    if (title && link) {
      courses.push({
        title,
        dateTime,
        description,
        link,
      });
    }
  });

  fs.writeFileSync('real_courses.json', JSON.stringify(courses, null, 2), 'utf-8');
  console.log(`Сохранено курсов: ${courses.length}`);
}

parseRgrCourses().catch(console.error);