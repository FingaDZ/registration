#!/bin/bash

#############################################
# Script d'Installation - Registration System
# Ubuntu 22.04 - Installation dans /opt/registration
#############################################

set -e  # Arrêter en cas d'erreur

echo "================================================"
echo "Installation du Système d'Enregistrement"
echo "Ubuntu 22.04 - /opt/registration"
echo "================================================"
echo ""

# Vérifier que le script est exécuté en tant que root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "Utilisez: sudo bash install.sh"
    exit 1
fi

echo "✓ Exécution en tant que root"
echo ""

#############################################
# Étape 1: Mise à jour du système
#############################################
echo "📦 Étape 1/7: Mise à jour du système..."
apt update
apt upgrade -y
echo "✓ Système mis à jour"
echo ""

#############################################
# Étape 2: Installation des dépendances de base
#############################################
echo "📦 Étape 2/7: Installation des dépendances de base..."
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

echo "✓ Dépendances de base installées"
echo ""

#############################################
# Étape 3: Installation de Docker
#############################################
echo "🐳 Étape 3/7: Installation de Docker..."

# Supprimer les anciennes versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Ajouter la clé GPG officielle de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Démarrer et activer Docker
systemctl start docker
systemctl enable docker

# Vérifier l'installation
docker --version
echo "✓ Docker installé: $(docker --version)"
echo ""

#############################################
# Étape 4: Installation de Docker Compose
#############################################
echo "🐳 Étape 4/7: Installation de Docker Compose..."

# Installer docker-compose standalone (v2)
DOCKER_COMPOSE_VERSION="2.24.5"
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Créer un lien symbolique
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Vérifier l'installation
docker-compose --version
echo "✓ Docker Compose installé: $(docker-compose --version)"
echo ""

#############################################
# Étape 5: Configuration du pare-feu (UFW)
#############################################
echo "🔒 Étape 5/7: Configuration du pare-feu..."

# Installer UFW si nécessaire
apt install -y ufw

# Autoriser SSH (IMPORTANT!)
ufw allow 22/tcp

# Autoriser HTTP
ufw allow 80/tcp

# Autoriser HTTPS
ufw allow 443/tcp

# Activer UFW (avec confirmation automatique)
echo "y" | ufw enable

# Afficher le statut
ufw status
echo "✓ Pare-feu configuré"
echo ""

#############################################
# Étape 6: Création du répertoire du projet
#############################################
echo "📁 Étape 6/7: Création du répertoire /opt/registration..."

# Créer le répertoire
mkdir -p /opt/registration
cd /opt/registration

echo "✓ Répertoire créé: /opt/registration"
echo ""

#############################################
# Étape 7: Installation des outils optionnels
#############################################
echo "🛠️  Étape 7/7: Installation des outils optionnels..."

# Installer des outils utiles pour le monitoring et le debug
apt install -y \
    htop \
    net-tools \
    lsof \
    tree \
    jq \
    unzip

echo "✓ Outils optionnels installés"
echo ""

#############################################
# Résumé de l'installation
#############################################
echo "================================================"
echo "✅ Installation terminée avec succès!"
echo "================================================"
echo ""
echo "📋 Résumé des composants installés:"
echo "  • Docker: $(docker --version)"
echo "  • Docker Compose: $(docker-compose --version)"
echo "  • Git: $(git --version)"
echo "  • UFW (Pare-feu): Actif"
echo ""
echo "📁 Répertoire du projet: /opt/registration"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Cloner ou transférer le projet dans /opt/registration"
echo "  2. Ajouter les 4 modèles Word dans backend/templates/"
echo "  3. Exécuter: cd /opt/registration && docker-compose up -d"
echo ""
echo "📖 Pour plus d'informations, consultez le guide de déploiement"
echo "================================================"
