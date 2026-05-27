#!/bin/bash

# Script de test pour les boutons S'inscrire et Signer
# Utilisation: ./test-campagnes-buttons.sh

API_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"

echo "🧪 TEST DES BOUTONS - CAMPAGNES ET PLAIDOYERS"
echo "=============================================="
echo ""

# 1. Récupérer toutes les campagnes
echo "1️⃣ Récupération des campagnes..."
CAMPAGNES=$(curl -s "$API_URL/campagnes")
CAMPAGNE_ID=$(echo $CAMPAGNES | jq -r '.[0].id' 2>/dev/null)

if [ -z "$CAMPAGNE_ID" ] || [ "$CAMPAGNE_ID" = "null" ]; then
  echo "❌ Aucune campagne trouvée"
  exit 1
fi

echo "✅ Campagne trouvée: $CAMPAGNE_ID"
echo ""

# 2. Récupérer les plaidoyers
echo "2️⃣ Récupération des plaidoyers..."
PLAIDOYERS=$(curl -s "$API_URL/plaidoyers")
PLAIDOYER_ID=$(echo $PLAIDOYERS | jq -r '.[0].id' 2>/dev/null)

if [ -z "$PLAIDOYER_ID" ] || [ "$PLAIDOYER_ID" = "null" ]; then
  echo "⚠️  Aucun plaidoyer trouvé"
else
  echo "✅ Plaidoyer trouvé: $PLAIDOYER_ID"
fi
echo ""

# 3. Créer un utilisateur de test
echo "3️⃣ Connexion utilisateur de test..."
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@signal-moi.fr",
    "password": "Password123!"
  }')

TOKEN=$(echo $LOGIN | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur de connexion"
  echo "Réponse: $LOGIN"
  exit 1
fi

echo "✅ Connecté avec token: ${TOKEN:0:20}..."
echo ""

# 4. Tester l'endpoint de vérification d'inscription
echo "4️⃣ Vérification de l'inscription (avant)..."
INSCR_CHECK=$(curl -s -X GET "$API_URL/campagnes/$CAMPAGNE_ID/inscrit" \
  -H "Authorization: Bearer $TOKEN")

IS_INSCRIBED=$(echo $INSCR_CHECK | jq -r '.isInscribed' 2>/dev/null)
echo "   État inscription: $IS_INSCRIBED"
echo ""

# 5. S'inscrire à la campagne
echo "5️⃣ S'inscrire à la campagne..."
INSCRIPTION=$(curl -s -X POST "$API_URL/campagnes/$CAMPAGNE_ID/inscrire" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

INSCRIPTION_SUCCESS=$(echo $INSCRIPTION | jq -r '.success' 2>/dev/null)

if [ "$INSCRIPTION_SUCCESS" = "true" ]; then
  echo "✅ Inscription réussie!"
else
  ERROR=$(echo $INSCRIPTION | jq -r '.error' 2>/dev/null)
  echo "❌ Erreur inscription: $ERROR"
  echo "Réponse: $INSCRIPTION"
fi
echo ""

# 6. Vérifier l'inscription (après)
echo "6️⃣ Vérification de l'inscription (après)..."
INSCR_CHECK2=$(curl -s -X GET "$API_URL/campagnes/$CAMPAGNE_ID/inscrit" \
  -H "Authorization: Bearer $TOKEN")

IS_INSCRIBED2=$(echo $INSCR_CHECK2 | jq -r '.isInscribed' 2>/dev/null)
echo "   État inscription: $IS_INSCRIBED2"

if [ "$IS_INSCRIBED2" = "true" ]; then
  echo "✅ Inscription confirmée!"
else
  echo "❌ Inscription non confirmée"
fi
echo ""

# 7. Tester la signature du plaidoyer (si disponible)
if [ ! -z "$PLAIDOYER_ID" ] && [ "$PLAIDOYER_ID" != "null" ]; then
  echo "7️⃣ Signature du plaidoyer..."
  SIGNATURE=$(curl -s -X POST "$API_URL/plaidoyers/$PLAIDOYER_ID/sign" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  SIGNATURE_SUCCESS=$(echo $SIGNATURE | jq -r '.success' 2>/dev/null)

  if [ "$SIGNATURE_SUCCESS" = "true" ]; then
    echo "✅ Plaidoyer signé!"
  else
    ERROR=$(echo $SIGNATURE | jq -r '.error' 2>/dev/null)
    echo "❌ Erreur signature: $ERROR"
  fi
else
  echo "⚠️  Plaidoyer non disponible - test signature ignoré"
fi
echo ""

echo "=============================================="
echo "✅ Tests terminés!"
echo ""
echo "Pour tester les boutons en frontend:"
echo "1. Accédez à: $FRONTEND_URL/campagnes/$CAMPAGNE_ID"
echo "2. Connectez-vous avec test@signal-moi.fr"
echo "3. Cliquez sur 'S'inscrire'"
echo ""
