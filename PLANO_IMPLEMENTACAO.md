# Plano de Implementação — Observabilidade-Lab / Ecommerce Simulado

## Objetivo
Aprimorar a aplicação para reproduzir comportamentos reais de uma plataforma de ecommerce e elevar o nível de observabilidade (métricas, logs, tracing, alertas).

---

## Fase 1 — Catálogo de Produtos

### 1.1 Modelo de Produto
- Estrutura: `id`, `name`, `description`, `category`, `price`, `stock`, `image_url`, `created_at`
- Armazenamento em memória (array)
- Seed inicial com 20-50 produtos variados (categorias: eletrônicos, roupas, casa, livros, etc.)

### 1.2 Endpoints de Produto
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/products` | Listar produtos (filtros: `?category=&min_price=&max_price=&q=`) |
| GET | `/products/:id` | Detalhes do produto |
| POST | `/products` | Criar produto |
| PUT | `/products/:id` | Atualizar produto |
| DELETE | `/products/:id` | Deletar produto |

### 1.3 Métricas
- `app_products_total` (Gauge) — total de produtos cadastrados
- `app_products_by_category` (Gauge, label `category`) — produtos por categoria
- `app_product_views_total` (Counter, label `product_id`) — visualizações de produto

### 1.4 Logs
- Eventos: `product_created`, `product_updated`, `product_deleted`, `product_viewed`

---

## Fase 2 — Carrinho de Compras

### 2.1 Modelo de Carrinho
- Estrutura: `cartId`, `userId` (opcional), `items[]`, `createdAt`, `lastActivityAt`
- Carrinho identificado por header `x-cart-id` ou vinculado a usuário logado
- Timer de expiração: 30min de inatividade → abandono

### 2.2 Endpoints de Carrinho
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/cart/add` | Adicionar item (productId, quantity) |
| POST | `/cart/remove` | Remover item (productId) |
| PATCH | `/cart/item` | Atualizar quantity de um item |
| GET | `/cart` | Visualizar carrinho |
| DELETE | `/cart` | Limpar carrinho |

### 2.3 Métricas
- `app_cart_adds_total` (Counter) — total de adições ao carrinho
- `app_cart_removes_total` (Counter) — total de remoções
- `app_cart_abandonment_rate` (Gauge) — taxa de abandono (carrinhos criados vs convertidos)
- `app_carts_active` (Gauge) — carrinhos ativos no momento
- `app_cart_size` (Histogram) — distribuição de itens por carrinho

### 2.4 Logs
- Eventos: `cart_item_added`, `cart_item_removed`, `cart_abandoned`, `cart_converted`

---

## Fase 3 — Checkout e Pedidos

### 3.1 Modelo de Pedido
- Estrutura: `id`, `userId`, `items[]`, `total`, `status`, `paymentMethod`, `createdAt`, `updatedAt`
- Status: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

