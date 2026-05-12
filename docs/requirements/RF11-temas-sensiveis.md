# RF11 - Aviso de temas sensiveis

## Objetivo

Informar ao usuario quando uma recomendacao trouxer tema sensivel e pedir confirmacao antes de aprofundar.

## Status

Suporte de backend implementado. O aviso visual e responsabilidade do frontend.

## Endpoints envolvidos

- `POST /chat/message`
- `POST /quiz/finish`

## Regra de negocio

- cada recomendacao pode trazer `sensitiveContent`
- quando `true`, o frontend deve exibir aviso antes de abrir detalhes, preview ou acao equivalente

## Frontend

Fluxo recomendado:

1. ao renderizar recomendacoes, checar `sensitiveContent`
2. se `true`, mostrar tag visual no card
3. antes de abrir detalhe/preview, pedir confirmacao do usuario

## Checklist

- tag visivel no card
- modal ou confirmacao antes de abrir item sensivel
- opcao de cancelar
