# 🔒 CONFIGURAÇÃO DE SEGURANÇA - MY-WA-API

## 📋 STATUS DE CREDENCIAIS

### ✅ Credenciais Atuais (Seguras)

**Data de Criação**: 03/08/2025 16:36:20 GMT-3
**Status**: ✅ ATIVAS E SEGURAS

```json
{
  "client_id": "GOOGLE_CLIENT_ID_CONFIGURADO_NO_ENV",
  "client_secret": "GOOGLE_CLIENT_SECRET_CONFIGURADO_NO_ENV",
  "project_id": "tonx-cloud",
  "status": "ATIVO",
  "creation_date": "2025-08-03T16:36:20-03:00",
  "note": "Credenciais seguras configuradas no arquivo .env"
}
```

### ❌ Credenciais Comprometidas (Revogadas)

**Data de Exposição**: 03/08/2025
**Status**: ❌ REVOGADAS E INATIVAS

```json
{
  "old_client_id": "[REDACTED - Previously exposed credentials]",
  "old_client_secret": "[REDACTED - Previously exposed credentials]",
  "status": "REVOGADO",
  "exposure_date": "2025-08-03",
  "revocation_date": "2025-08-03T16:38:00-03:00"
}
```

## 🚨 AÇÕES DE SEGURANÇA EXECUTADAS

### 1. ✅ Rotação de Credenciais

- [x] Revogação das credenciais comprometidas no Google Cloud Console
- [x] Geração de novas credenciais OAuth
- [x] Atualização do arquivo `.env` com credenciais seguras
- [x] Implementação de sistema de variáveis de ambiente

### 2. ✅ Proteção do Código

- [x] Remoção de segredos hardcoded do `docker-compose.yml`
- [x] Implementação de variáveis de ambiente com valores padrão
- [x] Atualização do `.gitignore` para proteção adicional
- [x] Criação de template `.env.example` para desenvolvedores

### 3. ✅ Documentação

- [x] Criação desta documentação de segurança
- [x] Instruções de setup para novos desenvolvedores
- [x] Registro de credenciais comprometidas para referência

## 🛠️ CONFIGURAÇÃO PARA DESENVOLVEDORES

### Primeiro Setup

1. Clone o repositório:

   ```bash
   git clone https://github.com/Tonx-Cloud/my-wa-api.git
   cd my-wa-api
   ```

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Edite o arquivo `.env` com suas credenciais:

   ```bash
   # Use um editor de texto para preencher:
   # GOOGLE_CLIENT_ID=sua_client_id_aqui
   # GOOGLE_CLIENT_SECRET=sua_client_secret_aqui
   ```

4. Instale dependências e execute:
   ```bash
   npm install
   npm run dev
   ```

### Google OAuth Setup

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um novo projeto ou use o existente `tonx-cloud`
3. Ative a API do Google OAuth 2.0
4. Crie credenciais OAuth 2.0:
   - Application type: "Web application"
   - Authorized JavaScript origins: `http://localhost:3000`, `https://seudominio.com`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
5. Copie as credenciais para o arquivo `.env`

## 🔐 SEGURANÇA IMPLEMENTADA

### Proteções Ativas

- ✅ **Variáveis de Ambiente**: Todas as credenciais são carregadas via `.env`
- ✅ **Git Protection**: `.gitignore` protege arquivos sensíveis
- ✅ **Template System**: `.env.example` orienta configuração segura
- ✅ **Docker Integration**: Docker Compose usa variáveis de ambiente
- ✅ **Credential Rotation**: Sistema permite rotação fácil de credenciais

### Políticas de Segurança

1. **NUNCA** commit arquivos `.env` ou credenciais no código
2. **SEMPRE** use variáveis de ambiente para dados sensíveis
3. **RODE** credenciais regularmente (trimestral recomendado)
4. **MONITORE** o histórico Git para vazamentos de segredos
5. **DOCUMENTE** todas as mudanças de credenciais

## 📞 CONTATO EM CASO DE PROBLEMAS

Se encontrar problemas de segurança:

1. **NÃO** poste credenciais em issues públicos
2. **REVOGUE** imediatamente as credenciais no Google Cloud Console
3. **CONTACTE** a equipe de desenvolvimento via canal seguro
4. **DOCUMENTE** o incidente neste arquivo

## 📚 REFERÊNCIAS

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Última Atualização**: 03/08/2025 16:39:00 GMT-3
**Próxima Revisão**: 03/11/2025 (Trimestral)
