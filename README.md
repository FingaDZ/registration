# Registration Form Automation System

Système automatisé de génération de formulaires d'enregistrement pour particuliers et entreprises avec support bilingue (Français/Arabe).

## 🚀 Fonctionnalités

- ✅ **Interface Web Responsive** - Compatible mobile, tablette et desktop
- ✅ **Génération Automatique** - Remplissage automatique des modèles Word
- ✅ **Support Bilingue** - Documents générés en français et arabe
- ✅ **Historique** - Consultation et téléchargement des documents générés
- ✅ **Référencement** - Système de référence unique pour chaque document
- ✅ **Déploiement Docker** - Configuration complète avec Docker Compose

## 📋 Prérequis

- Docker & Docker Compose
- Git
- Node.js 18+ (pour développement local)

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/FingaDZ/registration.git
cd registration
```

### 2. Préparer les modèles

Assurez-vous que les 4 modèles Word sont présents dans `backend/templates/`:
- `MODELE Particuliers.docx` (Français)
- `MODELE Particuliers AR.docx` (Arabe)
- `MODEL ENTREPRISE.docx` (Français)
- `MODEL ENTREPRISE AR.docx` (Arabe)

### 3. Déploiement avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up --build -d

# Vérifier que les services sont actifs
docker-compose ps

# Consulter les logs
docker-compose logs -f
```

L'application sera accessible sur:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Base de données**: localhost:5432

## 💻 Développement Local

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

### POST /api/generate
Génère les documents (français et arabe)

**Request:**
```json
{
  "type": "particuliers" | "entreprise",
  "data": {
    "Nom": "Dupont",
    "Prenom": "Jean",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "reference": "REG-20260214-12345",
  "frenchDoc": "generated/2026/02/14/REG-20260214-12345_fr.docx",
  "arabicDoc": "generated/2026/02/14/REG-20260214-12345_ar.docx",
  "createdAt": "2026-02-14T12:00:00.000Z"
}
```

### GET /api/documents
Liste tous les documents avec pagination

**Query Parameters:**
- `type`: particuliers | entreprise
- `startDate`: Date de début (YYYY-MM-DD)
- `endDate`: Date de fin (YYYY-MM-DD)
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Décalage pour pagination (défaut: 0)

### GET /api/documents/:reference
Récupère les détails d'un document spécifique

### GET /api/download/:reference/:language
Télécharge un document (language: 'fr' ou 'ar')

### GET /api/health
Vérification de l'état du serveur

## 🏗️ Structure du Projet

```
registration/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── init.js
│   ├── services/
│   │   ├── documentGenerator.js
│   │   └── storageService.js
│   ├── routes/
│   │   └── api.js
│   ├── templates/
│   │   ├── MODELE Particuliers.docx
│   │   ├── MODELE Particuliers AR.docx
│   │   ├── MODEL ENTREPRISE.docx
│   │   └── MODEL ENTREPRISE AR.docx
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FormSelector.jsx
│   │   │   ├── ParticuliersForm.jsx
│   │   │   ├── EntrepriseForm.jsx
│   │   │   └── DocumentHistory.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Variables d'Environnement (Backend)

Créer un fichier `.env` dans le dossier `backend/`:

```env
NODE_ENV=production
PORT=3000
DB_HOST=database
DB_PORT=5432
DB_NAME=registration
DB_USER=postgres
DB_PASSWORD=postgres
```

## 📝 Champs des Formulaires

### Particuliers (17 champs)
- Nom, Prénom, Numéro CIN
- Email, Mobile, Adresse
- Lieu, Latitude, Longitude
- Modèle CPE, Numéro de série CPE
- Autorité, Date de livraison
- Date

### Entreprise (22 champs)
- Raison Sociale, Adresse Entreprise
- NIF, NIS, RC, Article
- Nom Gérant, Prénom Gérant
- Numéro CIN Gérant, Date CIN Gérant
- Autorité Gérant, Email, Mobile Gérant
- Adresse Gérant, Lieu
- Latitude, Longitude
- Modèle CPE, Numéro de série CPE
- Date

## 🐳 Commandes Docker Utiles

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f [service_name]

# Reconstruire un service
docker-compose up --build [service_name]

# Supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 🔍 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier la connexion à la base de données
docker-compose exec backend npm run test
```

### Les documents ne se génèrent pas
- Vérifier que les 4 modèles Word sont présents dans `backend/templates/`
- Vérifier que les balises dans les modèles correspondent aux champs du formulaire
- Consulter les logs du backend

### Problèmes de permissions
```bash
# Sur Linux/Mac, donner les permissions nécessaires
chmod -R 755 backend/generated
```

## 📄 Licence

ISC

## 👤 Auteur

FingaDZ

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.
