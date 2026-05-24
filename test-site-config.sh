#!/bin/bash

API_URL="https://signal-moi-api.onrender.com"
ADMIN_EMAIL="admin@signal-moi.fr"
ADMIN_PASSWORD="Admin123!"

echo "=========================================="
echo "Test Mise à Jour Site Config"
echo "=========================================="

# Étape 1: Login
echo -e "\n[1/4] Connexion admin..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API_URL/api/auth/login")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "✅ Token reçu: ${TOKEN:0:30}..."

# Étape 2: Lire config actuelle
echo -e "\n[2/4] Lecture config actuelle..."
CONFIG_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/admin/site-config")

echo "Config actuelle:"
echo $CONFIG_RESPONSE | jq '.'

# Étape 3: Mettre à jour
echo -e "\n[3/4] Mise à jour de la config..."
UPDATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Signal-Moi - Plateforme Citoyenne (MISE À JOUR)",
    "contactEmail": "contact@signal-moi.fr",
    "contactPhone": "+33 1 23 45 67 89",
    "address": "123 Rue de la Paix, 75000 Paris - FRANCE",
    "contactPage": {
      "title": "Nous Contacter",
      "description": "PAGE DE CONTACT MISE À JOUR"
    },
    "aboutPage": {
      "title": "À Propos",
      "description": "PAGE À PROPOS MISE À JOUR - Signal-Moi est une plateforme citoyenne moderne"
    }
  }' \
  "$API_URL/api/admin/site-config")

echo "Réponse: $UPDATE_RESPONSE"

# Étape 4: Vérifier
echo -e "\n[4/4] Vérification de la mise à jour..."
sleep 1

VERIFY_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/admin/site-config")

echo "Config mise à jour:"
echo $VERIFY_RESPONSE | jq '.'

# Vérifier que le changement a bien eu lieu
if echo $VERIFY_RESPONSE | grep -q "MISE À JOUR"; then
  echo -e "\n✅ SUCCÈS: Le contenu a bien été mis à jour!"
else
  echo -e "\n❌ ERREUR: Le contenu n'a pas été mis à jour"
fi

echo -e "\n=========================================="
echo "Test Terminé"
echo "=========================================="
