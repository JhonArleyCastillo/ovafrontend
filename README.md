# 📖 Asistente Inteligente Multimodal

Proyecto que combina reconocimiento de voz, análisis de texto con un modelo LLM, generación de voz y análisis de imágenes, todo integrado en una aplicación web.

---

📌 Descripción

Este asistente permite al usuario:
✅ Hablar para hacer consultas.  
✅ Subir imágenes para analizarlas.  
✅ Recibir respuestas textuales y habladas.  
✅ Detectar objetos y generar descripciones automáticas de imágenes.

---

📌 Arquitectura

```
+---------------------+
|  Frontend (React)   |
|   - Captura voz     |
|   - Sube imágenes   |
|   - Muestra texto   |
|   - Reproduce voz   |
+---------------------+
          |
          v
+---------------------+
|  Backend (FastAPI)  |
|   - STT (Voz→Texto) |
|   - LLM (Texto→Texto)|
|   - TTS (Texto→Voz) |
|   - YOLO/BLIP       |
+---------------------+
          |
          v
+---------------------+
|  Hugging Face API   |
|   - LLM (Mistral)   |
|   - TTS (MMS-TTS)   |
|   - BLIP (Caption)  |
+---------------------+
```

                                 +------------------+
                                 |                  |
                                 |     Usuario      |
                                 |                  |
                                 +---------+--------+
                                           |
                                           | Interactúa
                                           v
+------------------+              +------------------+               +------------------+
|                  |  WebSocket   |                  |  HTTP POST    |                  |
|  Servidor        | <----------> |  Componente      | ------------> |  API de Análisis |
|  WebSocket       |  Mensajes    |  Chat            |  Imágenes     |  de Imágenes     |
|                  |              |                  |               |                  |
+------------------+              +------------------+               +------------------+
                                      |       ^
                                      |       |
                                      v       |
                             +------------------+
                             |                  |
                             |  Almacenamiento  |
                             |  de Estado       |
                             |                  |
                             +------------------+
---

📂 Estructura de Archivos

Backend (`/backend`)

```
backend/
│── main.py              # Servidor FastAPI
│── llm.py                # Manejo de consultas al LLM (Hugging Face)
│── tts.py                 # Generador de voz
│── stt.py                 # Conversión de voz a texto
│── image_analysis.py      # Análisis de imágenes
│── config.py               # Claves de API
│── requirements.txt        # Librerías necesarias
```

Frontend (`/frontend/src`)

```
frontend/src/
│── App.js                  # Componente principal
│── api.js                   # Conexión con WebSockets
│── index.js                  # Punto de entrada React
│── components/
│   ├── Chat.js               # Chat de texto
│   ├── VoiceRecorder.js       # Grabador de voz
│   ├── ImageUploader.js       # Subir imagen
│   ├── ImageResult.js         # Mostrar análisis de imagen
```

---

✅ Requisitos

📥 Backend
`requirements.txt`:
```
fastapi==0.110.0
uvicorn==0.29.0
speechrecognition==3.10.0
transformers==4.39.3
torch==2.2.1
pyttsx3==2.90
google-cloud-texttospeech==2.14.1
websockets==12.0
numpy==1.26.4
opencv-python==4.9.0.80
ultralytics==8.1.24
requests==2.31.0
```

---

🚀 Ejecución

1️⃣ Iniciar Backend
```
cd backend
uvicorn main:app --reload
```

2️⃣ Iniciar Frontend
```
cd frontend
npm install
npm start
```

---

🌐 Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| WebSocket | `/ws` | Enviar audio, recibir texto + audio |
| POST | `/procesar-imagen` | Enviar imagen, recibir objetos + descripción |

---

💬 Flujo Completo (Voz)

```
1. Usuario habla
2. Frontend envía audio al backend
3. Backend convierte a texto (STT)
4. Backend consulta LLM (Mistral-7B)
5. Backend convierte texto a voz (TTS)
6. Respuesta (texto+voz) regresa al frontend
7. Frontend muestra texto y reproduce voz
```

---

📷 Flujo Completo (Imagen)

```
1. Usuario sube imagen
2. Frontend la envía al backend
3. Backend detecta objetos (YOLO)
4. Backend genera descripción (BLIP)
5. Respuesta regresa al frontend
6. Frontend muestra objetos y descripción
```

---

🔑 Configuración de Claves (config.py)

```python
# backend/config.py
HF_API_KEY = "tu_huggingface_token"
HF_MODELO_LLM = "mistralai/Mistral-7B-Instruct-v0.1"
HF_MODELO_TTS = "facebook/mms-tts-eng"
HF_MODELO_CAPTION = "Salesforce/blip-image-captioning-base"
```

---

📌 Funcionalidades

| Tipo | Descripción |
|---|---|
| 🎙️ Asistente de Voz | Habla y recibe respuesta hablada |
| 💬 Chat | Muestra respuestas textuales |
| 📷 Análisis de Imagen | Detecta objetos y describe imágenes |

---

🔒 Seguridad (Mejoras Futuras)

| Recomendación | Detalle |
|---|---|
| 🔒 Reemplazar config.py por `.env` | Para mayor seguridad de credenciales |
| 🔒 CORS restrictivo | Solo permitir origenes seguros |
| 🔒 Validar tipo y tamaño de archivo | Al subir imágenes |
| 🔒 Log de actividad | Guardar histórico de interacciones |

---

📊 Posibles Mejoras Futuras

| Idea | Descripción |
|---|---|
| 🧠 Memoria Conversacional | El LLM recuerda contexto anterior |
| 📊 Dashboard | Métricas de uso (cantidad de imágenes, audios) |
| 🔗 Integraciones | Conectar APIs externas (ej: clima real) |
| ☁️ Deploy | Subir a AWS o Render para acceso global |

---

🗂️ Estructura Recomendada Final

```
proyecto/
├── backend/
│   ├── main.py
│   ├── llm.py
│   ├── tts.py
│   ├── stt.py
│   ├── image_analysis.py
│   ├── config.py
│   ├── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── api.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── Chat.js
│   │   │   ├── VoiceRecorder.js
│   │   │   ├── ImageUploader.js
│   │   │   ├── ImageResult.js
│   ├── package.json
│   ├── public/
├── README.md
```

---

🎁 Autor / Colaboradores

Creador: Jhon Arley Castillo Vitovis
Asistencia: Agentcopilot (Documentación, Código Base, Flujo)

---
