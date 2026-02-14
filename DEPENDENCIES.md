# Liste Complète des Dépendances - Ubuntu 22.04

## 📦 Dépendances Système Requises

### Dépendances de Base
```bash
apt install -y \
    git \
    curl \
    wget \
    nano \
    vim \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https
```

**Description:**
- `git` - Gestion de version pour cloner le repository
- `curl` / `wget` - Téléchargement de fichiers
- `nano` / `vim` - Éditeurs de texte
- `ca-certificates` - Certificats SSL/TLS
- `gnupg` - Gestion des clés GPG
- `lsb-release` - Informations sur la distribution
- `software-properties-common` - Gestion des repositories
- `apt-transport-https` - Support HTTPS pour apt

---

### Docker Engine
```bash
# Installation complète de Docker
apt install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
```

**Description:**
- `docker-ce` - Docker Community Edition (moteur principal)
- `docker-ce-cli` - Interface en ligne de commande Docker
- `containerd.io` - Runtime de conteneurs
- `docker-buildx-plugin` - Plugin pour builds multi-plateformes
- `docker-compose-plugin` - Plugin Docker Compose v2

**Version recommandée:** Docker 24.0+ 

---

### Docker Compose (Standalone)
```bash
# Installation de docker-compose v2
curl -SL "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

**Version recommandée:** 2.24.5+

---

### Pare-feu (UFW)
```bash
apt install -y ufw
```

**Configuration requise:**
- Port 22 (SSH) - Accès distant
- Port 80 (HTTP) - Application web
- Port 443 (HTTPS) - SSL/TLS (optionnel)

---

## 🛠️ Outils Optionnels (Recommandés)

### Monitoring et Debug
```bash
apt install -y \
    htop \
    net-tools \
    lsof \
    tree \
    jq \
    unzip
```

**Description:**
- `htop` - Moniteur de processus interactif
- `net-tools` - Outils réseau (netstat, ifconfig)
- `lsof` - Liste des fichiers ouverts
- `tree` - Affichage arborescent des répertoires
- `jq` - Processeur JSON en ligne de commande
- `unzip` - Décompression de fichiers ZIP

---

## 🐳 Images Docker Utilisées

Le projet utilise les images Docker suivantes (téléchargées automatiquement):

### Backend
```dockerfile
FROM node:18-alpine
```
- **Image:** `node:18-alpine`
- **Taille:** ~180 MB
- **Contenu:** Node.js 18 + npm

### Frontend (Build)
```dockerfile
FROM node:18-alpine AS build
```
- **Image:** `node:18-alpine`
- **Taille:** ~180 MB
- **Usage:** Build de l'application React

### Frontend (Production)
```dockerfile
FROM nginx:alpine
```
- **Image:** `nginx:alpine`
- **Taille:** ~40 MB
- **Contenu:** Nginx web server

### Base de Données
```dockerfile
image: postgres:15-alpine
```
- **Image:** `postgres:15-alpine`
- **Taille:** ~240 MB
- **Contenu:** PostgreSQL 15

**Espace disque total requis pour les images:** ~650 MB

---

## 📊 Dépendances Node.js (Installées dans Docker)

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "pg": "^8.11.3",
  "docxtemplater": "^3.42.3",
  "pizzip": "^3.1.6",
  "dotenv": "^16.3.1"
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2",
  "date-fns": "^2.30.0"
}
```

**Note:** Ces dépendances sont installées automatiquement dans les conteneurs Docker, aucune action manuelle requise.

---

## 💾 Ressources Système Requises

### Minimum
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Disque:** 10 GB libre
- **Réseau:** Connexion Internet pour téléchargement initial

### Recommandé
- **CPU:** 4 cores
- **RAM:** 4 GB
- **Disque:** 20 GB libre
- **Réseau:** Connexion stable

---

## 🔧 Configuration Proxmox (CT)

Si vous utilisez un conteneur Proxmox:

### Paramètres CT Recommandés
```
Cores: 2-4
Memory: 2048-4096 MB
Swap: 512 MB
Disk: 20 GB
Network: vmbr0 (bridge)
```

### Features à Activer
```bash
# Dans la configuration du CT Proxmox
features: nesting=1
```

**Important:** Le flag `nesting=1` est **REQUIS** pour exécuter Docker dans un CT Proxmox.

---

## ✅ Vérification des Dépendances

Après installation, vérifiez que tout est installé:

```bash
# Vérifier Docker
docker --version
docker compose version

# Vérifier Git
git --version

# Vérifier les outils
curl --version
wget --version

# Vérifier le pare-feu
ufw status

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

---

## 📝 Script d'Installation Automatique

Un script `install.sh` est fourni pour installer automatiquement toutes les dépendances:

```bash
# Télécharger et exécuter le script
wget https://raw.githubusercontent.com/FingaDZ/registration/main/install.sh
chmod +x install.sh
sudo bash install.sh
```

Le script installe:
1. Dépendances de base
2. Docker Engine
3. Docker Compose
4. Pare-feu UFW
5. Outils optionnels

---

## 🚨 Dépendances Critiques

**ABSOLUMENT REQUIS:**
- ✅ Docker Engine (24.0+)
- ✅ Docker Compose (2.0+)
- ✅ Git
- ✅ Connexion Internet (pour pull des images)

**RECOMMANDÉ:**
- ⭐ UFW (Pare-feu)
- ⭐ htop (Monitoring)
- ⭐ 4 GB RAM minimum

**OPTIONNEL:**
- 💡 Nginx (pour reverse proxy)
- 💡 Certbot (pour SSL/HTTPS)
- 💡 Fail2ban (sécurité)
