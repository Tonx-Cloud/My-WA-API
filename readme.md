# My-wa-API: Sua Plataforma de Automação Open-Source

## 🛠 Instruções Detalhadas da Stack

1. **Banco de Dados**
   * SQLite** para simplicidade em desenvolvimento (zero configuração).
   * Depois migrar para **PostgreSQL** em produção, garantindo concorrência, escalabilidade e integridade referencial.
   * SQLite é ideal para projetos pequenos, testes e protótipos.
   * PostgreSQL lida melhor com múltiplas escritas simultâneas, replicação, backups e grandes volumes de dados.

2. **Filas e Jobs em Background**
     * Adicionar **Redis + BullMQ** para processar tarefas demoradas (ex.: envio em massa).
     * API enfileira tarefas e responde imediatamente; um worker consome a fila em paralelo.
     * Desacopla operações pesadas do loop principal do Node.js.
     * Melhora a responsividade, permite retries automáticos e fácil escalabilidade de workers.

3. **Testes End-to-End (E2E)**
   * Playwright** para automatizar um navegador real e validar fluxos completos (login, QR code, envio/recebimento).
   * Testes unitários (Jest) não cobrem integração entre frontend, backend e WhatsApp.
   * E2E garante que todo o sistema funcione antes de cada release.

4. **Containerização & Deploy**
   * Dockerfile** para a API e a interface web.
   * Orquestrar com **docker-compose.yml** incluindo PostgreSQL e Redis para um único comando de inicialização.
   * Elimina o clássico “funciona na minha máquina”.
   * Garante ambientes idênticos do desenvolvimento à produção e facilita o onboard de novos devs.

5. **Documentação da API**
   * Swagger/OpenAPI** usando `swagger-jsdoc` + `swagger-ui-express`.
   * Documentação interativa e “viva”, sincronizada com o código.
   * Usuários podem testar chamadas diretamente do navegador, acelerando a integração.


## 🔧 Principais Funcionalidades

*   **🔐 Sistema completo de autenticação:** Login local e Google OAuth utilizando NextAuth.js, JWT e Passport.js.
*   **💬 Integração com WhatsApp:** Conexão e automação via `whatsapp-web.js`.
*   **📱 Interface responsiva:** Desenvolvida com React e TailwindCSS, com suporte multi-idioma (i18n).
*   **📊 Dashboard:** Interface para gerenciamento de instâncias e analytics.
*   **🔄 Sistema de filas:** Processamento assíncrono de mensagens utilizando [Redis com BullMQ / RabbitMQ].
*   **💾 Banco de dados:** Persistência de dados utilizando [PostgreSQL / MySQL / MongoDB].
*   **🔔 Notificações em Tempo Real:** Atualizações instantâneas via WebSockets ([Socket.IO]).
*   **📚 Documentação da API:** Documentação interativa via [Swagger/OpenAPI].


### Roadmap Estratégico

* **Curto Prazo (DX & Deploy):**
  1. Docker + Docker Compose
  2. Swagger / OpenAPI

* **Médio/Longo Prazo (Escalabilidade & Resiliência):**
  1. Redis + BullMQ
  2. Migração para PostgreSQL
  3. Testes E2E com Playwright

* **Extras de Qualidade:**
  * Badges de build, cobertura e licença
  * GIF demonstrativo no topo do README
  * Seção “Por que usar esta API?”, destacando benefícios práticos
  * “Quick Start” com comandos de 5 minutos e explicações passo a passo

### Roadmap de Evolução

* [ ] 🐳 **Containerização com Docker**
* [ ] 📚 **Documentação Interativa com Swagger/OpenAPI**
* [ ] ⚙ **Filas com BullMQ/Redis**
* [ ] 🧪 **Testes E2E com Playwright**
* [ ] 📊 **Dashboard de Métricas**
* [ ] 🤖 **Suporte a Grupos e Campanhas**


### Por que usar esta API?

Esta não é apenas mais uma API de WhatsApp. Ela foi projetada do zero com foco em:

* **🚀 Multi-Instância Real:** Gerencie múltiplas contas simultaneamente.
* **🏗 Arquitetura Monorepo com Turbo:** Frontend, backend e pacotes organizados.
* **🔒 Segurança como Prioridade:** Autenticação com JWT e CSRF.
* **⚡ Comunicação em Tempo Real:** Interface web reativa.
* **🎨 Interface Moderna e Intuitiva:** Painel de controle responsivo.
* **📦 Pronto para Produção:** Logging robusto, retries e monitoramento.


