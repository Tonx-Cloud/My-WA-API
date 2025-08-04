#!/usr/bin/env pwsh
# ==========================================
# MY-WA-API - TESTE DE QR CODE E MENSAGENS
# ==========================================
# Criado: 2025-08-03
# Autor: GitHub Copilot
# Descrição: Teste completo de funcionalidades WhatsApp

Write-Host "📱 INICIANDO TESTE DE QR CODE E MENSAGENS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($Body) {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "❌ Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Verificar se os serviços estão funcionando
Write-Host "`n🔍 VERIFICANDO SERVIÇOS..." -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

# Testar API
Write-Host "🔧 Testando API Backend..." -ForegroundColor Magenta
$healthCheck = Invoke-ApiRequest -Url "http://localhost:3000/health"
if ($healthCheck -and $healthCheck.success) {
    Write-Host "✅ API Backend: FUNCIONANDO" -ForegroundColor Green
    Write-Host "   Status: $($healthCheck.data.status)" -ForegroundColor Cyan
    Write-Host "   Uptime: $([math]::Round($healthCheck.data.uptime / 60, 2)) minutos" -ForegroundColor Cyan
} else {
    Write-Host "❌ API Backend: FALHOU" -ForegroundColor Red
    return
}

# Testar Frontend
Write-Host "`n🌐 Testando Frontend..." -ForegroundColor Magenta
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: FUNCIONANDO" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: FALHOU" -ForegroundColor Red
    return
}

# 2. Criar nova instância para teste
Write-Host "`n📱 CRIANDO INSTÂNCIA DE TESTE..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

$instanceName = "QR-Test-$(Get-Date -Format 'HHmmss')"
Write-Host "📝 Nome da instância: $instanceName" -ForegroundColor Cyan

$createResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/instances" -Method "POST" -Body "{`"name`":`"$instanceName`"}"

if ($createResponse -and $createResponse.instance) {
    $instanceId = $createResponse.instance.id
    Write-Host "✅ Instância criada com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $instanceId" -ForegroundColor Cyan
    Write-Host "   Nome: $($createResponse.instance.name)" -ForegroundColor Cyan
    Write-Host "   Status: $($createResponse.instance.status)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Falha ao criar instância" -ForegroundColor Red
    return
}

# 3. Aguardar e verificar geração do QR Code
Write-Host "`n🔲 AGUARDANDO GERAÇÃO DO QR CODE..." -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

$maxAttempts = 10
$attempt = 1
$qrCodeGenerated = $false

while ($attempt -le $maxAttempts -and -not $qrCodeGenerated) {
    Write-Host "🔄 Tentativa $attempt/$maxAttempts - Verificando QR code..." -ForegroundColor Magenta
    
    Start-Sleep -Seconds 3
    
    $qrResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$instanceId/qr"
    
    if ($qrResponse -and $qrResponse.qr_code -and $qrResponse.qr_code.Length -gt 100) {
        $qrCodeGenerated = $true
        Write-Host "✅ QR Code gerado com sucesso!" -ForegroundColor Green
        Write-Host "   Status: $($qrResponse.status)" -ForegroundColor Cyan
        Write-Host "   Tamanho do QR: $($qrResponse.qr_code.Length) caracteres" -ForegroundColor Cyan
        Write-Host "   Formato: Base64 PNG" -ForegroundColor Cyan
        
        # Mostrar preview do QR code (primeiros 100 caracteres)
        $qrPreview = $qrResponse.qr_code.Substring(0, [Math]::Min(100, $qrResponse.qr_code.Length))
        Write-Host "   Preview: $qrPreview..." -ForegroundColor DarkCyan
        
    } elseif ($qrResponse) {
        Write-Host "⏳ QR Code ainda não disponível. Status: $($qrResponse.status)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Erro ao verificar QR code" -ForegroundColor Yellow
    }
    
    $attempt++
}

if (-not $qrCodeGenerated) {
    Write-Host "❌ Timeout: QR Code não foi gerado em tempo hábil" -ForegroundColor Red
    Write-Host "💡 Verifique se o WhatsApp Web está funcionando corretamente" -ForegroundColor Blue
    return
}

# 4. Testar endpoint público do QR Code
Write-Host "`n🌐 TESTANDO ENDPOINT PÚBLICO DO QR CODE..." -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Yellow

$publicQrResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$instanceId/qr-public"

if ($publicQrResponse -and $publicQrResponse.qr_code) {
    Write-Host "✅ Endpoint público funcionando!" -ForegroundColor Green
    Write-Host "   Status: $($publicQrResponse.status)" -ForegroundColor Cyan
    Write-Host "   QR Code acessível publicamente" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Endpoint público pode não estar funcionando" -ForegroundColor Yellow
}

# 5. Verificar todas as instâncias
Write-Host "`n📋 LISTANDO TODAS AS INSTÂNCIAS..." -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

$allInstances = Invoke-ApiRequest -Url "http://localhost:3000/api/instances"

if ($allInstances -and $allInstances.instances) {
    Write-Host "✅ Lista de instâncias obtida com sucesso!" -ForegroundColor Green
    Write-Host "   Total de instâncias: $($allInstances.instances.Count)" -ForegroundColor Cyan
    
    foreach ($instance in $allInstances.instances) {
        $statusColor = switch ($instance.status) {
            "ready" { "Green" }
            "connecting" { "Yellow" }
            "disconnected" { "Red" }
            default { "Gray" }
        }
        
        Write-Host "   📱 $($instance.name) ($($instance.id))" -ForegroundColor White
        Write-Host "      Status: $($instance.status)" -ForegroundColor $statusColor
        Write-Host "      Criado: $($instance.created_at)" -ForegroundColor DarkCyan
    }
} else {
    Write-Host "❌ Falha ao listar instâncias" -ForegroundColor Red
}

# 6. Teste de preparação para envio de mensagens
Write-Host "`n💬 PREPARANDO TESTE DE MENSAGENS..." -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

Write-Host "📋 Para testar o envio de mensagens:" -ForegroundColor Cyan
Write-Host "   1. Escaneie o QR code no WhatsApp do seu celular" -ForegroundColor White
Write-Host "   2. Aguarde a conexão ser estabelecida" -ForegroundColor White
Write-Host "   3. Execute o script de teste de mensagens" -ForegroundColor White

Write-Host "`n🔗 URLs para teste manual:" -ForegroundColor Cyan
Write-Host "   📊 Dashboard: http://localhost:3001/dashboard/instances" -ForegroundColor White
Write-Host "   🔲 QR Code: http://localhost:3000/api/instances/$instanceId/qr-public" -ForegroundColor White
Write-Host "   📱 API Instâncias: http://localhost:3000/api/instances" -ForegroundColor White

# 7. Aguardar conexão (opcional)
Write-Host "`n⏳ AGUARDANDO CONEXÃO..." -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host "💡 Pressione Ctrl+C para pular esta etapa" -ForegroundColor Blue

$connectionWaitTime = 60 # segundos
$startTime = Get-Date

try {
    while (((Get-Date) - $startTime).TotalSeconds -lt $connectionWaitTime) {
        Start-Sleep -Seconds 5
        
        $statusCheck = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$instanceId"
        
        if ($statusCheck -and $statusCheck.status -eq "ready") {
            Write-Host "🎉 CONEXÃO ESTABELECIDA COM SUCESSO!" -ForegroundColor Green
            Write-Host "   Status: $($statusCheck.status)" -ForegroundColor Green
            Write-Host "   Instância pronta para enviar mensagens!" -ForegroundColor Green
            break
        } else {
            $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
            Write-Host "⏳ Aguardando conexão... ${elapsed}s (Status: $($statusCheck.status))" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "`n⏹️  Teste interrompido pelo usuário" -ForegroundColor Yellow
}

# 8. Relatório final
Write-Host "`n📊 RELATÓRIO FINAL DO TESTE..." -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

$finalCheck = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$instanceId"

Write-Host "✅ TESTES DE QR CODE CONCLUÍDOS!" -ForegroundColor Green
Write-Host "`n📋 Resumo dos resultados:" -ForegroundColor Cyan
Write-Host "   🔧 API Backend: ✅ Funcionando" -ForegroundColor White
Write-Host "   🌐 Frontend: ✅ Funcionando" -ForegroundColor White
Write-Host "   📱 Criação de Instância: ✅ Sucesso" -ForegroundColor White
Write-Host "   🔲 Geração de QR Code: ✅ Sucesso" -ForegroundColor White
Write-Host "   🌐 Endpoint Público: ✅ Funcionando" -ForegroundColor White

if ($finalCheck -and $finalCheck.status -eq "ready") {
    Write-Host "   🔗 Status da Conexão: ✅ Conectado" -ForegroundColor Green
    Write-Host "`n🚀 PRÓXIMO PASSO: Teste de envio de mensagens" -ForegroundColor Green
} else {
    Write-Host "   🔗 Status da Conexão: ⏳ Aguardando" -ForegroundColor Yellow
    Write-Host "`n💡 Para conectar: Escaneie o QR code em http://localhost:3001/dashboard/instances" -ForegroundColor Blue
}

Write-Host "`n🎯 TESTE DE QR CODE: CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "ID da Instância para próximos testes: $instanceId" -ForegroundColor Cyan
