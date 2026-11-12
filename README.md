# Documentación de Ejecución Reproducible de una API Contenerizada

Proyecto desarrollado para la asignatura **Programación en la Nube**.  
Contiene una API REST desarrollada con **Node.js / Express** conectada a un motor de base de datos relacional **PostgreSQL 16**, ambos orquestados y contenerizados mediante **Docker** y **Docker Compose**.

---

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Preparación de Variables de Entorno](#preparación-de-variables-de-entorno)
5. [Comandos de Construcción, Inicio y Detención](#comandos-de-construcción-inicio-y-detención)
6. [Inicialización y Verificación de la Base de Datos](#inicialización-y-verificación-de-la-base-de-datos)
7. [Guía de Peticiones HTTP (Health Check y CRUD)](#guía-de-peticiones-http-health-check-y-crud)
8. [Errores Frecuentes, Causas y Soluciones](#errores-frecuentes-causas-y-soluciones)
9. [Verificación desde una Copia Limpia (Reproducibilidad)](#verificación-desde-una-copia-limpia-reproducibilidad)

---

## 1. Descripción General

Esta solución implementa una arquitectura basada en microservicios contenerizados que garantiza la portabilidad y reproducibilidad del entorno de desarrollo y despliegue:
- **Servicio API (`app_api`)**: Aplicación Node.js/Express con endpoints de monitoreo (`/health`) y operaciones CRUD sobre una entidad de catálogo (`items`). Implementa apagado elegante (*graceful shutdown*), validación de esquemas y logs de solicitudes.
- **Servicio Base de Datos (`app_db`)**: Instancia de PostgreSQL 16 Alpine con inicialización automática de esquema y datos semilla (seed data) mediante scripts montados en `/docker-entrypoint-initdb.d/`.
- **Red Aislada (`app_network`)**: Red de tipo *bridge* que permite la comunicación interna por nombre de host entre la API y la base de datos.
- **Volumen Persistente (`pgdata`)**: Almacenamiento desacoplado para asegurar la persistencia de datos independientemente del ciclo de vida del contenedor.

---

## 2. Requisitos del Sistema

Antes de iniciar la ejecución, asegúrese de tener instalados los siguientes componentes en el sistema anfitrión:

| Herramienta | Versión Recomendada | Comando de Comprobación |
| :--- | :--- | :--- |
| **Git** | >= 2.25 | `git --version` |
| **Docker Engine** | >= 20.10.x | `docker --version` |
| **Docker Compose** | >= v2.20.x (Plugin v2) | `docker compose version` |
| **cURL** (o Postman / HTTPie) | >= 7.68 | `curl --version` |
| **jq** *(opcional, para dar formato a JSON)* | >= 1.6 | `jq --version` |

> [!NOTE]
> No es necesario tener instalado Node.js o PostgreSQL en la máquina física; Docker se encarga de descargar las imágenes e instalar las dependencias dentro de los contenedores.

---

## 3. Estructura del Proyecto

```text
.
├── .dockerignore              # Exclusiones de archivos para la imagen Docker
├── .env.example               # Plantilla pública de variables de entorno (sin credenciales reales)
├── .env                       # Archivo local de variables de entorno (no versionado en repositorios)
├── .gitignore                 # Reglas de omisión de archivos para el control de versiones Git
├── docker-compose.yml         # Definición y orquestación multi-contenedor (servicios, redes, volúmenes)
├── Dockerfile                 # Receta de construcción de la imagen de la API (multi-stage/alpine)
├── init.sql                   # Script SQL de creación de tabla y datos semilla
├── package.json               # Metadatos del proyecto y dependencias de Node.js
├── README.md                  # Manual exhaustivo de reproducción y documentación técnica
├── test-api.sh                # Script de pruebas automatizadas con cURL
└── src/
    ├── index.js               # Punto de entrada del servidor Express y middleware global
    ├── db.js                  # Pool de conexiones a PostgreSQL y healthcheck de base de datos
    └── routes/
        ├── health.js          # Ruta /health para monitoreo de la aplicación y la BD
        └── items.js           # Rutas del CRUD completo (/api/items)
```

---

## 4. Preparación de Variables de Entorno

El proyecto implementa el principio de configuración del [Twelve-Factor App](https://12factor.net/config) mediante variables de entorno. 

### Paso 1: Copiar la plantilla de ejemplo
Ejecute el siguiente comando en la raíz del repositorio:
```bash
cp .env.example .env
```

### Paso 2: Descripción de las variables configuradas

| Variable | Descripción | Valor por Defecto (`.env.example`) |
| :--- | :--- | :--- |
| `PORT` | Puerto expuesto en el host para la API | `3000` |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`) | `development` |
| `DB_HOST` | Host de la base de datos (nombre del servicio en Docker) | `db` |
| `DB_PORT` | Puerto de conexión a PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos relacional | `cloud_db` |
| `DB_USER` | Nombre de usuario administrador de PostgreSQL | `cloud_user` |
| `DB_PASSWORD`| Contraseña para el usuario de base de datos | `cloud_secure_password_example` |

> [!IMPORTANT]
> Dentro de la red de Docker Compose, el valor de `DB_HOST` debe ser obligatoriamente `db` (el nombre del servicio en el archivo `docker-compose.yml`), ya que Docker resuelve este nombre mediante su DNS interno. No use `localhost` para conectar los contenedores entre sí.

---

## 5. Comandos de Construcción, Inicio y Detención

### 5.1 Construir las imágenes de Docker
Construye la imagen de la API y descarga la imagen oficial de PostgreSQL:
```bash
docker compose build
```
*(Opcional: use `--no-cache` si desea forzar una reconstrucción limpia desde cero).*

### 5.2 Iniciar los contenedores en segundo plano (Modo Detached)
```bash
docker compose up -d
```

### 5.3 Comprobar el estado y la salud de los servicios
```bash
docker compose ps
```
*Salida esperada:*
```text
NAME      IMAGE                COMMAND                  SERVICE   CREATED          STATUS                    PORTS
app_api   despliegue-api       "docker-entrypoint.s…"   api       10 seconds ago   Up 8 seconds (healthy)    0.0.0.0:3000->3000/tcp
app_db    postgres:16-alpine   "docker-entrypoint.s…"   db        10 seconds ago   Up 9 seconds (healthy)    0.0.0.0:5432->5432/tcp
```

### 5.4 Visualizar los registros (Logs)
- **Ver todos los logs en tiempo real:**
  ```bash
  docker compose logs -f
  ```
- **Ver logs específicos de la API:**
  ```bash
  docker compose logs -f api
  ```
- **Ver logs específicos de la Base de Datos:**
  ```bash
  docker compose logs -f db
  ```

### 5.5 Detener los contenedores (conservando datos)
Detiene los contenedores y mantiene el volumen con la información guardada en la base de datos:
```bash
docker compose down
```

### 5.6 Detener los contenedores y eliminar volúmenes (Limpieza Completa)
Detiene los contenedores y **elimina los volúmenes persistentes**, ideal para resetear la base de datos a su estado inicial:
```bash
docker compose down -v
```

---

## 6. Inicialización y Verificación de la Base de Datos

### ¿Cómo funciona la inicialización automática?
En el archivo `docker-compose.yml`, el archivo local `./init.sql` se monta como volumen de solo lectura en la ruta:
`/docker-entrypoint-initdb.d/01-init.sql`

Cuando el contenedor de PostgreSQL arranca con un volumen de datos virgen (`pgdata`), ejecuta en orden alfabético todos los scripts colocados en ese directorio, creando la tabla `items` e insertando los datos semilla.

### Verificación manual mediante la consola interactiva de PostgreSQL
Para verificar directamente en el motor de base de datos que la tabla y los datos se crearon correctamente:

1. Abrir una sesión interactiva en `psql` dentro del contenedor:
   ```bash
   docker exec -it app_db psql -U cloud_user -d cloud_db
   ```
2. Ejecutar comandos SQL de inspección:
   ```sql
   -- Listar tablas:
   \dt

   -- Consultar los registros existentes:
   SELECT id, name, price, status, created_at FROM items;

   -- Salir de psql:
   \q
   ```

O en una sola línea desde el terminal:
```bash
docker exec -it app_db psql -U cloud_user -d cloud_db -c "SELECT * FROM items;"
```

---

## 7. Guía de Peticiones HTTP (Health Check y CRUD)

Puede ejecutar todas las pruebas de forma automática corriendo el script:
```bash
./test-api.sh
```

O realizar cada solicitud manualmente usando `curl`:

---

### 7.1 Health Check (`GET /health`)
Verifica la disponibilidad de la API y la conectividad activa con PostgreSQL.

**Petición cURL:**
```bash
curl -i -X GET http://localhost:3000/health
```

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2026-11-11T22:45:00.000Z",
  "uptimeSeconds": 45,
  "environment": "development",
  "service": "cloud-crud-api",
  "database": {
    "status": "connected",
    "responseTimeMs": 3
  }
}
```

---

### 7.2 Listar todos los elementos (`GET /api/items`)
Obtiene la lista completa de ítems registrados en la base de datos.

**Petición cURL:**
```bash
curl -X GET http://localhost:3000/api/items
```

**Filtro opcional por búsqueda:**
```bash
curl -X GET "http://localhost:3000/api/items?search=Mouse"
```

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Laptop Pro 15",
      "description": "Portátil para desarrollo con 32GB RAM y 1TB SSD NVMe",
      "price": "1499.99",
      "status": "available",
      "created_at": "2026-11-11T22:30:00.000Z",
      "updated_at": "2026-11-11T22:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Mouse Inalámbrico",
      "description": "Mouse ergonómico Bluetooth con sensor de 4000 DPI",
      "price": "34.50",
      "status": "available",
      "created_at": "2026-11-11T22:30:00.000Z",
      "updated_at": "2026-11-11T22:30:00.000Z"
    }
  ]
}
```

---

### 7.3 Obtener un elemento por ID (`GET /api/items/:id`)

**Petición cURL:**
```bash
curl -X GET http://localhost:3000/api/items/1
```

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Laptop Pro 15",
    "description": "Portátil para desarrollo con 32GB RAM y 1TB SSD NVMe",
    "price": "1499.99",
    "status": "available",
    "created_at": "2026-11-11T22:30:00.000Z",
    "updated_at": "2026-11-11T22:30:00.000Z"
  }
}
```

---

### 7.4 Crear un nuevo elemento (`POST /api/items`)

**Petición cURL:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monitor Ultrawide 34",
    "description": "Monitor Curvo 144Hz IPS para productividad",
    "price": 450.00,
    "status": "available"
  }'
```

**Respuesta esperada (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Elemento creado exitosamente.",
  "data": {
    "id": 4,
    "name": "Monitor Ultrawide 34",
    "description": "Monitor Curvo 144Hz IPS para productividad",
    "price": "450.00",
    "status": "available",
    "created_at": "2026-11-11T22:46:12.345Z",
    "updated_at": "2026-11-11T22:46:12.345Z"
  }
}
```

---

### 7.5 Actualizar un elemento existente (`PUT /api/items/:id`)

**Petición cURL:**
```bash
curl -X PUT http://localhost:3000/api/items/4 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monitor Ultrawide 34 Pro",
    "description": "Monitor Curvo 165Hz HDR 400",
    "price": 499.90,
    "status": "in_stock"
  }'
```

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Elemento actualizado exitosamente.",
  "data": {
    "id": 4,
    "name": "Monitor Ultrawide 34 Pro",
    "description": "Monitor Curvo 165Hz HDR 400",
    "price": "499.90",
    "status": "in_stock",
    "created_at": "2026-11-11T22:46:12.345Z",
    "updated_at": "2026-11-11T22:47:05.120Z"
  }
}
```

---

### 7.6 Eliminar un elemento (`DELETE /api/items/:id`)

**Petición cURL:**
```bash
curl -X DELETE http://localhost:3000/api/items/4
```

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Elemento con id 4 eliminado exitosamente.",
  "deleted": {
    "id": 4,
    "name": "Monitor Ultrawide 34 Pro",
    "description": "Monitor Curvo 165Hz HDR 400",
    "price": "499.90",
    "status": "in_stock"
  }
}
```

---

### 7.7 Pruebas de Respuestas de Error (Casos Borde)

#### A. Validación de entrada (HTTP 400 Bad Request)
Omitiendo el campo obligatorio `name`:
```bash
curl -i -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"price": 50.00}'
```
**Respuesta:**
```json
{
  "success": false,
  "error": "El campo \"name\" es obligatorio y no puede estar vacío."
}
```

#### B. Elemento inexistente (HTTP 404 Not Found)
Buscando un ID inexistente:
```bash
curl -i -X GET http://localhost:3000/api/items/9999
```
**Respuesta:**
```json
{
  "success": false,
  "error": "Elemento con id 9999 no encontrado."
}
```

---

## 8. Errores Frecuentes, Causas y Soluciones

A continuación se documentan 5 errores comunes experimentados en despliegues con Docker y PostgreSQL:

### Error 1: Conflicto de puertos en el Host (`bind: address already in use`)
- **Síntoma / Mensaje de Error:**
  ```text
  Error response from daemon: driver failed programming external connectivity on endpoint app_api: 
  Bind for 0.0.0.0:3000 failed: port is already allocated
  ```
- **Causa Raíz:**  
  El puerto `3000` (o `5432`) en el sistema anfitrión ya está siendo utilizado por otro proceso local (otra instancia de Node.js, un contenedor previo o un servicio del sistema como un PostgreSQL nativo en el puerto 5432).
- **Solución Paso a Paso:**
  1. *Opción A (Detener el proceso en conflicto):*  
     Identificar el proceso ocupando el puerto y finalizarlo:
     ```bash
     sudo lsof -i :3000
     # o bien:
     sudo fuser -k 3000/tcp
     ```
  2. *Opción B (Cambiar el puerto en `.env` sin modificar el código):*  
     Edite su archivo `.env` y cambie el puerto del host:
     ```env
     PORT=3001
     DB_PORT=5433
     ```
     Luego reinicie: `docker compose up -d`.

---

### Error 2: Fallo de conexión de la API a la Base de Datos (`ECONNREFUSED` / `getaddrinfo ENOTFOUND`)
- **Síntoma / Mensaje de Error:**
  ```text
  [DATABASE ERROR] Error: connect ECONNREFUSED 127.0.0.1:5432
  o bien:
  Error: getaddrinfo ENOTFOUND localhost
  ```
- **Causa Raíz:**  
  La API dentro del contenedor intenta conectarse a `localhost` o `127.0.0.1`. Dentro del aislamiento de red de Docker, `localhost` apunta al propio contenedor de la API, no al contenedor de la base de datos.
- **Solución Paso a Paso:**
  1. Verifique que en el archivo `.env` la variable `DB_HOST` esté configurada exactamente con el nombre del servicio de la base de datos:
     ```env
     DB_HOST=db
     ```
  2. Asegúrese de que ambos servicios pertenezcan a la misma red en `docker-compose.yml` (`app_network`).
  3. Confirme que la directiva `depends_on` con condición `service_healthy` esté presente en el servicio `api` para garantizar que la API solo inicie cuando PostgreSQL esté completamente listo para aceptar transacciones.

---

### Error 3: Cambios en `init.sql` no se aplican en la Base de Datos
- **Síntoma / Mensaje de Error:**  
  Se modificó la estructura de tablas o los datos en `init.sql`, pero al reiniciar con `docker compose up -d` las tablas siguen con la estructura vieja o vacías.
- **Causa Raíz:**  
  La imagen oficial de PostgreSQL **únicamente** ejecuta los scripts de `/docker-entrypoint-initdb.d/` la primera vez que se inicializa el directorio de datos. Como el volumen `pgdata` ya fue creado y contiene datos existentes, PostgreSQL omite la ejecución de los scripts de inicialización.
- **Solución Paso a Paso:**
  1. Detener los contenedores y remover explícitamente el volumen persistente:
     ```bash
     docker compose down -v
     ```
  2. Volver a levantar el entorno:
     ```bash
     docker compose up -d
     ```
     PostgreSQL creará un volumen limpio y ejecutará el script `init.sql` actualizado.

---

### Error 4: Error de autenticación en PostgreSQL (`password authentication failed for user`)
- **Síntoma / Mensaje de Error:**
  ```text
  error: password authentication failed for user "cloud_user"
  ```
- **Causa Raíz:**  
  Se modificaron las variables `DB_USER` o `DB_PASSWORD` en `.env`, pero el volumen persistente `pgdata` fue creado anteriormente con las credenciales viejas. PostgreSQL no actualiza las contraseñas de usuarios existentes a partir de variables de entorno si el volumen ya fue inicializado.
- **Solución Paso a Paso:**
  1. Si se trata de un entorno de pruebas/desarrollo, reinicie los volúmenes para regenerar la base de datos con las nuevas credenciales:
     ```bash
     docker compose down -v
     docker compose up -d
     ```
  2. Verifique que no haya discrepancias entre los valores declarados en `.env` y las variables leídas por `docker-compose.yml`.

---

### Error 5: Modificaciones en el código fuente no se reflejan al iniciar el contenedor
- **Síntoma / Mensaje de Error:**  
  Se agregaron nuevas rutas o se cambiaron archivos en `src/`, pero al ejecutar `docker compose up -d` la API sigue respondiendo con el comportamiento previo.
- **Causa Raíz:**  
  El comando `docker compose up` reutiliza la imagen previamente construida si esta ya existe, ignorando los cambios recientes realizados en el código fuente del host.
- **Solución Paso a Paso:**
  1. Forzar la reconstrucción de la imagen antes de arrancar los contenedores usando el parámetro `--build`:
     ```bash
     docker compose up -d --build
     ```

---

## 9. Verificación desde una Copia Limpia (Reproducibilidad)

Para comprobar que cualquier evaluador u otro desarrollador puede clonar y ejecutar el proyecto sin dependencias previas:

```bash
# 1. Clonar el repositorio en una carpeta limpia y acceder a él
git clone <URL_DEL_REPOSITORIO> test-despliegue
cd test-despliegue

# 2. Preparar el archivo de variables de entorno
cp .env.example .env

# 3. Construir e iniciar los servicios contenerizados
docker compose up -d --build

# 4. Verificar que ambos contenedores estén saludables (healthy)
docker compose ps

# 5. Ejecutar la suite completa de pruebas automáticas
./test-api.sh

# 6. Al finalizar las pruebas, detener y limpiar el entorno
docker compose down -v
```

---

*Proyecto desarrollado con fines académicos - Programación en la Nube.*
