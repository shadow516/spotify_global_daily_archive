
<!-- Propuesta de carpeta en tu proyecto Netlify:
/netlify/functions/spotifyScraper.js -->

// spotifyScraper.js

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

exports.handler = async function () {
  const url = 'https://kworb.net/spotify/country/global_daily.html';
  const res = await fetch(url);
  const text = await res.text();
  const $ = cheerio.load(text);
  const titleText = $('title').text();
  const dateMatch = titleText.match(/(\d{4}\/\d{2}\/\d{2})/);

  if (!dateMatch) return { statusCode: 500, body: 'Date not found' };
  const date = dateMatch[1];

  const jsonFile = './spotify_historial.json';
  let data = {};
  if (fs.existsSync(jsonFile)) {
    data = JSON.parse(fs.readFileSync(jsonFile));
  }

  if (data[date]) return { statusCode: 200, body: 'Already exists' };

  const rows = $('table#spotify tr').slice(1, 11);
  const top10 = [];
  rows.each((i, el) => {
    const cells = $(el).find('td');
    top10.push({
      'Posición': $(cells[0]).text().trim(),
      'Cambio': $(cells[1]).text().trim(),
      'Canción / Artista': $(cells[2]).text().trim(),
      'Fecha de Lanzamiento': $(cells[3]).text().trim(),
      'Streams': $(cells[4]).text().trim(),
      'Stream Diff': $(cells[5]).text().trim(),
      'Total': $(cells[6]).text().trim(),
    });
  });

  data[date] = { fecha_actualizacion: date, top_10: top10 };
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
  return { statusCode: 200, body: 'OK' };
};

<!-- Luego en tu netlify.toml -->

[functions]
  directory = "netlify/functions"

[scheduled]
  cron = "0 9 * * *"  # a las 9 AM UTC diario
  command = "netlify functions:invoke spotifyScraper"

<!-- ✅ Así puedes scrapear diariamente aunque tu HTML esté en Netlify -->
