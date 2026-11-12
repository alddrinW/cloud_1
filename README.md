# Guía de Ejecución de la API Contenerizada

API REST sencilla con Health Check y CRUD conectada a PostgreSQL, lista para ejecutarse con Docker.

---

## 1. Requisitos
- **Docker** y **Docker Compose** instalados.
- **Git** y **cURL** (para probar los endpoints).

---

## 2. Estructura del Proyecto

```text
.
├── docker-compose.yml   # Configuración de los contenedores (API y Base de Datos)
├── Dockerfile           # Imagen Docker de la API (Node.js)
├── init.sql             # Tablas y datos iniciales de la base de datos
├── .env.example         # Plantilla de variables de entorno (sin contraseñas reales)
├── .env                 # Variables de entorno locales
├── package.json         # Dependencias de la aplicación
├── test-api.sh          # Script para probar todas las rutas automáticamente
└── src/                 # Código fuente (servidor Express, rutas y conexión a BD)
```

---

## 3. Preparación de Variables de Entorno

Copia la plantilla de ejemplo para crear tu archivo `.env`:

```bash
cp .env.example .env
```

Variables principales en `.env`:
- `PORT`: Puerto de la API en tu máquina (`3000`).
- `DB_HOST`: Host de la base de datos (`db` para Docker).
- `DB_PORT`: Puerto de PostgreSQL (`5432` o `5433` si el 5432 está ocupado).
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Credenciales de la base de datos.

---

## 4. Comandos de Ejecución

### Iniciar y construir el proyecto:
```bash
docker compose up -d --build
```

### Ver el estado de los contenedores:
```bash
docker compose ps
```
*(Ambos contenedores deben mostrar estado `Up` o `healthy`).*

### Ver logs en tiempo real:
```bash
docker compose logs -f
```

### Detener los contenedores:
```bash
docker compose down
```

### Detener y reiniciar la base de datos desde cero:
```bash
docker compose down -v
```

---

## 5. Inicialización de la Base de Datos

Al iniciar por primera vez, Docker ejecuta automáticamente el archivo `init.sql`, creando la tabla `items` con 3 registros de prueba.

Para consultar los datos directamente en PostgreSQL:
```bash
docker exec -it app_db psql -U cloud_user -d cloud_db -c "SELECT * FROM items;"
```

---

## 6. Pruebas de la API (Health y CRUD)

Puedes probar todos los endpoints de una sola vez ejecutando:
```bash
./test-api.sh
```

O probar cada uno manualmente con `curl`:

### Health Check (Estado de la API y la BD)
```bash
curl http://localhost:3000/health
```

### 1. Listar todos los elementos (GET)
```bash
curl http://localhost:3000/api/items
```

### 2. Crear un nuevo elemento (POST)
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Monitor Gamer", "price": 250.00, "status": "available"}'
```

### 3. Consultar un elemento por ID (GET)
```bash
curl http://localhost:3000/api/items/1
```

### 4. Actualizar un elemento (PUT)
```bash
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop Pro Max", "price": 1600.00}'
```

### 5. Eliminar un elemento (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/items/1
```

---

## 7. Errores Frecuentes y Soluciones

### Error 1: Puerto ocupado (`address already in use: 5432` o `3000`)
- **Causa:** Ya tienes PostgreSQL o Node ejecutándose en tu máquina.
- **Solución:** En tu archivo `.env`, cambia el puerto a uno libre (ejemplo: `DB_PORT=5433` o `PORT=3001`) y vuelve a ejecutar `docker compose up -d`.

### Error 2: La API no se conecta a la Base de Datos (`ECONNREFUSED`)
- **Causa:** En `.env` pusiste `DB_HOST=localhost` en lugar del nombre del contenedor en Docker.
- **Solución:** Asegúrate de que en `.env` esté `DB_HOST=db`.

### Error 3: Los cambios en `init.sql` no se aplican
- **Causa:** Docker no vuelve a ejecutar `init.sql` si el volumen de datos ya fue creado antes.
- **Solución:** Borra el volumen con `docker compose down -v` y vuelve a levantar con `docker compose up -d`.

### Error 4: Modificaste el código pero no se ven los cambios
- **Causa:** Docker está usando la imagen anterior sin compilar.
- **Solución:** Usa siempre la bandera `--build`: `docker compose up -d --build`.

---

## 8. Verificación desde una Copia Limpia

Para comprobar que el proyecto funciona en cualquier computadora desde cero:

```bash
git clone <URL_DEL_REPOSITORIO> prueba-proyecto
cd prueba-proyecto
cp .env.example .env
docker compose up -d --build
./test-api.sh
```
