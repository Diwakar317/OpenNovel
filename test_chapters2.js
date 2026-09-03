const cheerio = require('cheerio');
async function test() { 
  const r = await fetch('https://ranobes.net/1206783-an-alchemists-path-to-eternity.html', {headers:{'User-Agent':'Mozilla/5.0'}}); 
  const t = await r.text(); 
  const $ = cheerio.load(t); 
  const links = $('a[href*=".html"]').filter((i, el) => $(el).attr('href').includes('an-alchemists-path-to-eternity')); 
  console.log('Total chapter links found on reading page:', links.length); 
} 
test();
