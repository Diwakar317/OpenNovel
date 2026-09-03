async function test() {
  const r = await fetch('https://ranobes.net/chapters/1206783/', {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const text = await r.text();
  console.log('Length:', text.length);
  // check for chapter URLs
  const matches = text.match(/href="([^"]+?\.html)"/g);
  if (matches) {
    console.log('Found matches:', matches.slice(0, 10));
  } else {
    console.log('No .html hrefs found.');
    // Check if it's returning JSON or something else
    console.log('Starts with:', text.substring(0, 100));
  }
}
test();
