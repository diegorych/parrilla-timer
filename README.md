# Parrilla Timer

PWA en español rioplatense para seguir seis piezas a la vez. Corre en el navegador, sin dependencias ni servidor de aplicación.

## Desarrollo local

Desde la carpeta del proyecto, con Python 3 instalado:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrí [http://localhost:8000](http://localhost:8000). Usá localhost o HTTPS para probar la instalación y el modo sin conexión. Para probar cambios en archivos ya almacenados por la PWA, incrementá la versión del caché en `sw.js` o eliminá el service worker desde las herramientas del navegador.

## Cómo usarla

1. Tocá o arrastrá cada corte para agregarlo. Podés repetir cualquier corte y elegir el grosor de cada pieza. Tocá **Ver plan y cronómetros**.
2. Tocá **Activar sonido** para probar el aviso y habilitar el audio. Repetilo si recargás la página.
3. Iniciá el **Reloj general** al poner la primera pieza. Consultá **Orden de parrilla** para ver cuándo poner y servir cada tanda. El reloj general funciona de forma independiente.
4. Iniciá el cronómetro de cada pieza cuando la pongas. Podés pausarlo, reanudarlo, reiniciarlo y ajustar la duración con **−5 min** y **+5 min**. Tocá el tiempo restante para editar la duración exacta y el intervalo de vuelta. Un intervalo de 0 desactiva los avisos de vuelta.
5. Cuando gires una pieza, tocá **Marcar vuelta** para iniciar un intervalo nuevo desde ese momento. Al agotarse la cocción, revisá el punto. Si agregás minutos después del aviso, podés reanudar desde el tiempo acumulado.
6. Para instalarla, usá **Instalar aplicación** en un navegador compatible o **Compartir → Añadir a pantalla de inicio** en Safari para iPhone. Tras una visita en línea, la app puede abrir sin conexión.

Los cronómetros y los ajustes se guardan en el navegador. Usá una ventana durante la cocción y mantenela visible para oír los avisos. Al volver tras una suspensión, los cronómetros recuperan el tiempo transcurrido. El navegador puede retrasar o suspender el audio cuando bloqueás la pantalla, cambiás de app o cerrás la ventana.

Para empezar otro asado, tocá **Terminar asado** y confirmá. La app reinicia los relojes y vuelve a la selección de cortes.

## Tiempos de partida

| Pieza | Cocción | Vuelta | Poner en parrilla |
| --- | ---: | ---: | ---: |
| Colita de cuadril | 55 min | 15 min | 00:00 |
| Tira de asado | 45 min | 30 min | 10:00 |
| Chorizos | 30 min | 7 min | 15:00 |
| Provolone | 10 min | — | 35:00 |
| Bife de vacío | 20 min | 10 min | 45:00 |
| Entraña | 8 min | 4 min | 53:00 |

El plan estima servir los chorizos y el provolone juntos en el minuto 45 y los cortes cerca del minuto 65. La colita y la tira empiezan antes de la entrada. Si cambiás la duración de una pieza, el plan recalcula las referencias. El plan es una guía y cada inicio de cocción es manual.

Los tiempos de partida se ajustan según el grosor elegido. El plan supone que las piezas caben con espacio y reciben calor similar. Si no caben, organizá tandas por separado. Verificá la cocción con un termómetro. [Guía de temperaturas del USDA](https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry)

## Subir a GitHub y publicar

1. Creá un repositorio vacío en GitHub. Desde la carpeta del proyecto, ejecutá estos comandos y reemplazá la URL por la de tu repositorio.

   ```sh
   git init -b main
   git add .
   git commit -m "Crear Parrilla Timer"
   git remote add origin https://github.com/TU-USUARIO/parrilla-timer.git
   git push -u origin main
   ```

2. En el repositorio, abrí **Settings → Pages** y seleccioná **GitHub Actions** como fuente.
3. En **Actions**, ejecutá **Deploy GitHub Pages** si el primer push no lo lanzó. Cuando termine, la URL aparece en **Settings → Pages**. Los próximos cambios en `main` disparan el despliegue.

También podés importar el repositorio en Vercel o Netlify como sitio estático. Dejá el comando de compilación vacío y usá la raíz del proyecto como carpeta de publicación. Probá abrirlo con HTTPS para verificar la instalación y el caché offline.

## Archivos

- `index.html` y `styles.css` contienen la interfaz.
- `app.js` contiene los cronómetros, el plan, el audio y la persistencia.
- `manifest.webmanifest`, `sw.js` e `icons/` habilitan instalación y uso sin conexión.
- `.github/workflows/pages.yml` publica el sitio en GitHub Pages.
