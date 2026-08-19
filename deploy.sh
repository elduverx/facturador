#!/bin/bash
set -e

echo "🚀 Iniciando despliegue en servidor Hostinger..."

# 1. Asegurar que tenemos la última versión del código
echo "📥 Actualizando repositorio..."
# git pull origin main # Descomenta esto si usas git en el servidor

# 2. Reconstruir las imágenes de Docker sin usar caché
echo "🏗️ Construyendo contenedores..."
docker-compose build --no-cache

# 3. Levantar los servicios en segundo plano
echo "🛑 Deteniendo contenedores antiguos..."
docker-compose down

echo "🚀 Levantando servicios (Web + Base de datos)..."
docker-compose up -d

# Esperar unos segundos a que la DB esté lista (opcional pero recomendado)
sleep 5

# 3.5. Actualizar esquema de base de datos
echo "🔄 Actualizando esquema de base de datos..."
docker-compose exec -T pvabogadas-web npx prisma migrate deploy

# 4. Limpiar imágenes huérfanas o viejas para liberar espacio
echo "🧹 Limpiando imágenes antiguas de Docker..."
docker image prune -f

echo "✅ ¡Despliegue completado con éxito! Tu aplicación debería estar corriendo en el puerto 3000."
