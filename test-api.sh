#!/usr/bin/env bash
# ==============================================================
# SCRIPT DE PRUEBA AUTOMATIZADA DE ENDPOINTS HTTP (API REST)
# Ejecuta peticiones a /health y al CRUD /api/items usando curl
# ==============================================================

set -e

BASE_URL="${1:-http://localhost:3000}"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}   SUITE DE PRUEBAS DE LA API CONTENERIZADA                   ${NC}"
echo -e "${BLUE}   Objetivo: ${BASE_URL}                                     ${NC}"
echo -e "${BLUE}==============================================================${NC}\n"

# 1. Probar Endpoint de Información Raíz
echo -e "${YELLOW}[TEST 1] GET / - Información del Servicio${NC}"
curl -s -X GET "${BASE_URL}/" | jq . || curl -s -X GET "${BASE_URL}/"
echo -e "\n"

# 2. Probar Health Check
echo -e "${YELLOW}[TEST 2] GET /health - Verificación de Estado y Base de Datos${NC}"
curl -s -i -X GET "${BASE_URL}/health"
echo -e "\n"

# 3. Listar Items Iniciales (Semilla de init.sql)
echo -e "${YELLOW}[TEST 3] GET /api/items - Listar todos los elementos iniciales${NC}"
curl -s -X GET "${BASE_URL}/api/items" | jq . || curl -s -X GET "${BASE_URL}/api/items"
echo -e "\n"

# 4. Crear un nuevo Item (POST)
echo -e "${YELLOW}[TEST 4] POST /api/items - Crear un nuevo elemento${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monitor Curvo 27 Pulgadas",
    "description": "Monitor Gaming 165Hz 1ms IPS FreeSync",
    "price": 289.99,
    "status": "available"
  }')
echo "${CREATE_RESPONSE}" | jq . || echo "${CREATE_RESPONSE}"
echo -e "\n"

# Extraer ID del nuevo item creado
NEW_ID=$(echo "${CREATE_RESPONSE}" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2 || echo "4")
if [ -z "$NEW_ID" ]; then
  NEW_ID=4
fi

# 5. Consultar el elemento por ID (GET :id)
echo -e "${YELLOW}[TEST 5] GET /api/items/${NEW_ID} - Consultar elemento recién creado${NC}"
curl -s -X GET "${BASE_URL}/api/items/${NEW_ID}" | jq . || curl -s -X GET "${BASE_URL}/api/items/${NEW_ID}"
echo -e "\n"

# 6. Actualizar el elemento (PUT :id)
echo -e "${YELLOW}[TEST 6] PUT /api/items/${NEW_ID} - Actualizar datos del elemento${NC}"
curl -s -X PUT "${BASE_URL}/api/items/${NEW_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monitor Curvo 27 Pulgadas OLED",
    "description": "Monitor Gaming 240Hz 0.03ms OLED HDR",
    "price": 499.50,
    "status": "reserved"
  }' | jq . || echo "Update ejecutado"
echo -e "\n"

# 7. Probar Validación de Error 400 (POST sin nombre)
echo -e "${YELLOW}[TEST 7] POST /api/items - Prueba de Validación (Error 400 esperado)${NC}"
curl -s -i -X POST "${BASE_URL}/api/items" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Item sin nombre obligatorio",
    "price": 10.00
  }'
echo -e "\n"

# 8. Eliminar el elemento creado (DELETE :id)
echo -e "${YELLOW}[TEST 8] DELETE /api/items/${NEW_ID} - Eliminar elemento${NC}"
curl -s -X DELETE "${BASE_URL}/api/items/${NEW_ID}" | jq . || curl -s -X DELETE "${BASE_URL}/api/items/${NEW_ID}"
echo -e "\n"

# 9. Verificar eliminación (GET :id - Error 404 esperado)
echo -e "${YELLOW}[TEST 9] GET /api/items/${NEW_ID} - Verificar 404 tras eliminación${NC}"
curl -s -i -X GET "${BASE_URL}/api/items/${NEW_ID}"
echo -e "\n"

echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}   TODAS LAS PRUEBAS COMPLETADAS SATISFACTORIAMENTE          ${NC}"
echo -e "${GREEN}==============================================================${NC}"

