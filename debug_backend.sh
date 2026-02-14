#!/bin/bash

# Script de diagnostic pour le backend
echo "=== Diagnostic du Backend ==="
echo ""

echo "1. Vérifier les logs du backend:"
docker-compose logs backend --tail=50

echo ""
echo "2. Vérifier les variables d'environnement:"
docker-compose exec backend env | grep -E "DB_|PORT|NODE_ENV"

echo ""
echo "3. Vérifier la connexion à la base de données:"
docker-compose exec database psql -U postgres -c "\l"

echo ""
echo "4. Vérifier les fichiers dans le conteneur:"
docker-compose exec backend ls -la /app/

echo ""
echo "5. Vérifier les templates:"
docker-compose exec backend ls -la /app/templates/
