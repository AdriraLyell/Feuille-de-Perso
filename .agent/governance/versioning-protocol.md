# PROTOCOLE DE VERSIONNING

Avant notify_user :

1. Incrémenter version dans package.json
2. Mettre à jour src/data/changelog.json
3. npm run build
4. Mettre à jour docs si nécessaire
5. Commit sur develop