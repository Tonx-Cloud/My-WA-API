# MY-WA-API - TESTE DE QR CODE E MENSAGENS
# Criado: 2025-08-03

Write-Host "INICIANDO TESTE DE QR CODE E MENSAGENS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Funcao para fazer requisicoes HTTP
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
        Write-Host "Erro na requisicao: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Verificar servicos
Write-Host "`nVerificando servicos..." -ForegroundColor Yellow
$healthCheck = Invoke-ApiRequest -Url "http://localhost:3000/health"
if ($healthCheck -and $healthCheck.success) {
    Write-Host "API Backend: FUNCIONANDO" -ForegroundColor Green
    Write-Host "Status: $($healthCheck.data.status)" -ForegroundColor Cyan
} else {
    Write-Host "API Backend: FALHOU" -ForegroundColor Red
    return
}

# 2. Criar nova instancia
Write-Host "`nCriando instancia de teste..." -ForegroundColor Yellow
$instanceName = "QR-Test-$(Get-Date -Format 'HHmmss')"
$createResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/instances" -Method "POST" -Body "{`"name`":`"$instanceName`"}"

if ($createResponse -and $createResponse.instance) {
    $instanceId = $createResponse.instance.id
    Write-Host "Instancia criada com sucesso!" -ForegroundColor Green
    Write-Host "ID: $instanceId" -ForegroundColor Cyan
    Write-Host "Nome: $($createResponse.instance.name)" -ForegroundColor Cyan
} else {
    Write-Host "Falha ao criar instancia" -ForegroundColor Red
    return
}

# 3. Verificar QR Code
Write-Host "`nVerificando QR code..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$qrResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$instanceId/qr"

if ($qrResponse -and $qrResponse.qr_code -and $qrResponse.qr_code.Length -gt 100) {
    Write-Host "QR Code gerado com sucesso!" -ForegroundColor Green
    Write-Host "Status: $($qrResponse.status)" -ForegroundColor Cyan
    Write-Host "Tamanho do QR: $($qrResponse.qr_code.Length) caracteres" -ForegroundColor Cyan
    
    $qrPreview = $qrResponse.qr_code.Substring(0, 100)
    Write-Host "Preview: $qrPreview..." -ForegroundColor DarkCyan
} else {
    Write-Host "QR Code ainda nao disponivel" -ForegroundColor Yellow
}

# 4. Listar todas as instancias
Write-Host "`nListando todas as instancias..." -ForegroundColor Yellow
$allInstances = Invoke-ApiRequest -Url "http://localhost:3000/api/instances"

if ($allInstances -and $allInstances.instances) {
    Write-Host "Total de instancias: $($allInstances.instances.Count)" -ForegroundColor Cyan
    
    foreach ($instance in $allInstances.instances) {
        Write-Host "- $($instance.name) ($($instance.id))" -ForegroundColor White
        Write-Host "  Status: $($instance.status)" -ForegroundColor Yellow
    }
}

# 5. URLs para teste manual
Write-Host "`nURLs para teste manual:" -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:3001/dashboard/instances" -ForegroundColor White
Write-Host "QR Code: http://localhost:3000/api/instances/$instanceId/qr-public" -ForegroundColor White
Write-Host "API Instancias: http://localhost:3000/api/instances" -ForegroundColor White

Write-Host "`nTESTE DE QR CODE: CONCLUIDO!" -ForegroundColor Green
Write-Host "ID da Instancia: $instanceId" -ForegroundColor Cyan
