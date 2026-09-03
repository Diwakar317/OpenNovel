async function test() {
  console.log("Testing sync API...");
  const res = await fetch('http://localhost:3000/api/novels/a4d38434-056f-4603-aca4-a362a9ebaa30/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapters: 500 }) // fetching 500 chapters
  });
  const data = await res.json();
  console.log(data);
}
test();