## 🚀 Começando em 5 Minutos (Quick Start)

### 1. Pré-requisitos

* Node.js `v18.x` ou superior
* npm `v8.x` ou superior
* Git

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/Tonx-Cloud/my-wa-api.git
cd my-wa-api
# Instale todas as dependências
npm install
```

### 3. Configuração do Ambiente

As variáveis de ambiente são essenciais para a segurança e configuração:

```bash
# Backend (API)
cp apps/api/.env.example apps/api/.env
# Frontend (Web)
cp apps/web/.env.example apps/web/.env.local
```

Abra os arquivos `.env` e `.env.local` e ajuste as variáveis conforme sua infraestrutura.

### 4. Executando o Projeto

```bash
# Inicializa API e Web simultaneamente
npm run dev
```

* **API Backend** estará disponível em `http://localhost:3000`
* **Interface Web** estará disponível em `http://localhost:3001`

### 5. Desenvolvimento

### Scripts Disponíveis

*   `npm run dev`          # Inicia ambiente de desenvolvimento (backend e/ou frontend)
*   `npm run build`        # Compila o projeto (backend e/ou frontend)
*   `npm start`            # Inicia em produção com PM2
*   `npm run test`         # Executa testes unitários e de integração
*   `npm run test:e2e`     # Executa testes end-to-end (*planejado*)
*   `npm run lint`         # Executa linting com ESLint
*   `npm run format`       # Formata o código com Prettier


## 📖 Uso da API e Endpoints

A API é organizada em recursos RESTful. Documentação interativa disponível via Swagger.

#### Principais Endpoints

* **Autenticação:** `POST /api/auth/login`
* **Instâncias:** `POST /api/instances`, `GET /api/instances/:id/qr`
* **Mensagens:** `POST /api/messages/send`, `POST /api/messages/send-bulk`
* **Webhooks:** `POST /api/webhooks/whatsapp`

### 📁 Estrutura do Projeto

```plain
wa-api/
├── apps/
│   ├── api/    # Backend Node.js/Express
│   └── web/    # Frontend Next.js
├── packages/
│   ├── shared/  # Tipos e utilitários comuns
│   └── database/ # Abstração de acesso a dados
├── turbo.json   # Configuração do Turborepo
└── package.json # Dependências e scripts
```

## ✅ Instruções para Integração Frontend/Backend

### **Frontend (Next.js):**

* **Estrutura do Projeto:**
  * Organizar páginas em pastas dentro de `/app` para manter rotas claras e escaláveis.
  * Componentes reutilizáveis devem ficar em `/components`, organizados em subdiretórios.
  * Usar Server Components sempre que possível para melhor desempenho.

* **Gerenciamento de Estado:**
  * Utilizar **Zustand** para estados simples e rápidos.
  * Considerar **React Query** para gestão de dados do servidor (cache, carregamento, erros).

* **Performance e Otimização:**
  * Otimizar imagens usando o componente `next/image`.
  * Hidratação seletiva para melhorar performance em componentes interativos.

* **Qualidade de Código:**
  * Adicionar ESLint e Prettier para garantir consistência de código.
  * Implementar testes unitários com Jest e React Testing Library para componentes críticos.

### Integração Frontend-Backend:

* **Comunicação e API:**
  * Utilizar Axios para chamadas HTTP, garantindo melhor controle de erros e interceptadores.
  * Centralizar a lógica de requisição em hooks personalizados como `useApi()`.
 * **Segurança:**
  * Implementar middleware de autenticação no backend com JWT e middleware no frontend para validação de rotas protegidas.
* **Logs e Monitoramento:**
  * Implementar logs estruturados e monitoramento centralizado utilizando ferramentas como Sentry.
* **Banco de Dados:**
  * SQLite/PostgreSQL come scripts automatizados para migração entre ambientes.
* **Filas e Jobs:**
  * Redis + BullMQ priorizando tarefas para tratamento de falhas e retries inteligentes.
* **Testes E2E:**
  * Playwright integrado com GitHub Actions para executar testes em CI/CD.
* **Containerização:**
  * Docker Compose com volumes persistentes para preservar o estado local de desenvolvimento (dados).
* **Documentação:**
  * Swagger com endpoints dividos por tags para maior organização.

### Fluxos Principais:

#### Autenticação

1.  Login local ou via Google OAuth.
2.  Geração de token JWT.
3.  Utilização do token para proteção de rotas sensíveis.

#### Conexão WhatsApp

