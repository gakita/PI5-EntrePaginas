# RF08 - Busca expande para modo chat

## Objetivo

Transformar a interacao de busca em entrada para a experiencia conversacional.

## Status

Suporte de backend implementado via modulo de chat. A expansao visual e comportamento de UI sao do frontend.

## Endpoints envolvidos

- `POST /chat/message`
- `GET /chat/history`
- `DELETE /chat/history`

## Regra de negocio

- o backend recebe texto livre e responde com recomendacoes estruturadas
- a UI pode decidir quando sair do modo busca e entrar em modo chat

## Frontend

Fluxo recomendado:

1. usuario interage com a busca principal
2. frontend expande para a interface de chat
3. texto digitado e enviado para `POST /chat/message`
4. historico pode ser recuperado com `GET /chat/history`

## Checklist

- manter transicao clara entre busca simples e chat
- reidratar historico se usuario recarregar a pagina
- limpar historico apenas com acao explicita
