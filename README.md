# Space Apps · Community badges

Sitio responsive en español con generador de imágenes para redes, inspirado en el flujo de https://devday.ailabs.sv/ y la identidad visual de https://www.spaceappschallenge.org/.

## Ejecutar

Requiere Node.js 20 o superior. No hay dependencias que instalar.

```sh
npm run dev
```

Abrir http://127.0.0.1:4173.

```sh
npm run check
npm run build
```

El build produce `dist/`, publicable en cualquier hosting estático. No requiere servidor de aplicación, base de datos, claves ni variables de entorno.

## Funcionalidad

- Nombre, rol/equipo y ciudad, con vista previa inmediata.
- Foto JPG, PNG o WebP de hasta 8 MB (máximo 40 megapíxeles), zoom y encuadre vertical.
- Avatar ilustrado cuando no se carga foto.
- Tres paletas: Azul misión, Espacio y Supernova.
- PNG de 1080 × 1080 para post y 1080 × 1920 para story.
- Las fotos se procesan en memoria en el navegador; no se suben ni se guardan.
- Validación de nombre, imagen y errores de exportación.

## Personalizar el evento

Editar `config.js`: `city` precompleta la ciudad y `edition` aparece en el badge. Se dejan vacíos hasta confirmar la sede y edición. Los textos y el enlace al sitio oficial están en `index.html`; el diseño exportado está en `app.js` y los estilos del sitio en `styles.css`.

El sitio no registra asistentes ni publica una galería. La creación del badge no constituye inscripción al evento.

## Desplegar desde Git

Este directorio es un repositorio Git local. Crear un repositorio vacío en GitHub y luego ejecutar, reemplazando la URL por la real:

```sh
git remote add origin https://github.com/TU-ORGANIZACION/spaceapps-social.git
git push -u origin main
```

- **Vercel:** importar el repositorio. `vercel.json` configura build y directorio de salida.
- **Netlify:** importar el repositorio. `netlify.toml` contiene la configuración.
- **Cloudflare Pages:** conectar el repositorio, usar `npm run build` y `dist` como directorio de salida.
- **Hosting estático:** subir únicamente el contenido de `dist/`.

No se creó un repositorio remoto ni se publicó el sitio en esta entrega.

## Marca y recursos

El logo local proviene del sitio oficial: https://assets.spaceappschallenge.org/media/images/Space_Apps_Logo_Color_and_White.width-440.jpegquality-60.png

La marca y el logo pertenecen a sus titulares. Este proyecto se presenta como generador de la comunidad. No afirma ser una plataforma oficial de NASA. Las ilustraciones orbitales y el avatar son gráficos propios realizados con CSS y Canvas. No hay fuentes ni librerías externas que deban cargarse para exportar una imagen.
