import requests
from bs4 import BeautifulSoup
import json
import re

# Cargar historial desde el JSON
with open('spotify_historial.json', 'r', encoding='utf-8') as f:
    historial = json.load(f)

# Descargar la página de kworb
url = 'https://kworb.net/spotify/country/global_daily.html'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# Extraer la fecha desde el título de la página
title_text = soup.find('title').text
fecha_match = re.search(r'(\d{4}/\d{2}/\d{2})', title_text)

if not fecha_match:
    raise ValueError("No se pudo encontrar la fecha en el título de la página.")

fecha_actual = fecha_match.group(1)

# Verificar si ya existe en el historial
if fecha_actual in historial:
    print(f"Los datos para {fecha_actual} ya están almacenados.")
else:
    print(f"Añadiendo datos para {fecha_actual}...")

    tabla = soup.find('table', {'id': 'spotify'})
    filas = tabla.find_all('tr')[1:11]  # Las 10 primeras entradas (sin cabecera)

    top_10 = []
    for fila in filas:
        celdas = fila.find_all('td')
        entry = {
            'Posición': celdas[0].text.strip(),
            'Cambio': celdas[1].text.strip(),
            'Canción / Artista': celdas[2].text.strip(),
            'Fecha de Lanzamiento': celdas[3].text.strip(),
            'Streams': celdas[4].text.strip(),
            'Stream Diff': celdas[5].text.strip(),
            'Total': celdas[6].text.strip(),
        }
        top_10.append(entry)

    # Añadir al historial
    historial[fecha_actual] = {
        'fecha_actualizacion': fecha_actual,
        'top_10': top_10
    }

    # Guardar JSON actualizado
    with open('spotify_historial.json', 'w', encoding='utf-8') as f:
        json.dump(historial, f, indent=4, ensure_ascii=False)

    print(f"Datos de {fecha_actual} guardados correctamente.")
