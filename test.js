const https = require('https');
https.get('https://unsplash.com/es/fotos/calculo-matematico-05A-kdOH6Hw', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const m = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/);
    console.log(m ? m[0] : 'not found');
  });
});
