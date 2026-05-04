# Open Finance API

Backend Node + Express + TypeScript que serve o app mobile [open-finance-app](https://github.com/IuriPires/open-finance-app), fazendo a ponte com a API da [Pluggy](https://www.pluggy.ai) (Open Finance Brasil) em ambiente sandbox.

Encapsula `CLIENT_ID`/`CLIENT_SECRET` (que **não podem** ficar no app mobile) e expõe endpoints REST simples pro client.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node 20+ |
| Framework | Express 4 |
| SDK | `pluggy-sdk` 0.85.x |
| Linguagem | TypeScript (ESM, NodeNext) |
| Dev runner | `tsx watch` (hot reload) |

## Pré-requisitos

- Node 20+
- Conta na Pluggy + `CLIENT_ID` e `CLIENT_SECRET` gerados em [dashboard.pluggy.ai](https://dashboard.pluggy.ai)

## Setup

```bash
# 1. Instala
npm install

# 2. Configura credenciais
cp .env.example .env
# edite .env com seus PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET

# 3. Roda em dev (com hot reload via tsx watch)
npm run dev
```

API sobe em `http://localhost:3000`. Verifica:

```bash
curl http://localhost:3000/health
# {"ok":true,"ts":...}
```

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|---|---|---|
| `PLUGGY_CLIENT_ID` | sim | ID da aplicação Pluggy (UUID) |
| `PLUGGY_CLIENT_SECRET` | sim | Secret da aplicação Pluggy (UUID) — **nunca commitar** |
| `PORT` | não | Porta HTTP (default 3000) |

## Endpoints

### Connect Token

```http
POST /api/connect-token
```

Cria um token de 30 minutos pra ser consumido pelo widget `<PluggyConnect>` no mobile.

**Resposta:**
```json
{ "accessToken": "eyJhbGciOi..." }
```

### Items

```http
POST /api/items                  body: { "itemId": "uuid" }
GET  /api/items
GET  /api/items/:id/snapshot
```

`POST /items` registra um item recém-conectado pelo widget no store in-memory (validando antes via `fetchItem`).
`GET /items` lista os items registrados com `connector`, `accountsCount`, `totalBalance`, `totalInvested`.
`GET /items/:id/snapshot` retorna `{ state: 'ready' | 'syncing' | 'error', item, accounts: [{ account, transactions }] }`.

### Identity

```http
GET /api/items/:id/identity
```

Retorna `{ fullName, document (CPF formatado), birthDate, jobTitle, emails, phones, addresses }`.

### Investments

```http
GET /api/items/:id/investments
```

Retorna `{ investments: [...], totals: { balance, profit, count } }`. Cada investment traz `name`, `type`, `subtype`, `balance`, `amountProfit`, `issuer`, `annualRate`, `lastTwelveMonthsRate`, `dueDate`, etc.

### Insights

```http
GET /api/items/:id/insights?month=YYYY-MM
```

Default = mês atual. Agrega gastos (transações com `amount < 0`) por prefixo de categoria do mês solicitado **e** do mês anterior, devolvendo delta % por categoria.

```json
{
  "month": "2026-05",
  "previousMonth": "2026-04",
  "totalSpent": 1234.56,
  "previousTotalSpent": 980.00,
  "categories": [
    { "prefix": "11", "total": 450, "count": 12, "previousTotal": 320, "deltaPct": 40.6 }
  ]
}
```

### Accounts

```http
GET /api/accounts/:id
```

Retorna `{ account, transactions }` para uma conta específica. Útil pra tela de detalhe (ex: cartão de crédito com `creditData`).

### Payments

```http
POST /api/payments                       body: { "amount": 1.0, "description": "..." }
GET  /api/payments/:requestId/intent
```

`POST /payments` cria um `PaymentRequest` com `isSandbox: true` e devolve `paymentRequestId` + `paymentUrl` (página hospedada da Pluggy onde o usuário escolhe banco-pagador).
`GET /payments/:requestId/intent` busca o `PaymentIntent` associado ao request (faz scan dos 50 mais recentes; em produção use webhook).

## Exemplos curl

```bash
# 1. Cria connect token
curl -X POST http://localhost:3000/api/connect-token | jq

# 2. Lista items conectados
curl http://localhost:3000/api/items | jq

# 3. Snapshot de um item
curl http://localhost:3000/api/items/4c4d9abf-.../snapshot | jq

# 4. Identidade do titular
curl http://localhost:3000/api/items/4c4d9abf-.../identity | jq

# 5. Insights do mês
curl "http://localhost:3000/api/items/4c4d9abf-.../insights?month=2026-05" | jq

# 6. Cria pagamento sandbox de R$ 1
curl -X POST http://localhost:3000/api/payments \
  -H 'content-type: application/json' \
  -d '{"amount":1,"description":"Teste"}' | jq
```

## Estrutura

```
src/
├── index.ts                # Express bootstrap, middleware, request logger
├── pluggy-client.ts        # Singleton do PluggyClient (lê .env)
├── lib/
│   ├── store.ts            # Map<clientUserId, Set<itemId>> in-memory
│   ├── snapshot.ts         # loadItemSnapshot() + loadItemSummary()
│   └── poll-item.ts        # Helper de polling (não usado atualmente — polling agora é client-side)
└── routes/
    ├── connect.ts          # /api/connect-token
    ├── items.ts            # /api/items*
    ├── accounts.ts         # /api/accounts/:id
    ├── identity.ts         # /api/items/:id/identity
    ├── investments.ts      # /api/items/:id/investments
    ├── insights.ts         # /api/items/:id/insights
    └── payments.ts         # /api/payments*
```

## Decisões de design

- **In-memory store** — `Map<userId, Set<itemId>>`. Reiniciar o backend zera os items conectados. Pra produção, troca por Postgres/Redis.
- **`clientUserId` fixo** — todo request usa `pluggy-poc-demo-user`. Em produção, vem do JWT do usuário autenticado.
- **Polling client-side** — o snapshot retorna imediatamente o estado atual; o mobile re-chama via TanStack Query `refetchInterval`. Em produção, troca por webhook (`item/updated`) com endpoint público.
- **CORS aberto** — `cors()` sem restrições. Pra produção, restringe pelo domínio do mobile/web.
- **Sem testes** — POC.

## Status do Item (Pluggy)

A Pluggy tem **dois** campos de status na entidade Item:
- `item.status` (ItemStatus): `UPDATED`, `UPDATING`, `WAITING_USER_INPUT`, `WAITING_USER_ACTION`, `MERGING`, `LOGIN_ERROR`, `OUTDATED`
- `item.executionStatus` (ExecutionStatus): `SUCCESS`, `PARTIAL_SUCCESS`, `LOGIN_IN_PROGRESS`, `ERROR`, etc.

O snapshot considera **`UPDATED`** como pronto pra ler dados.

## Sandbox

Credenciais de teste no widget:

| Campo | Valor |
|---|---|
| Usuário | `user-ok` |
| Senha | `password-ok` |
| MFA | `123456` |
| CPF | `761.092.776-73` |

Use connectors com tag **Sandbox** (ex: "Pluggy Bank"). PaymentRequest é sempre criado com `isSandbox: true` por enquanto.

## Produção

Para sair do sandbox e usar Open Finance regulado real (Itaú, Bradesco, BB, etc.) ou iniciar pagamentos reais, é necessário:

1. **Homologação Banco Central do Brasil** para iniciação de pagamento (ITP)
2. Aprovar a aplicação no painel da Pluggy
3. Implementar webhooks com endpoint HTTPS público
4. Substituir store in-memory por banco persistente
5. Adicionar autenticação real e mapear `clientUserId` ao usuário do produto
6. Restringir CORS

## Licença

POC interna — sem licença pública.
