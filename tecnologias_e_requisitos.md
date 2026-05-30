# Entre Páginas — Tecnologias e Requisitos do Sistema

Este documento apresenta uma visão técnica consolidada do sistema **Entre Páginas**, detalhando a pilha de tecnologia utilizada no desenvolvimento do MVP e a especificação completa de requisitos funcionais, não funcionais e de inteligência artificial.

---

## 🛠️ Pilha de Tecnologias (Tech Stack)

O sistema adota uma arquitetura em três camadas completamente desacoplada (Frontend, Backend e Banco de Dados/Nuvem).

### 1. Camada de Apresentação (Frontend Web SPA)
*   **Framework Principal:** Vue.js 3 (versão `3.5.30`) integrado com **TypeScript**.
*   **Gerenciamento de Estado:** Pinia (versão `3.0.4`) para controle reativo de estado global (estados do chat, sessão do quiz e preferências).
*   **Roteamento:** Vue Router (versão `5.0.3`) para controle de navegação e rotas protegidas no cliente.
*   **Componentes Visuais (UI):** Vuetify 4 (versão `4.0.2`), implementando a especificação Material Design com alta responsividade.
*   **Estilização Utilitária:** Tailwind CSS v4 (versão `4.2.1`) para design ágil de layouts e polimento de componentes.
*   **Build Tool & Bundler:** Vite (versão `8.0.0`) para tempos de compilação ultra-rápidos.
*   **Tipografia e Ícones:** Fontes Roboto, Roboto Mono e Playfair Display (via FontSource), integradas com FontAwesome e Material Design Icons (MDI).

### 2. Camada de Aplicação (Backend REST API)
*   **Plataforma de Execução:** Node.js (Ambiente assíncrono rodando com suporte a CommonJS).
*   **Framework Web:** Express.js v5 (versão `5.1.0`) para gerenciamento de rotas HTTP, controladores e barramento de middlewares.
*   **Segurança e Autenticação:**
    *   `jsonwebtoken` (versão `9.0.2`) para geração e validação de tokens de sessão JWT.
    *   `bcrypt` (versão `6.0.0`) para hashing criptográfico forte e unidirecional de senhas com salting.
*   **Comunicação (E-mail):** `nodemailer` (versão `8.0.7`) para envio automatizado de e-mails no fluxo de redefinição de senha.
*   **Dev Tools:** `nodemon` (versão `3.1.14`) para reload automático do servidor em desenvolvimento.

### 3. Camada de Persistência e Serviços Cloud
*   **Banco de Dados:** **Oracle Autonomous Database** (Instância gerenciada em nuvem na Oracle Cloud).
    *   **Conectividade:** Driver nativo `oracledb` (versão `6.9.0`) configurado com conexão segura mTLS através do arquivo de credenciais compactado (**Oracle Connection Wallet**).
*   **Inteligência Artificial (IA Generativa):**
    *   **Provedor:** API oficial do Google Gemini.
    *   **SDK Utilizado:** `@google/generative-ai` (versão `0.24.1`).
    *   **Modelo Utilizado:** `gemini-1.5-flash` / `gemini-2.0-flash` para geração de chat, quiz adaptativo e inferência de interesses.
*   **Integração de Catálogos Externa:** Consumo da **Google Books API** para busca, paginação e enriquecimento de metadados das obras (capa, sinopse, autores, links de preview e leitura).

---

## 🗄️ Modelagem de Dados (Tabelas do Banco)

O banco de dados relacional contém seis tabelas principais para suportar a lógica do negócio:
1.  **`FERNANDO.USUARIOS_TESTE`**: Credenciais de conta (NOME, EMAIL, SENHA criptografada e data de criação).
2.  **`CONVERSAS`**: Armazena estritamente a última conversa ativa por usuário (CLOB JSON). Possui uma restrição de chave única no e-mail para garantir a retenção de apenas uma sessão ativa por usuário.
3.  **`PREFERENCIAS_USUARIO`**: Armazena gêneros literários, formatos (livro, HQ, mangá) e autores favoritos inferidos pela IA ou salvos pelo usuário (CLOB JSON).
4.  **`SUGESTOES_CONVERSA`**: Registro técnico individualizado de cada livro sugerido em chats encerrados (título, autor, justificativa, sensitiveContent, capa, sinopse) para fins de enriquecimento e auditoria sem identificação pessoal.
5.  **`QUIZ_SESSOES`**: Session manager do quiz adaptativo, mantendo a sequência de perguntas objetivas genéricas e dinâmicas geradas pela IA e as respostas dadas pelo usuário.
6.  **`AVALIACOES`**: Registro de notas (1 a 5) e comentários das obras cadastradas (vinculado ao `googleBooksId`). Usada pela IA para bloquear a recomendação de livros já lidos.
7.  **`PASSWORD_RESET_TOKENS`**: Armazena hashes de tokens temporários emitidos para redefinição de senhas com expiração controlada.

