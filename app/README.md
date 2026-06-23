# Observability App

Aplicação Node.js para laboratório de observabilidade. Inclui CRUD de
usuários, autenticação simples, métricas Prometheus e simulações de
incidentes para uso em workshops ou testes.

## Rotas principais

- `POST /register` — cria um usuário em memória.
  - Body: `{ "username": "usuario", "password": "senha" }`
- `POST /login` — autentica por `username` e `password`.
  - Quando o incidente `login-failure` está ativo, retorna `500`.
- `GET /users` — lista usuários (não retorna senhas).
- `PUT /users/:id` — atualiza usuário (body opcional).
- `DELETE /users/:id` — remove usuário.
- `GET /metrics` — expõe métricas no formato Prometheus.

## Endpoints de incidentes / simulações

- `GET /simulate-load` — gera carga de CPU no servidor.
  - Query opcional: `iterations` (ex.: `?iterations=7000000`).
- `GET /simulate-error` — força uma exceção (erro 500) para testes.
- `POST /internal/incidents/login-failure` — ativa/desativa falha de
  login forçada.
  - Body opcional: `{ "enabled": true|false }`. Sem body, o endpoint
    alterna o estado atual.
- `POST /internal/incidents/latency` — ativa/desativa latência artificial
  e configura parâmetros de instabilidade.
  - Body exemplo: `{ "enabled": true, "delayMs": 1500, "jitterMs": 500,
    "failureRatePercent": 20, "statusCode": 503 }`.
- `POST /internal/incidents/reset` — restaura configuração padrão (desativa
  incidentes).

## Testando os erros simulados via Console do navegador

Abra o DevTools do navegador (F12) e use a aba Console para colar os
comandos abaixo. Substitua `http://localhost:3002` se o app estiver em
outra porta/host.

### 1) Simular carga de CPU (`/simulate-load`)

```javascript
fetch('http://localhost:3002/simulate-load?iterations=7000000')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

Observação: o pico de CPU ocorre no servidor. Use `docker stats`, Task
Manager ou Prometheus para observar o impacto.

### 2) Forçar erro (exceção) (`/simulate-error`)

```javascript
fetch('http://localhost:3002/simulate-error')
  .then(async res => {
    console.log('status', res.status);
    console.log(await res.text());
  })
  .catch(err => console.error('fetch error', err))
```

Resultado esperado: resposta com status 500 e registro do erro nos
logs do servidor (Loki/Grafana se configurado).

### 3) Habilitar/desabilitar falha de login

Habilitar explicitamente:

```javascript
fetch('http://localhost:3002/internal/incidents/login-failure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true })
}).then(r => r.json()).then(console.log)
```

Alternar (sem body):

```javascript
fetch('http://localhost:3002/internal/incidents/login-failure', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

Testar efeito no `/login` (após habilitar):

```javascript
fetch('http://localhost:3002/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'luca', password: '123' })
}).then(async res => {
  console.log('status', res.status);
  console.log(await res.text());
}).catch(console.error)
```

Quando `login-failure` estiver ativo, `/login` deve retornar `500`.

### 4) Habilitar latência e instabilidade (`/internal/incidents/latency`)

```javascript
fetch('http://localhost:3002/internal/incidents/latency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true, delayMs: 1500, jitterMs: 500,
    failureRatePercent: 20, statusCode: 503 })
}).then(r => r.json()).then(console.log)
```

Medir latência em uma chamada simples:
  
```javascript
const start = performance.now();
fetch('http://localhost:3002/users').then(async res => {
  console.log('status', res.status);
  console.log('ms', performance.now() - start);
  console.log(await res.text());
}).catch(console.error)
```

Com latência ativa, as respostas ficarão mais lentas e podem falhar com
o código configurado.

### 5) Resetar incidentes (`/internal/incidents/reset`)

```javascript
fetch('http://localhost:3002/internal/incidents/reset', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

Após o reset, os endpoints voltam ao comportamento normal.

## Exemplos rápidos com curl

Registrar usuário:

```bash
curl -X POST http://localhost:3002/register \
  -H "Content-Type: application/json" \
  -d '{"username":"luca","password":"123"}'
```

Login:

```bash
curl -X POST http://localhost:3002/login \
  -H "Content-Type: application/json" \
  -d '{"username":"luca","password":"123"}'
```

Listar usuários:

```bash
curl http://localhost:3002/users
```

## Rodando com Docker Compose

Suba toda a stack a partir da raiz do projeto:

```bash
docker compose up --build
```

Serviços expostos no host:

- App: http://localhost:3002
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Loki: http://localhost:3100
