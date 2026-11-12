# Imagen base ligera de Node.js basada en Alpine Linux
FROM node:20-alpine AS base

# Variables de entorno por defecto dentro del contenedor
ENV NODE_ENV=production \
    PORT=3000

# Directorio de trabajo de la aplicación
WORKDIR /app

# Copia de archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalación de dependencias de producción
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copia del código fuente del proyecto
COPY src/ ./src/

# Configurar permisos de usuario no-root por seguridad
USER node

# Exponer el puerto de la aplicación
EXPOSE 3000

# Verificación de salud nativa de Docker (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicio del servicio
CMD ["node", "src/index.js"]

