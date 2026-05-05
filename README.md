# DemoEnglish

Aplicación web para practicar vocabulario técnico en inglés. El **backend** (.NET, arquitectura limpia) expone definiciones ([Free Dictionary API](https://dictionaryapi.dev/)) y **herramientas de mazo compatibles con Anki** (importar/exportar texto delimitado). El **frontend** (React, TypeScript, Vite, Tailwind) permite buscar palabras, añadir la tarjeta actual a una lista y descargar un `.txt` para importar en [Anki](https://apps.ankiweb.net/).

**`.apkg`:** el backend descomprime el ZIP, abre `collection.anki2` / `collection.anki21` con SQLite y lee la tabla `notes` (campo `flds` separado por U+001F). Se usa el **primer campo** como frente y el **resto** como reverso; se eliminan etiquetas HTML de forma básica. Límite por petición: **10.000 notas**; tamaño máximo de subida **10 GiB** (`UploadLimits.MaxMultipartBytes` en Kestrel, `FormOptions`, IIS y `[RequestFormLimits]`). Los mazos con modelos muy personalizados pueden necesitar exportación a texto desde Anki.

## Funcionalidades

### Resumen

| Área | Qué ofrece |
|------|------------|
| **Diccionario** | Búsqueda de palabras; definición principal; categoría gramatical; IPA; audio de pronunciación si la API lo devuelve; lectura en voz alta (TTS) con voz y velocidad configurables; añadir la entrada al mazo Anki con un clic. |
| **Mazo Anki (navegador)** | Importar `.apkg` o texto (`.txt` / `.tsv` / `.csv`); modos **añadir** o **reemplazar** lista; reproducir y mostrar medios incrustados del `.apkg`; exportar `.txt` compatible con Anki; descargar `.txt` de ejemplo; lista **A–Z** con búsqueda; vaciar mazo o quitar tarjetas. |
| **Estudio (modal)** | Tarjeta en **dos partes**; **vocabulario:** palabra/medios vs. definición (y bloques del reverso); **entrevista (CSV):** pregunta vs. respuesta/guía. En **Parte 2**, **Previous card** / **Next card** en **orden A–Z**; **dictado** (`en-US`); **Compare to** + **Word check** (vocabulario: Definition/Translation/Examples; entrevista: Answer). |
| **Ajustes** | Voz en inglés y velocidad del **Speech Synthesis** del navegador; preferencias en `localStorage`; lectura en voz alta coherente en diccionario y modal. |
| **API** | Definiciones agregadas; import/export de mazos (texto y `.apkg`); ejemplo descargable; CORS y Swagger en desarrollo (véase sección Backend). |

### Diccionario (UI)

- Barra de búsqueda y manejo de errores de red o palabra no encontrada.
- Tarjeta de resultado con **Play** para audio remoto y botón de **read aloud** sobre la definición (respeta selección de texto dentro del párrafo cuando aplica).
- **Add to Anki list** construye el reverso con IPA y definición principal.

### Mazo Anki (UI)

- **Import file:** `.apkg` (colección SQLite dentro del ZIP) o delimitado por tab/comas; HTML en campos se reduce a texto en backend.
- **Import interview CSV:** importación en el navegador de un **CSV UTF-8 con cabecera** (mismas reglas de columnas que `tools/AnkiInterviewExporter`: *Front* / *Pregunta* / *Question* y *Back* / *Guía* / *Answer* / *Respuesta*; delimitador `,` o `;` según la primera línea; campos entre comillas soportados). Las tarjetas se marcan como `kind: interview`: en el modal, **Parte 1 = pregunta** y **Parte 2 = guía/respuesta**; el dictado y *Word check* comparan con el **Answer** completo.
- Tras importar `.apkg`, los `[sound:]` y `[img:]` se enlazan a medios extraídos; el orden sigue la lógica de `extractMediaEmbedsInOrder` en `frontend/src/lib/ankiCardLayout.ts`.
- **Export for Anki** genera descarga vía API (UTF-8 con BOM, tab, línea `#separator:tab`) — solo *front* / *back*; al reimportar por API se pierde la distinción *interview* (vuelve a vocabulario).
- **Sample .txt** enlaza al endpoint de ejemplo del backend.

### Modal de tarjeta (Parte 1 y Parte 2)

- **Parte 1:** palabra principal y medios asociados (audio/imagen del `.apkg` cuando aplica).
- **Parte 2:** definición, traducción y ejemplos según el modelo de la tarjeta; controles **Remove** y **Close**.
- **Navegación entre tarjetas (solo Parte 2):** botones **Previous card** y **Next card** para ir a la tarjeta anterior o siguiente en **orden alfabético A–Z** (el mismo que la lista y el contador “Card X of Y”). La primera tarjeta no muestra anterior; la última no muestra siguiente.
- **Part 1** en el pie devuelve a la primera cara sin cambiar de tarjeta.

### Audio, TTS y dictado

- **Ajustes → Read aloud:** elección de voz `en-*` (o todas si no hay inglés) y velocidad 0.5–1.5×.
- **Dictado (Parte 2 del modal):** Web Speech API; funciona mejor en **Chrome** o **Edge**; requiere **HTTPS** o **localhost** y permiso de micrófono. El texto transcrito no sustituye el contenido de la tarjeta; sirve para práctica oral.

### Validación del dictado (Word check)

- **Compare to:** selector para comparar el texto del área de dictado con **un solo bloque** de la tarjeta: **Definition**, **Translation** o **Examples** (solo aparecen los bloques que tengan texto).
- **Word check:** debajo del cuadro de texto, vista previa coloreada del mismo transcript: **verde** si la palabra coincide con la referencia (tras normalizar minúsculas y signos; útil frente a errores del reconocimiento); **rojo** si no coincide, es extra u está desalineada. La alineación usa **edición a nivel de palabra** (inserciones, borrados y sustituciones) para que un fallo no descoloque todo el párrafo.
- Implementación: `frontend/src/lib/dictationWordAlign.ts`; la interfaz está en `Part2Dictation` dentro de `AnkiCardDetailModal.tsx`.

## Requisitos

- [.NET SDK](https://dotnet.microsoft.com/download) (este repositorio usa **net10.0**). Si necesitas otra versión, ajusta `TargetFramework` en los `.csproj` y el SDK correspondiente.
- [Node.js](https://nodejs.org/) 20+ recomendado (Vite).

## Backend (API)

Desde la raíz del repositorio:

```bash
dotnet restore DemoEnglish.slnx
dotnet run --project src/DemoEnglish.Api/DemoEnglish.Api.csproj
```

Por defecto la API escucha en **http://localhost:5183** (perfil `http` en `launchSettings.json`). Endpoints principales:

- `GET /api/dictionary/entries/{word}` — definición simplificada (fonética, audio, definición principal).
- `POST /api/anki/import` — `multipart/form-data` con campo `file`: **`.apkg`** (paquete Anki) o **`.txt` / `.tsv` / `.csv`** en texto plano. Respuesta JSON `{ cards, warnings }`.
- `POST /api/anki/export` — cuerpo JSON `{ "cards": [ { "front": "...", "back": "..." } ] }`. Devuelve **UTF-8 con BOM**, separador tab, línea `#separator:tab` (listo para Anki → *Import*).
- `GET /api/anki/sample` — descarga un `.txt` de ejemplo.

En **Development**, Swagger UI está en **http://localhost:5183/swagger** (también se abre al lanzar el proyecto con F5 si usas el perfil `http`/`https`).

CORS permite orígenes configurados en `appsettings.json` (`Cors:AllowedOrigins`), incluido `http://localhost:5173` para Vite.

### Pruebas

```bash
dotnet test DemoEnglish.slnx
```

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Vite suele usar **http://localhost:5173**. La URL base del API se define en `frontend/.env.development` (solo el **origen**; puedes pegar también la URL de Swagger y se normaliza):

```env
VITE_API_BASE_URL=https://localhost:7282/swagger/index.html
```

Las peticiones van a `https://localhost:7282/api/...`. Ejecuta el backend con el perfil **https** para usar el puerto 7282. Si el certificado de desarrollo no es de confianza: `dotnet dev-certs https --trust`.

### Tamaño del modal de tarjeta Anki (Vite)

Variables opcionales de entorno para el panel del modal:

| Variable | Descripción |
|----------|-------------|
| `VITE_ANKI_MODAL_MAX_WIDTH` | Ancho máximo del panel (CSS, p. ej. `min(66.15rem, 96vw)`). |
| `VITE_ANKI_MODAL_MAX_HEIGHT` | Altura máxima (valor interior del `min` con el viewport). |
| `VITE_ANKI_MODAL_MAX_HEIGHT_VP` | Tope en viewport, p. ej. `92dvh`. |

Definiciones por defecto en `frontend/src/config/ankiModalLayout.ts`.

### Producción (build estático)

```bash
cd frontend
npm run build
```

Los artefactos quedan en `frontend/dist/`.

## Estructura del backend (Clean Architecture)

| Proyecto | Rol |
|----------|-----|
| `DemoEnglish.Domain` | Núcleo de dominio (extensible). |
| `DemoEnglish.Application` | Diccionario (`IDictionaryLookupService`), importación Anki texto (`IAnkiPlainTextImportParser`), `.apkg` (`IAnkiApkgImportReader`) y DTOs. |
| `DemoEnglish.Infrastructure` | Cliente HTTP del diccionario, lectura SQLite de colección Anki y registro de servicios. |
| `DemoEnglish.Api` | Controladores, CORS, composición de dependencias. |

## Licencia y datos

Las definiciones provienen de [dictionaryapi.dev](https://dictionaryapi.dev/) (Free Dictionary API). Anki es marca de Ankitect Pty Ltd.; esta app solo genera texto compatible con la importación descrita en la [documentación de Anki](https://docs.ankiweb.net/).
