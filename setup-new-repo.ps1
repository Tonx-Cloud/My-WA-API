# Script PowerShell para configurar o novo repositório GitHub
# Execute este script após criar o repositório no GitHub

Write-Host "🚀 Configurando novo repositório my-wa-api..." -ForegroundColor Green

# Adicionar o novo remote origin
Write-Host "📡 Adicionando remote origin..." -ForegroundColor Yellow
git remote add origin https://github.com/Tonx-Cloud/My-WA-API.git

# Verificar se o remote foi adicionado
Write-Host "✅ Verificando remote:" -ForegroundColor Cyan
git remote -v

# Fazer push da branch main
Write-Host "⬆️ Fazendo push da branch main..." -ForegroundColor Yellow
git push -u origin main

# Fazer push de todas as tags (se houver)
Write-Host "🏷️ Fazendo push das tags..." -ForegroundColor Yellow
git push origin --tags

Write-Host "✅ Repositório configurado com sucesso!" -ForegroundColor Green
Write-Host "🌐 Acesse: https://github.com/Tonx-Cloud/My-WA-API" -ForegroundColor Cyan
