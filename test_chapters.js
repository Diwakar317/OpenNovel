const cheerio = require('cheerio');

async function test() {
  const r = await fetch('https://ranobes.net/chapters/1206783/', {
    headers: {
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  const text = await r.text();
  const $ = cheerio.load(text);
  console.log('H1:', $('h1').first().text().trim());
  console.log('OG Title:', $('meta[property="og:title"]').attr('content'));
  console.log('OG Image:', $('meta[property="og:image"]').attr('content'));
  console.log('Title Tag:', $('title').text());
  
  // Find chapters
  console.log('Body length:', $('body').text().length);
  console.log('Any links?:', $('a').length);
  $('a').each((i, el) => {
    if (i < 20) console.log('Link:', $(el).attr('href'), $(el).text().trim());
  });
  console.log('HTML Snippet:', $('body').html().substring(0, 1000));
}
test();
