# Requisito: Serviço de Catálogo e Enriquecimento (catalogService)

Este documento descreve de forma direta o requisito de catálogo, busca e enriquecimento de obras, integrando as APIs do Google Books para apoiar a exibição de capas, sinopses e carrosséis.

---

## 🎯 Objetivo

Gerenciar a busca de livros/HQs/mangás no catálogo externo, fornecer as categorias estáticas do carrossel da tela inicial, e enriquecer as obras recomendadas pela Inteligência Artificial com dados reais (capa, sinopse, link de preview).

---

## 📋 Regras de Negócio e Requisitos Associados

*   **RF05 (Carrossel de Categorias):** Fornece as categorias do carrossel da home de forma estática sem depender de chamadas à Inteligência Artificial.
*   **RF06 (Filtros e Catálogo):** Permite buscar obras na API do Google Books aplicando filtros combinados (título, autor, categoria, tema) com paginação.
*   **RIA04 (Pós-processamento e Enriquecimento):** As obras genéricas recomendadas pela IA são enriquecidas com dados completos da API do Google Books (capa, sinopse, links, visualizador embutido).
*   **RNF12 (Tolerância a Falhas):** Caso a chave de API do Google Books cadastrada seja inválida ou rejeitada por limites, o sistema faz um retry imediato e automático de forma pública (sem chave), mantendo a busca no ar.

---

## 🧪 Cenários de Testes Automatizados (Já Testados)

Os cenários foram integralmente testados e validados no arquivo `test/catalogService.test.js`:

### 1. Retorno de Categorias Curadas para o Carrossel (RF05)
*   **O que foi testado:** A chamada que monta o carrossel de categorias da página inicial.
*   **Comportamento verificado:** Retorna com sucesso um array com no mínimo 5 categorias, contendo dados corretos como `slug`, `label`, `googleBooksQuery` e imagem fallback.

### 2. Busca Paginada no Catálogo com Filtros Combinados (RF06)
*   **O que foi testado:** A tradução dos parâmetros informados pelo usuário na busca (título, autor, tema, categoria) em requisições para a API do Google Books.
*   **Comportamento verificado:** A busca traduz os termos corretamente (incluindo operators `inauthor`, `subject`), utiliza indexação de página baseada em 10 itens por vez, força idioma em português (`pt`) e normaliza a resposta de saída (mapeando capas seguras via HTTPS).

### 3. Enriquecimento de Metadados de Recomendações da IA (RIA04)
*   **O que foi testado:** O fluxo de pegar o JSON de recomendação retornado pela IA e buscar as informações completas de catálogo.
*   **Comportamento verificado:** Encontra o livro de forma precisa utilizando operador estrito (`intitle:"..." inauthor:"..."`), preenche capa, sinopse, data de publicação, link de leitura, e identifica a disponibilidade de leitura parcial/embutida (`embeddable` e `viewability`).

### 4. Recuperação Automática em Erro de Chave de API (RNF12)
*   **O que foi testado:** A resiliência da aplicação caso a chave do Google Books no ambiente pare de funcionar ou seja rejeitada temporariamente.
*   **Comportamento verificado:** Ao receber um erro de servidor (como `503`), o sistema intercepta, remove a chave inválida e tenta buscar o catálogo de forma pública com sucesso, garantindo que o usuário não receba tela de erro.
