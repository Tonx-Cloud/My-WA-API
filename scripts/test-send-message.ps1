# MY-WA-API - TESTE DE ENVIO DE MENSAGENS
# Criado: 2025-08-03

param(
    [string]$InstanceId = "",
    [string]$PhoneNumber = "",
    [string]$Message = "Teste de mensagem da API My-wa-API"
)

Write-Host "TESTE DE ENVIO DE MENSAGENS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

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

# Se nao foi fornecido ID da instancia, listar disponiveis
if (-not $InstanceId) {
    Write-Host "Listando instancias disponiveis..." -ForegroundColor Yellow
    $instances = Invoke-ApiRequest -Url "http://localhost:3000/api/instances"
    
    if ($instances -and $instances.instances) {
        Write-Host "`nInstancias encontradas:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $instances.instances.Count; $i++) {
            $instance = $instances.instances[$i]
            $statusColor = if ($instance.status -eq "ready") { "Green" } else { "Yellow" }
            Write-Host "[$i] $($instance.name) - Status: $($instance.status)" -ForegroundColor $statusColor
        }
        
        $selection = Read-Host "`nEscolha uma instancia (numero)"
        if ($selection -match '^\d+$' -and [int]$selection -lt $instances.instances.Count) {
            $InstanceId = $instances.instances[[int]$selection].id
            Write-Host "Instancia selecionada: $($instances.instances[[int]$selection].name)" -ForegroundColor Green
        } else {
            Write-Host "Selecao invalida" -ForegroundColor Red
            return
        }
    } else {
        Write-Host "Nenhuma instancia encontrada" -ForegroundColor Red
        return
    }
}

# Verificar status da instancia
Write-Host "`nVerificando status da instancia..." -ForegroundColor Yellow
$instanceStatus = Invoke-ApiRequest -Url "http://localhost:3000/api/instances/$InstanceId"

if (-not $instanceStatus) {
    Write-Host "Instancia nao encontrada" -ForegroundColor Red
    return
}

Write-Host "Status da instancia: $($instanceStatus.status)" -ForegroundColor Cyan

if ($instanceStatus.status -ne "ready") {
    Write-Host "AVISO: Instancia nao esta conectada (status: $($instanceStatus.status))" -ForegroundColor Yellow
    Write-Host "Para conectar, escaneie o QR code em:" -ForegroundColor Blue
    Write-Host "http://localhost:3001/dashboard/instances" -ForegroundColor White
    
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        return
    }
}

# Se nao foi fornecido numero, solicitar
if (-not $PhoneNumber) {
    Write-Host "`nFormatos aceitos de telefone:" -ForegroundColor Cyan
    Write-Host "- +5511999999999 (com codigo do pais)" -ForegroundColor White
    Write-Host "- 11999999999 (sem codigo do pais)" -ForegroundColor White
    Write-Host "- 5511999999999 (apenas numeros)" -ForegroundColor White
    
    $PhoneNumber = Read-Host "Digite o numero do WhatsApp"
    
    if (-not $PhoneNumber) {
        Write-Host "Numero nao fornecido" -ForegroundColor Red
        return
    }
}

# Normalizar numero de telefone
$PhoneNumber = $PhoneNumber -replace '[^0-9]', ''
if ($PhoneNumber.Length -eq 11 -and $PhoneNumber.StartsWith('11')) {
    $PhoneNumber = "55$PhoneNumber"
} elseif ($PhoneNumber.Length -eq 10) {
    $PhoneNumber = "5511$PhoneNumber"
}

Write-Host "Numero normalizado: $PhoneNumber" -ForegroundColor Cyan

# Preparar mensagem
$messageBody = @{
    phone = $PhoneNumber
    message = $Message
} | ConvertTo-Json

Write-Host "`nEnviando mensagem..." -ForegroundColor Yellow
Write-Host "Para: $PhoneNumber" -ForegroundColor Cyan
Write-Host "Mensagem: $Message" -ForegroundColor Cyan

# Enviar mensagem
$sendResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/messages/send" -Method "POST" -Body $messageBody

if ($sendResponse) {
    if ($sendResponse.success) {
        Write-Host "`nMENSAGEM ENVIADA COM SUCESSO!" -ForegroundColor Green
        Write-Host "ID da mensagem: $($sendResponse.messageId)" -ForegroundColor Cyan
        Write-Host "Timestamp: $($sendResponse.timestamp)" -ForegroundColor Cyan
    } else {
        Write-Host "`nFALHA AO ENVIAR MENSAGEM:" -ForegroundColor Red
        Write-Host "$($sendResponse.error)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nERRO: Nao foi possivel enviar a mensagem" -ForegroundColor Red
}

# Verificar historico de mensagens (se disponivel)
Write-Host "`nVerificando historico de mensagens..." -ForegroundColor Yellow
$messagesResponse = Invoke-ApiRequest -Url "http://localhost:3000/api/messages/$InstanceId"

if ($messagesResponse -and $messagesResponse.messages) {
    Write-Host "Total de mensagens: $($messagesResponse.messages.Count)" -ForegroundColor Cyan
    
    $recentMessages = $messagesResponse.messages | Sort-Object timestamp -Descending | Select-Object -First 5
    Write-Host "`nUltimas 5 mensagens:" -ForegroundColor Cyan
    
    foreach ($msg in $recentMessages) {
        Write-Host "- $($msg.timestamp): $($msg.message)" -ForegroundColor White
    }
} else {
    Write-Host "Nenhuma mensagem encontrada no historico" -ForegroundColor Yellow
}

Write-Host "`nTESTE DE MENSAGENS CONCLUIDO!" -ForegroundColor Green