---

## 📋 Levantamento de Requisitos do Sistema

### 1. Requisitos Funcionais (RF)

| ID | Requisito | Descrição | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **RF01** | Cadastro de usuário | Permitir a criação de contas no sistema informando nome, e-mail e senha. | 1) Validação sintática de e-mail;<br>2) Política de senha segura;<br>3) Autenticação após criação;<br>4) Mensagens claras de erro em e-mails duplicados. |
| **RF02** | Login e logout | Autenticar credenciais e encerrar sessões do usuário de forma segura. | 1) Login com e-mail e senha;<br>2) Emissão de token JWT válido;<br>3) Proteção de rotas protegidas por cabeçalho Authorization;<br>4) Logout invalida sessão. |
| **RF03** | Recuperação de senha | Permitir a redefinição de senhas esquecidas com tokens de segurança enviados por e-mail. | 1) Solicitação informando e-mail;<br>2) Envio de link de redefinição via e-mail (SMTP);<br>3) Hashing da nova senha com bcrypt;<br>4) Token com expiração temporária automática. |
| **RF04** | Preferências salvas | Cadastrar e gerenciar preferências de leitura (gêneros, formatos, autores) persistindo no banco de dados. | 1) Criação e edição manual pelo usuário;<br>2) Persistência física em CLOB JSON no Oracle;<br>3) As preferências influenciam a IA;<br>4) Permite resetar as preferências. |
| **RF05** | Carrossel de banners | Exibir um carrossel visual dinâmico com categorias curadas de leitura na página inicial. | 1) Carregamento de categorias estáticas configuradas;<br>2) Exibição de imagens/ícones responsivos;<br>3) Rolagem horizontal automática;<br>4) Carrega sem depender de chamadas da IA. |
| **RF06** | Sistema de filtros | Filtrar resultados de catálogo na busca geral por múltiplos filtros combinados (categoria, autor, tipo). | 1) Chips dinâmicos aplicáveis e removíveis;<br>2) Feedback visual de estado de filtros ativos;<br>3) Paginação de catálogo de obras;<br>4) Botão para limpar todos os filtros simultaneamente. |
| **RF07** | Banner onClick Filtra | Clicar em um banner de categoria do carrossel da home aplica o filtro automaticamente na barra de busca. | 1) Clique redireciona com chip de filtro ativo;<br>2) Atualiza o catálogo;<br>3) Não duplica chips;<br>4) Remoção fácil do chip de filtro. |
| **RF08** | Busca expande para Chat | O clique na barra de pesquisa na home expande a interface e altera para o modo chat conversacional. | 1) Transição visual suave para caixa de chat;<br>2) Carregamento do histórico do último chat ativo;<br>3) Mantém os filtros ativos da barra no chat;<br>4) Permite fechamento rápido. |
| **RF09** | Chat de Recomendação | Conversar em tempo real com assistente de IA generativa para obter recomendações literárias contextualizadas. | 1) Respostas interativas em linguagem natural;<br>2) Devolução de lista de livros estruturada com capa;<br>3) IA respeita as preferências e histórico de leitura;<br>4) Integração nativa com o SDK do Gemini. |
| **RF10** | Quiz Adaptativo | Realizar um quiz interativo que gera perguntas dinâmicas baseadas nas respostas anteriores do usuário. | 1) Perguntas iniciais genéricas configuradas;<br>2) Perguntas de IA em tempo real a partir da 3ª resposta;<br>3) Máximo de 8 perguntas por sessão;<br>4) Recomendações personalizadas ao final. |
| **RF11** | Aviso de Temas Sensíveis | Detectar e alertar o usuário sobre obras contendo conteúdos de gatilho, exigindo consentimento de abertura. | 1) Propriedade *sensitiveContent* detectada pela IA;<br>2) Exibição de tag visual chamativa nas obras sensíveis;<br>3) Modal exige clique "Confirmar" antes de revelar detalhes;<br>4) Opção de cancelar e retornar. |
| **RF12** | Última Conversa Salva | O banco de dados armazena apenas a última sessão de conversa ativa do usuário. | 1) Nova conversa substitui integralmente a anterior;<br>2) Reabrir exibe apenas a última conversa ativa;<br>3) Isolamento de dados entre usuários;<br>4) Garantido por restrição única no Oracle. |
| **RF13** | Salvar ao Encerrar | Encerrar o chat ativamente atualiza as preferências consolidadas no banco de dados. | 1) Clique no botão "Encerrar conversa" na tela;<br>2) A IA infere interesses do diálogo através de prompt secundário;<br>3) Persistência de preferências e obras na tabela de sugestões;<br>4) Reseta o chat ativo. |

