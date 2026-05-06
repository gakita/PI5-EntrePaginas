# RF13 - Encerrar conversa e salvar sugeridos

## Objetivo

Ao encerrar a conversa, consolidar preferencias e salvar sugestoes relevantes.

## Status

Implementado no backend.

## Endpoints

- `POST /chat/close`
- `GET /avaliacoes`
- `POST /avaliacoes`

## Regra de negocio

- `POST /chat/close` le a ultima conversa
- a IA infere preferencias consolidadas
- o backend salva preferencias em `PREFERENCIAS_USUARIO`
- o backend salva sugestoes em `SUGESTOES_CONVERSA`
- avaliacoes do usuario sao armazenadas separadamente em `AVALIACOES`

## Banco

- `PREFERENCIAS_USUARIO`
- `SUGESTOES_CONVERSA`
- `AVALIACOES`

## Frontend

Fluxo recomendado:

1. ao fechar o chat, chamar `POST /chat/close`
2. se o usuario avaliar itens lidos, usar `POST /avaliacoes`
3. recuperar avaliacoes existentes com `GET /avaliacoes`

## Erros esperados

- `200` com mensagem informativa se nao houver conversa suficiente para consolidar
- `401` se usuario nao estiver autenticado

## Checklist

- chamar `close` ao fim da sessao de chat, nao apenas `clear`
- tratar resposta de sucesso parcial
- oferecer UI para avaliar recomendacoes/livros lidos