1.  Criação de uma instância.
2.  Geração de QR Code para pareamento via WhatsApp Web.
3.  Gestão do estado da sessão (conectado, desconectado, erro).
4.  Envio/recebimento de mensagens através da API.

#### 🔒 Segurança

*   Todas as credenciais e chaves sensíveis são gerenciadas via variáveis de ambiente.
*   Proteção contra ataques comuns (XSS, CSRF, etc.) via Helmet.
*   Rate limiting configurado em endpoints sensíveis.
*   Validação rigorosa de entrada de dados com Joi.
*   Logs seguros que não registram dados sensíveis dos usuários ou mensagens.
*   Senhas armazenadas com hashing seguro (bcrypt).

### Checklist de Implementação Rápida:

* [ ] Estrutura organizada do frontend com `/components`, `/app`.
* [ ] Estado com Zustand e React Query.
* [ ] Axios centralizado.
* [ ] ESLint e Prettier configurados.
* [ ] Middleware JWT para frontend e backend.
* [ ] Logs estruturados e monitoramento com Sentry.
* [ ] Scripts de migração automática SQLite/PostgreSQL.
* [ ] Filas priorizadas com Redis + BullMQ.
* [ ] CI/CD com GitHub Actions e Playwright.
* [ ] Docker Compose com volumes.
* [ ] Swagger documentado por tags.

### Esquema do Dashboard

#### Barra Superior

* **🔐 Autenticação / Perfil do Usuário:**
  * Exibir status de login.
  * Acesso rápido ao perfil, configurações e logout.
  * Integração com Google OAuth visível.

* **🔔 Notificações em Tempo Real:**
  * Ícone para exibir notificações instantâneas via WebSockets (Socket.IO).
  * Contador de notificações não lidas.
  
* **📱 Suporte Multi-idioma:**
  * Seletor de idiomas integrado para facilitar a troca dinâmica.

#### Barra Lateral (Menu Principal)

* **🏠 Dashboard Inicial:**
  * Visão geral das instâncias conectadas e analytics rápidos.

* **📊 Analytics:**
  * Estatísticas detalhadas de mensagens enviadas/recebidas.
  * Indicadores gráficos de performance e status do sistema.

* **💬 WhatsApp:**
  * Gestão das instâncias do WhatsApp.
  * Status das conexões via `whatsapp-web.js`.
  * Configurações específicas para automação.

* **🔄 Filas de Mensagens:**
  * Monitoramento do status e da performance das filas.
  * Interface para processamento assíncrono (BullMQ/RabbitMQ).
* **💾 Gerenciamento de Dados:**
  * Acesso ao banco de dados (PostgreSQL/MySQL/MongoDB).
  * Painel para visualização e gerenciamento básico dos dados.

* **📚 Documentação API:**
  * Link direto para a documentação interativa via Swagger/OpenAPI.

* **⚙️ Configurações do Sistema:**
  * Configuração de autenticação, notificações e integrações.

* **📱 Área Principal (Central):**
	* Conteúdo dinâmico alterado conforme seleção na barra lateral.
	* Interface responsiva usando React e TailwindCSS.
	* Componentes com suporte responsivo para adaptação automática em dispositivos móveis.


## 📄 Licença

Este projeto está sob a **Licença MIT**. Veja o arquivo [LICENSE](LICENSE).

<div align="center">
  Made with ❤️ by **Tonx-Cloud**
</div>

[![Licença](https://img.shields.io/github/license/Tonx-Cloud/my-wa-api)](https://github.com/Tonx-Cloud/my-wa-api) [![Status do Build](https://img.shields.io/github/actions/workflow/status/Tonx-Cloud/my-wa-api/ci.yml)](https://github.com/Tonx-Cloud/my-wa-api/actions) [![Issues Abertas](https://img.shields.io/github/issues/Tonx-Cloud/my-wa-api)](https://github.com/Tonx-Cloud/my-wa-api/issues) [![Forks](https://img.shields.io/github/forks/Tonx-Cloud/my-wa-api?style=social)](https://github.com/Tonx-Cloud/my-wa-api/network) [![Stars](https://img.shields.io/github/stars/Tonx-Cloud/my-wa-api?style=social)](https://github.com/Tonx-Cloud/my-wa-api/stargazers)


## 🤝 Como Contribuir

1. Faça um **Fork** deste repositório.
2. Crie uma branch: `git checkout -b feature/MinhaFeature`.
3. Faça seu commit: `git commit -m 'feat: Minha nova feature'`.
4. Envie para o repositório remoto: `git push origin feature/MinhaFeature`.
5. Abra um **Pull Request**.