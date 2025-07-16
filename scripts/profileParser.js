const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const LOGIN_URL = 'https://olimp.vtcrm.ru/login';
const PROFILE_URL = 'https://olimp.vtcrm.ru/agent/34';

const EMAIL = '9301375017r@gmail.com';
const PASSWORD = 'yE56Sc90L';

async function loginAndGetProfileHtml() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  // 1. Получаем страницу логина, чтобы получить csrf_token (если требуется)
  const loginPage = await client.get(LOGIN_URL);
  const $ = cheerio.load(loginPage.data);
  // const csrf = $('input[name="csrf_token"]').val(); // если потребуется

  // 2. Логинимся
  await client.post(LOGIN_URL, new URLSearchParams({
    email: EMAIL,
    password: PASSWORD,
    // csrf_token: csrf, // если потребуется
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    maxRedirects: 0,
    validateStatus: status => status === 302 || status === 200,
  });

  // 3. Получаем страницу профиля
  const profilePage = await client.get(PROFILE_URL);
  return profilePage.data;
}

function parseProfile(html) {
  const $ = cheerio.load(html);

  const name = $('.pr_name').text().trim() || $('h1').first().text().trim();
  const photo = $('.pr_foto img').attr('src') || $('img[alt]').attr('src');
  const phone = $('.phone').text().trim() || $('body').text().match(/\+7\(\d{3}\)\d{3}-\d{2}-\d{2}/)?.[0] || $('body').text().match(/7\d{10}/)?.[0];
  const email = $('.pr_info .flex:contains("Email:")').find('div').last().text().trim() || $('body').text().match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,6}/)?.[0];
  const telegram = $('.pr_tg').parent('a').attr('href') || $('a[href^="https://t.me/"]').attr('href');
  const position = $('.pr_data_block1').find('div:contains("Должность:")').text().replace('Должность:', '').trim();
  const birthdate = $('.pr_info .flex:contains("Дата рождения:")').find('div').last().text().trim() || $('body').text().match(/\d{2}\.\d{2}\.\d{2,4}/)?.[0];

  return {
    name,
    photo,
    phone,
    email,
    telegram,
    position,
    birthdate,
  };
}

(async () => {
  try {
    const html = await loginAndGetProfileHtml();
    const profile = parseProfile(html);
    console.log(profile);
  } catch (err) {
    console.error('Ошибка при парсинге профиля:', err);
  }
})();