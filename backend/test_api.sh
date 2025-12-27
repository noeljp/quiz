#!/bin/bash
set -e

# Script de test pour l'API Django
# Ce script démontre l'utilisation des différents endpoints

echo "=================================="
echo "Tests de l'API Backend Django"
echo "=================================="
echo ""

BASE_URL="http://localhost:8000/api"

# Test 1: Inscription d'un formateur
echo "1. Inscription d'un formateur..."
FORMATEUR_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "formateur1",
    "email": "formateur1@example.com",
    "password": "test123456",
    "user_type": "formateur",
    "first_name": "Pierre",
    "last_name": "Dubois"
  }')

FORMATEUR_TOKEN=$(echo $FORMATEUR_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['tokens']['access'])")
echo "✓ Formateur créé et token obtenu"
echo ""

# Test 2: Inscription d'un apprenant
echo "2. Inscription d'un apprenant..."
APPRENANT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apprenant1",
    "email": "apprenant1@example.com",
    "password": "test123456",
    "user_type": "apprenant",
    "first_name": "Sophie",
    "last_name": "Lambert"
  }')

APPRENANT_TOKEN=$(echo $APPRENANT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['tokens']['access'])")
echo "✓ Apprenant créé et token obtenu"
echo ""

# Test 3: Connexion
echo "3. Test de connexion..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "formateur1",
    "password": "test123456"
  }')

echo "✓ Connexion réussie"
echo ""

# Test 4: Obtenir les infos utilisateur
echo "4. Obtenir les informations de l'utilisateur courant..."
USER_INFO=$(curl -s -X GET $BASE_URL/users/me/ \
  -H "Authorization: Bearer $APPRENANT_TOKEN")

echo $USER_INFO | python3 -m json.tool
echo ""

# Test 5: Créer un fichier test
echo "5. Téléversement d'un fichier par le formateur..."
echo "Contenu du cours Python" > /tmp/cours_test.txt

FILE_RESPONSE=$(curl -s -X POST $BASE_URL/files/ \
  -H "Authorization: Bearer $FORMATEUR_TOKEN" \
  -F "title=Introduction à Python" \
  -F "subject=Programmation" \
  -F "theme=Python Basics" \
  -F "file=@/tmp/cours_test.txt")

echo "✓ Fichier téléversé avec succès"
echo $FILE_RESPONSE | python3 -m json.tool
echo ""

# Test 6: Lister les fichiers
echo "6. Liste des fichiers disponibles..."
FILES_LIST=$(curl -s -X GET $BASE_URL/files/ \
  -H "Authorization: Bearer $APPRENANT_TOKEN")

echo $FILES_LIST | python3 -m json.tool
echo ""

# Test 7: Créer des entrées de progression
echo "7. Création d'entrées de progression pour l'apprenant..."

curl -s -X POST $BASE_URL/progress/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPRENANT_TOKEN" \
  -d '{
    "quiz_title": "Quiz Python Basics",
    "quiz_subject": "Python",
    "score": 85,
    "max_score": 100,
    "completed": true
  }' > /dev/null

curl -s -X POST $BASE_URL/progress/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPRENANT_TOKEN" \
  -d '{
    "quiz_title": "Quiz Python Advanced",
    "quiz_subject": "Python",
    "score": 92,
    "max_score": 100,
    "completed": true
  }' > /dev/null

curl -s -X POST $BASE_URL/progress/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPRENANT_TOKEN" \
  -d '{
    "quiz_title": "Quiz Django Basics",
    "quiz_subject": "Django",
    "score": 78,
    "max_score": 100,
    "completed": false
  }' > /dev/null

echo "✓ 3 entrées de progression créées"
echo ""

# Test 8: Récupérer les statistiques
echo "8. Statistiques de progression de l'apprenant..."
STATS=$(curl -s -X GET $BASE_URL/progress/stats/ \
  -H "Authorization: Bearer $APPRENANT_TOKEN")

echo $STATS | python3 -m json.tool
echo ""

# Test 9: Liste de la progression
echo "9. Liste complète de la progression..."
PROGRESS_LIST=$(curl -s -X GET $BASE_URL/progress/ \
  -H "Authorization: Bearer $APPRENANT_TOKEN")

echo $PROGRESS_LIST | python3 -m json.tool
echo ""

echo "=================================="
echo "Tous les tests sont terminés ✓"
echo "=================================="
