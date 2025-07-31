# My-Wa-API 

![WhatsApp API](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

Sistema completo de automação WhatsApp com interface dashboard em tempo real, construído com Next.js, Express.js e Socket.IO.

## 🚀 Funcionalidades Principais

- **🔄 Dashboard em Tempo Real**: Interface Next.js com updates automáticos via Socket.IO
- **📱 Gerenciamento de Instâncias**: Criar, conectar, desconectar e excluir instâncias WhatsApp
- **🔗 QR Code Dinâmico**: Geração automática de QR codes em PNG para conexão
- **📊 Estatísticas ao Vivo**: Mensagens enviadas/recebidas, status de conexão, última atividade
- **🔧 Automação PowerShell**: Scripts para inicialização e gerenciamento de serviços
- **⚡ Socket.IO Integration**: Comunicação em tempo real entre frontend e backend
- **🐳 Docker Support**: Containerização completa com docker-compose
- **📦 Monorepo Structure**: Organização com Turbo para melhor performance

## 🏗️ Arquitetura do Sistema

```
my-wa-api/
├── apps/
│   ├── api/                    # Backend Express.js
│   │   ├── src/
│   │   │   ├── config/         # Configurações (logger, socket, database)
│   │   │   ├── controllers/    # Controllers da API
│   │   │   ├── middleware/     # Middlewares (auth, rate limiting)
│   │   │   ├── models/         # Modelos de dados
│   │   │   ├── routes/         # Rotas da API
│   │   │   ├── services/       # Serviços WhatsApp
│   │   │   └── index.ts        # Entry point
│   │   └── package.json
│   └── web/                    # Frontend Next.js
│       ├── src/
│       │   ├── app/            # App Router (Next.js 13+)
│       │   ├── components/     # Componentes React
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilitários
│       │   └── stores/         # Estado global
│       └── package.json
├── packages/
│   └── shared/                 # Tipos e utilitários compartilhados
├── scripts/                    # Scripts PowerShell de automação
├── docker-compose.yml          # Configuração Docker
└── package.json               # Root package.json
```

## ⚡ Quick Start

### 1. **Instalação**

```bash
# Clone o repositório
git clone https://github.com/Tonx-Cloud/my-wa-api.git
cd my-wa-api

# Instale as dependências
npm install
```

### 2. **Configuração do Ambiente**

```bash
# Copie os arquivos de exemplo
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configure as variáveis necessárias nos arquivos .env
```

### 3. **Inicialização Rápida (PowerShell)**

```powershell
# Windows - Execute o script de inicialização
.\scripts\start-all.ps1

# Ou inicie manualmente:
# Backend: npm run dev:api
# Frontend: npm run dev:web
```

### 4. **Acesso ao Sistema**

- **Dashboard**: http://localhost:3001/dashboard/instances
- **API Backend**: http://localhost:3000
- **Socket.IO**: ws://localhost:3000

## 🔧 Scripts de Automação PowerShell

O projeto inclui scripts PowerShell para facilitar o gerenciamento:

| Script | Descrição |
|--------|-----------|
| `start-all.ps1` | Inicia todos os serviços (API + Web) |
| `stop-all.ps1` | Para todos os serviços |
| `restart-all.ps1` | Reinicia todos os serviços |
| `status.ps1` | Verifica status dos serviços |

```powershell
# Exemplo de uso
.\scripts\start-all.ps1    # Iniciar tudo
.\scripts\status.ps1       # Verificar status
.\scripts\stop-all.ps1     # Parar tudo
```

## 📱 Uso do Dashboard

### **Criar Nova Instância**
1. Acesse o dashboard em `/dashboard/instances`
2. Clique em "Nova Instância"
3. Insira um nome para a instância
4. QR code será gerado automaticamente

### **Conectar WhatsApp**
1. Clique em "Gerar QR Code" na instância
2. Escaneie o QR code com seu WhatsApp
3. Aguarde a conexão (status mudará para "Conectado")

### **Gerenciar Instâncias**
- ✅ **Status em Tempo Real**: Verde (conectado), Amarelo (conectando), Vermelho (desconectado)
- 📊 **Estatísticas**: Mensagens enviadas/recebidas do dia
- 🔄 **Auto-refresh**: Atualização automática a cada 5 segundos
- 🗑️ **Excluir**: Remover instâncias não utilizadas

## 🔌 API Endpoints

### **Instâncias**
```http
GET    /api/instances-v2/all         # Listar todas as instâncias
POST   /api/instances-v2/create      # Criar nova instância
GET    /api/instances-v2/:id/qr      # Obter QR code
POST   /api/instances-v2/:id/logout  # Desconectar instância
DELETE /api/instances-v2/:id         # Excluir instância
```

### **Mensagens**
```http
POST   /api/messages/send            # Enviar mensagem
GET    /api/messages/history         # Histórico de mensagens
```

## 🔗 Socket.IO Events

### **Cliente → Servidor**
- `join_instance` - Entrar na sala da instância
- `leave_instance` - Sair da sala da instância

### **Servidor → Cliente**
- `{instanceId}:qr_received` - QR code recebido
- `{instanceId}:authenticated` - WhatsApp autenticado
- `{instanceId}:ready` - Instância pronta para uso
- `{instanceId}:disconnected` - Instância desconectada

## 🐳 Docker

### **Desenvolvimento**
```bash
# Subir todos os serviços
docker-compose up -d

# Logs em tempo real
docker-compose logs -f
```

### **Produção**
```bash
# Build e deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Tecnologias Utilizadas

### **Backend**
- **Express.js** - Framework web
- **Socket.IO** - Comunicação em tempo real
- **whatsapp-web.js** - Integração WhatsApp
- **TypeScript** - Tipagem estática
- **Winston** - Logging
- **Helmet** - Segurança

### **Frontend**
- **Next.js 13+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Heroicons** - Ícones
- **Socket.IO Client** - Comunicação em tempo real
- **Zustand** - Gerenciamento de estado

### **DevOps & Tools**
- **Turbo** - Monorepo build system
- **Docker** - Containerização
- **PM2** - Process manager
- **ESLint** - Linting
- **PowerShell** - Scripts de automação

## 📋 Variáveis de Ambiente

### **API (.env)**
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3001
```

### **Web (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
```

## 🔒 Segurança

- **Rate Limiting**: Proteção contra spam
- **CORS**: Configurado para origens específicas
- **Helmet**: Headers de segurança
- **Input Validation**: Validação de dados de entrada
- **Session Management**: Gerenciamento seguro de sessões

## 📊 Monitoramento

- **Winston Logging**: Logs estruturados
- **PM2 Monitoring**: Métricas de processo
- **Health Checks**: Endpoints de saúde
- **Real-time Status**: Status em tempo real via Socket.IO

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Tonx-Cloud/my-wa-api/issues)
- **Documentação**: [Wiki](https://github.com/Tonx-Cloud/my-wa-api/wiki)
- **Email**: hiltonsf@gmail.com

---

**⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!**

## 🚀 Roadmap

- [ ] Sistema de templates de mensagem
- [ ] Agendamento de mensagens
- [ ] Webhook system
- [ ] Métricas avançadas
- [ ] API para integrações externas
- [ ] Sistema de backup
- [ ] Multi-tenancy support
- [ ] Interface mobile responsiva
