# DemoEnglish

Aplicación web para practicar vocabulario técnico en inglés. El **backend** (.NET, arquitectura limpia) expone definiciones ([Free Dictionary API](https://dictionaryapi.dev/)) y **herramientas de mazo compatibles con Anki** (importar/exportar texto delimitado). El **frontend** (React, TypeScript, Vite, Tailwind) permite buscar palabras, añadir la tarjeta actual a una lista y descargar un `.txt` para importar en [Anki](https://apps.ankiweb.net/).

**`.apkg`:** el backend descomprime el ZIP, abre `collection.anki2` / `collection.anki21` con SQLite y lee la tabla `notes` (campo `flds` separado por U+001F). Se usa el **primer campo** como frente y el **resto** como reverso; se eliminan etiquetas HTML de forma básica. Límite por petición: **10.000 notas**; tamaño máximo de subida **10 GiB** (`UploadLimits.MaxMultipartBytes` en Kestrel, `FormOptions`, IIS y `[RequestFormLimits]`). Los mazos con modelos muy personalizados pueden necesitar exportación a texto desde Anki.

## Funcionalidades

### Resumen

| Área | Qué ofrece |
|------|------------|
| **Diccionario** | Búsqueda de palabras; definición principal; categoría gramatical; IPA; audio de pronunciación si la API lo devuelve; lectura en voz alta (TTS) con voz y velocidad configurables; añadir la entrada al mazo Anki con un clic. |
| **Mazo Anki (navegador)** | Importar `.apkg` o texto (`.txt` / `.tsv` / `.csv`); modos **añadir** o **reemplazar** lista; reproducir y mostrar medios incrustados del `.apkg`; exportar `.txt` compatible con Anki; descargar `.txt` de ejemplo; lista **A–Z** con búsqueda; vaciar mazo o quitar tarjetas. |
| **Estudio (modal)** | Tarjeta en **dos partes** (palabra/medios vs. definición y resto); navegación entre tarjetas; **dictado** con reconocimiento de voz (`en-US`) para practicar pronunciación sin sustituir el contenido de la tarjeta. |
| **Ajustes** | Voz en inglés y velocidad del **Speech Synthesis** del navegador; preferencias en `localStorage`; lectura en voz alta coherente en diccionario y modal. |
| **API** | Definiciones agregadas; import/export de mazos (texto y `.apkg`); ejemplo descargable; CORS y Swagger en desarrollo (véase sección Backend). |

### Diccionario (UI)

- Barra de búsqueda y manejo de errores de red o palabra no encontrada.
- Tarjeta de resultado con **Play** para audio remoto y botón de **read aloud** sobre la definición (respeta selección de texto dentro del párrafo cuando aplica).
- **Add to Anki list** construye el reverso con IPA y definición principal.

### Mazo Anki (UI)

- **Import file:** `.apkg` (colección SQLite dentro del ZIP) o delimitado por tab/comas; HTML en campos se reduce a texto en backend.
- Tras importar `.apkg`, los `[sound:]` y `[img:]` se enlazan a medios extraídos; el orden sigue la lógica de `extractMediaEmbedsInOrder` en `frontend/src/lib/ankiCardLayout.ts`.
- **Export for Anki** genera descarga vía API (UTF-8 con BOM, tab, línea `#separator:tab`).
- **Sample .txt** enlaza al endpoint de ejemplo del backend.

### Audio, TTS y dictado

- **Ajustes → Read aloud:** elección de voz `en-*` (o todas si no hay inglés) y velocidad 0.5–1.5×.
- **Dictado (Parte 2 del modal):** Web Speech API; funciona mejor en **Chrome** o **Edge**; requiere **HTTPS** o **localhost** y permiso de micrófono.

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
