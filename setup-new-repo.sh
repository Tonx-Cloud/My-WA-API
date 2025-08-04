#!/bin/bash
# Script para configurar o novo repositório GitHub
# Execute este script após criar o repositório no GitHub

echo "🚀 Configurando novo repositório my-wa-api..."

# Adicionar o novo remote origin
echo "📡 Adicionando remote origin..."
git remote add origin https://github.com/Tonx-Cloud/My-WA-API.git

# Verificar se o remote foi adicionado
echo "✅ Verificando remote:"
git remote -v

# Fazer push da branch main
echo "⬆️ Fazendo push da branch main..."
git push -u origin main

# Fazer push de todas as tags (se houver)
echo "🏷️ Fazendo push das tags..."
git push origin --tags

echo "✅ Repositório configurado com sucesso!"
echo "🌐 Acesse: https://github.com/Tonx-Cloud/My-WA-API"