### 3.2 Endpoints de Pedido
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/checkout` | Finalizar compra (valida estoque → processa pagamento → cria pedido) |
| GET | `/orders` | Listar pedidos do usuário |
| GET | `/orders/:id` | Detalhes do pedido |
| POST | `/orders/:id/cancel` | Cancelar pedido |

### 3.3 Métricas
- `app_orders_total` (Counter, label `status`) — pedidos por status
- `app_order_value_bytes` (Histogram) — distribuição do valor dos pedidos
- `app_checkout_duration_seconds` (Histogram, label `status`) — duração do checkout
- `app_conversion_rate_percent` (Gauge) — taxa de conversão (pedidos / visitas)

### 3.4 Logs
- Eventos: `checkout_started`, `checkout_completed`, `checkout_failed`, `order_status_changed`, `order_cancelled`

---

## Fase 4 — Pagamento Simulado

### 4.1 Gateway de Pagamento
- Endpoint interno: `POST /payment/process`
- Meios de pagamento: `credit_card`, `pix`, `boleto`, `wallet`
- Latências simuladas por método:
  - PIX: 100-300ms
  - Cartão: 500-1500ms
  - Boleto: 0ms (assíncrono, gera URL)
  - Wallet: 200-600ms

### 4.2 Configuração de Falhas
- Parâmetros: `paymentFailureRate`, `paymentDelayMs`, `paymentTimeoutMs`
- Configurável via POST `/internal/incidents/payment`

### 4.3 Métricas
- `app_payment_attempts_total` (Counter, label `method`, `status`) — tentativas por método e resultado
- `app_payment_duration_seconds` (Histogram, label `method`) — latência do gateway por método
- `app_payment_incident_active` (Gauge) — incidente de pagamento ativo

### 4.4 Logs
- Eventos: `payment_pending`, `payment_confirmed`, `payment_failed`, `payment_timeout`

---

## Fase 5 — Estoque e Inventário

### 5.1 Controle de Estoque
- Integrado ao produto (`product.stock`)
- Decremento no checkout confirmado
- Verificação de disponibilidade antes de adicionar ao carrinho

### 5.2 Eventos de Estoque
- Log `inventory_low` quando stock < 5
- Log `inventory_out_of_stock` quando stock = 0
- Impedir adição ao carrinho se estoque insuficiente

### 5.3 Métricas
- `app_inventory_low_products` (Gauge) — produtos com estoque baixo
- `app_inventory_out_of_stock_products` (Gauge) — produtos sem estoque
- `app_inventory_incident_active` (Gauge) — incidente de estoque zerado

---

## Fase 6 — Logs Enriquecidos e Correlation ID

### 6.1 Correlation ID
- Middleware gera `x-correlation-id` (UUID v4) por requisição
- Repassa para todos os logs e métricas como label `correlation_id`
- Permite rastrear uma requisição inteira (adição ao carrinho → checkout → pagamento → pedido)

### 6.2 Estrutura de Log Padronizada
```json
{
  "level": "info",
  "event": "checkout_completed",
  "correlation_id": "abc-123",
  "user_id": 42,
  "order_id": 99,
  "total": 299.90,
  "payment_method": "credit_card",
  "duration_ms": 842.15,
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

### 6.3 Headers de Contexto
- `x-correlation-id` — id único da requisição
- `x-user-id` — usuário autenticado (quando aplicável)
- `x-cart-id` — identificador do carrinho

---

## Fase 7 — OpenTelemetry Tracing (Opcional / Futuro)

### 7.1 Dependências
- `@opentelemetry/sdk-node`
- `@opentelemetry/instrumentation-express`
- `@opentelemetry/instrumentation-http`
- `@opentelemetry/exporter-trace-otlp-http`

### 7.2 Spans por Operação
| Span Pai | Spans Filhos |
|----------|-------------|
| `POST /checkout` | `validate_stock`, `process_payment`, `create_order`, `clear_cart` |
| `POST /payment/process` | `charge_credit_card` / `process_pix` |
| `GET /products` | `query_database` |

### 7.3 Exportador
- OTLP via HTTP para endpoint configurável (Grafana Tempo, Jaeger, ou SigNoz)
- `trace_id` incluído em todos os logs para correlação métrica ↔ log ↔ trace

---

## Fase 8 — Novos Incidentes Simulados

| Incidente | Endpoint | Comportamento | Métrica |
|-----------|----------|--------------|---------|
| Pagamento Offline | `POST /internal/incidents/payment` | Gateway retorna 503 | `app_payment_incident_active` |
| Estoque Zerado | `POST /internal/incidents/inventory` | Todos produtos com stock = 0 | `app_inventory_incident_active` |
| Carrinho Lento | `POST /internal/incidents/cart-latency` | Adicionar ao carrinho leva 3s+ | `app_cart_latency_incident_active` |
| Promoção Inesperada | `POST /internal/incidents/promotion` | Preços com 90% de desconto | `app_promotion_incident_active` |

---

## Fase 9 — Tráfego Sintético Automático

### 9.1 Job Interno (setInterval)
- A cada 15-30s, executar ações simuladas:
  - Visitar página de produto aleatório
  - Adicionar 1-3 itens ao carrinho
  - 30% de chance de finalizar compra (checkout)
  - 70% de chance de abandonar carrinho
  - Ocasionalmente: falha de login, produto sem estoque

### 9.2 Benefícios
- Geração contínua de métricas e logs para o laboratório
- Simulação de padrões reais de navegação
- Dados para dashboards sem intervenção manual

---

## Fase 10 — Dashboards e Alertas

### 10.1 Novas Seções no Grafana
- **Negócio**: funnel de conversão, valor médio de pedido, receita simulada
- **Pagamentos**: taxa de sucesso por método, latência do gateway, fila de falhas
- **Estoque**: produtos críticos, reposição necessária
- **Carrinho**: abandono vs conversão, itens por carrinho

### 10.2 Alertas (AlertManager)
- `high_error_rate`: taxa de erro > 5% nos últimos 5 min
- `checkout_slow`: p99 do checkout > 3s
- `payment_failure_spike`: falha de pagamento > 10% no último minuto
- `inventory_critical`: produtos com estoque < 3
- `cart_abandonment_high`: taxa de abandono > 80%

---

## Fase 11 — Health Checks e Resiliência

### 11.1 Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health/live` | Liveness probe (sempre 200 se o processo está vivo) |
| GET | `/health/ready` | Readiness probe (verifica dependências mockadas) |

### 11.2 Benefícios
- Orquestração (K8s/Docker) pode monitorar saúde do serviço
- Métrica `app_health_status` (Gauge) exportada

---

## Resumo da Arquitetura Final

```
                                  +------------------+
                                  |   Grafana UI     |
                                  +--------+---------+
                                           |
              +----------------------------+----------------------------+
              |                            |                            |
      +-------v------+            +-------v-------+            +-------v-------+
      |  Prometheus  |            |  Loki         |            |   Tempo /     |
      |  (metrics)   |            |  (logs)       |            |   Jaeger      |
      +-------+------+            +-------+-------+            |   (traces)    |
              |                            |                    +-------+-------+
              +----------------------------+---------------------------+
                                           |
                                  +--------v---------+
                                  |   App Ecommerce   |
                                  |  +-------------+  |
                                  |  | Produtos    |  |
                                  |  | Carrinho    |  |
                                  |  | Checkout    |  |
                                  |  | Pagamento   |  |
                                  |  | Estoque     |  |
                                  |  | Incidents   |  |
                                  |  +-------------+  |
                                  +-------------------+
```

---

## Ordem de Implementação Recomendada

1. **Fase 1** — Produtos (base do ecommerce)
2. **Fase 2** — Carrinho (interação do usuário)
3. **Fase 6** — Correlation ID (base da observabilidade)
4. **Fase 4** — Pagamento (pré-requisito para checkout)
5. **Fase 5** — Estoque (pré-requisito para checkout)
6. **Fase 3** — Checkout e Pedidos (culminação do fluxo)
7. **Fase 8** — Incidentes simulados
8. **Fase 9** — Tráfego sintético
9. **Fase 10** — Dashboards e alertas
10. **Fase 11** — Health checks
11. **Fase 7** — OpenTelemetry (opcional)
