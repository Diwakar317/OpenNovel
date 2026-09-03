
async function test() {
  const r = await fetch('https://ranobes.net/chapters/1205557/', {headers:{'User-Agent':'Mozilla/5.0'}});
  const text = await r.text();
  
  // Find the exact script block containing window.__DATA__
  const scriptMatch = text.match(/<script[^>]*>\s*window\.__DATA__\s*=\s*([\s\S]+?)<\/script>/i);
  if (scriptMatch) {
    let jsonStr = scriptMatch[1].trim();
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
    
    try {
      const data = JSON.parse(jsonStr);
      console.log('SUCCESS! Chapters:', data.chapters.length, 'Total Pages:', data.pages_count);
    } catch (e) {
      console.log('JSON Parse Error!');
      console.log('End of string:', jsonStr.substring(jsonStr.length - 100));
    }
  } else {
    console.log('No script match found.');
  }
}
test();