---

### 2. Requisitos Não Funcionais (RNF)

*   **RNF01 (Desempenho da Busca):** O catálogo de livros deve paginar e renderizar resultados da busca tradicional em &le; 2 segundos em condições normais.
*   **RNF02 (Desempenho do Chat de IA):** O tempo total de resposta do chat conversacional (contexto + geração de IA + enriquecimento de APIs) deve ser &le; 10 segundos para 90% das chamadas.
*   **RNF03 (Segurança - Criptografia de Senhas):** As senhas dos usuários devem ser persistidas utilizando criptografia forte bcrypt com salting. A autenticação da sessão deve ocorrer via tokens de curta duração JWT.
*   **RNF04 (Segurança - Transporte):** Todo tráfego de rede e endpoints da API devem ser protegidos sob o protocolo de criptografia HTTPS/TLS 1.3.
*   **RNF05 (Controle de Acesso):** Endpoints protegidos exigem token JWT válido, impedindo que usuários maliciosos visualizem dados de terceiros.
*   **RNF06 (LGPD - Minimização de Dados):** Coletar e armazenar unicamente dados estritamente necessários para a prestação do serviço contratado (nome, e-mail, senha e preferências literárias).
*   **RNF07 (LGPD - Transparência):** O painel do usuário deve oferecer completa visibilidade e edição das preferências gravadas, e permitir apagar o histórico de chats a qualquer momento.
*   **RNF08 (LGPD - Retenção Limitada):** Exclusão física automática de chats antigos ao iniciar novos (RF12) e expiração temporal de tokens de senha temporários inutilizados.
*   **RNF09 (Responsividade):** A SPA em Vue.js deve adaptar seu design fluidamente para desktops, tablets e smartphones de qualquer resolução.
*   **RNF10 (Acessibilidade):** A interface deve adotar contraste de cores adequado e marcadores descritivos para garantir total acessibilidade com leitores de tela.
*   **RNF11 (Disponibilidade):** A infraestrutura da API deve operar com taxa de atividade &ge; 99% mensal em ambiente de homologação.
*   **RNF12 (Tolerância a Falhas):** Exibir alertas visuais explicativos amigáveis ao usuário final se a API do Google Gemini ou a Google Books API apresentarem indisponibilidade.
*   **RNF13 (Escalabilidade):** O código backend deve ser estruturado em camadas desacopladas (Controladores, Serviços, Modelos e Middlewares) facilitando manutenções e novas integrações.
*   **RNF14 (Observabilidade):** Implementar logging de auditoria estruturado das chamadas críticas (comportamento de IA e conexões Oracle) e barramento centralizado de tratamento de erros.
*   **RNF15 (Testabilidade):** Cobertura robusta de testes unitários de rotas e testes integrados de ponta a ponta dos fluxos complexos de Chat e Quiz Adaptativo.

---

### 3. Requisitos Específicos de Inteligência Artificial (RIA)

*   **RIA01 (Injeção de Contexto Dinâmico):** Injetar em tempo real nas chamadas da IA as preferências declaradas do usuário e a lista de livros que ele já avaliou (lidos) com o objetivo de bloquear recomendações repetidas.
*   **RIA02 (Formato Estruturado Estrito):** O modelo Gemini deve retornar a resposta sempre em um objeto estruturado JSON em conformidade com o schema restrito definido no cabeçalho das instruções de sistema (`message` conversacional e array `recommendations`).
*   **RIA03 (Explicabilidade Literária):** Cada recomendação do array deve conter uma justificativa clara, empática e curta conectando os interesses informados no perfil do usuário com as nuances da obra recomendada.
*   **RIA04 (Pós-processamento de Formato):** O backend do sistema deve limpar automaticamente eventuais tags markdown (ex: ```json) da resposta do LLM e validar o JSON sintaticamente antes do enriquecimento de metadados.
*   **RIA05 (Detecção de Temas Sensíveis):** O modelo do Gemini deve analisar semanticamente a indicação e sinalizar de forma autônoma a flag `sensitiveContent: true` sempre que a obra abordar temas de violência, drogas ou saúde mental.
*   **RIA06 (Isolamento de Diálogo):** O motor de chat deve ser alimentado apenas com a última conversa ativa para otimizar o consumo de tokens e preservar o sigilo das interações passadas.
*   **RIA07 (Sumarização no Encerramento):** No encerramento da conversa, um agente de IA deve rodar um prompt em background avaliando a conversa para inferir os novos gêneros, tipos e autores favoritos, atualizando automaticamente as preferências do leitor no banco.
