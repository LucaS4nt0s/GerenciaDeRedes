# Observability App

Aplicacao Node.js com CRUD de usuarios, autenticacao simples, metricas Prometheus e simulacao de incidentes para laboratorio de observabilidade.

## Rotas Disponiveis

### Rotas funcionais (CRUD e login)

1. `POST /register`
- Cria um novo usuario em memoria.
- Body esperado: `{ "username": "usuario", "password": "senha" }`
- Respostas comuns:
- `201` usuario criado
- `400` campos obrigatorios ausentes
- `409` usuario ja existe

2. `POST /login`
- Realiza autenticacao simples por `username` e `password`.
- Body esperado: `{ "username": "usuario", "password": "senha" }`
- Respostas comuns:
- `200` autenticado
- `401` credenciais invalidas
- `500` quando incidente de falha forcada de login estiver ativo

3. `GET /users`
- Lista usuarios cadastrados (sem retornar senha).

4. `PUT /users/:id`
- Atualiza dados de um usuario pelo `id`.
- Body aceito: `{ "username": "novo", "password": "nova" }` (campos opcionais)

5. `DELETE /users/:id`
- Remove usuario pelo `id`.

### Rotas de observabilidade

6. `GET /metrics`
- Exibe metricas no formato Prometheus para coleta.
- Inclui metricas padrao do Node.js e metricas customizadas da aplicacao.

### Rotas de simulacao de incidentes

7. `GET /simulate-load`
- Executa carga de CPU para gerar pico de uso.
- Query opcional: `iterations` (exemplo: `/simulate-load?iterations=7000000`).

8. `GET /simulate-error`
- Forca uma excecao para testar logs de erro e tratamento global.

9. `POST /internal/incidents/login-failure`
- Liga/desliga falha forcada no login.
- Body opcional: `{ "enabled": true|false }`
- Sem body, alterna automaticamente o estado atual.

10. `POST /internal/incidents/latency`
- Liga/desliga latencia artificial e configura parametros de instabilidade.
- Body opcional:
- `{ "enabled": true|false, "delayMs": 1500, "jitterMs": 500, "failureRatePercent": 20, "statusCode": 503 }`

11. `POST /internal/incidents/reset`
- Restaura configuracao padrao dos incidentes (desativa falha de login e latencia).

## Exemplo rapido com curl

1. Registrar usuario:

```bash
curl -X POST http://localhost:3002/register \
	-H "Content-Type: application/json" \
	-d '{"username":"luca","password":"123"}'
```

2. Login:

```bash
curl -X POST http://localhost:3002/login \
	-H "Content-Type: application/json" \
	-d '{"username":"luca","password":"123"}'
```

3. Listar usuarios:

```bash
curl http://localhost:3002/users
```

## Rodando com Docker Compose

Suba toda a stack a partir da raiz do projeto:

```bash
docker compose up --build
```

Servicos expostos no host:

- App: `http://localhost:3002`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`

Dentro da rede do Compose, o Prometheus coleta o app em `app:3000/metrics`.

