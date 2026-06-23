# Progresso da Implementação

> Última atualização: 22/06/2026

## Legenda
- ✅ Completado
- 🔄 Em andamento
- ⏳ Pendente
- ❌ Bloqueado

---

## Fase 1 — Catálogo de Produtos
| Item | Status | Notas |
|------|--------|-------|
| Modelo de produto | ✅ | |
| Seed de produtos | ✅ | 25 produtos em 5 categorias |
| GET /products | ✅ | Filtros: ?category=&min_price=&max_price=&q= |
| GET /products/:id | ✅ | |
| POST /products | ✅ | |
| PUT /products/:id | ✅ | |
| DELETE /products/:id | ✅ | |
| Métricas de produto | ✅ | app_products_total, app_products_by_category, app_product_views_total |
| Logs de produto | ✅ | product_created, product_updated, product_deleted, product_viewed, products_listed |

## Fase 2 — Carrinho de Compras
| Item | Status | Notas |
|------|--------|-------|
| Modelo de carrinho | ✅ | Map<cartId, cart> com items, userId, timestamps |
| POST /cart/add | ✅ | Valida estoque, respeita incidente de promoção |
| POST /cart/remove | ✅ | Suporte a remoção parcial |
| PATCH /cart/item | ✅ | Atualiza quantidade; qty=0 remove |
| GET /cart | ✅ | |
| DELETE /cart | ✅ | |
| Timer de expiração | ✅ | 30min de inatividade → abandono |
| Métricas de carrinho | ✅ | app_cart_adds_total, app_cart_removes_total, app_carts_active, app_cart_abandonment_rate, app_cart_size |
| Logs de carrinho | ✅ | cart_item_added, cart_item_removed, cart_item_updated, cart_abandoned, cart_cleared |

## Fase 3 — Checkout e Pedidos
| Item | Status | Notas |
|------|--------|-------|
| Modelo de pedido | ✅ | id, userId, items, total, status, paymentMethod, timestamps |
| POST /checkout | ✅ | Valida estoque → processa pagamento → decrementa → cria pedido |
| GET /orders | ✅ | Filtro por userId via x-user-id |
| GET /orders/:id | ✅ | |
| POST /orders/:id/cancel | ✅ | Restaura estoque |
| Métricas de pedido | ✅ | app_orders_total, app_order_value_bytes, app_checkout_duration_seconds, app_conversion_rate_percent |
| Logs de pedido | ✅ | checkout_started, checkout_completed, checkout_failed, order_cancelled |

## Fase 4 — Pagamento Simulado
| Item | Status | Notas |
|------|--------|-------|
| Gateway mock (POST /payment/process) | ✅ | Endpoint independente + integrado ao checkout |
| Meios de pagamento | ✅ | credit_card, pix, boleto, wallet |
| Latências por método | ✅ | PIX: 200ms, Cartão: 1000ms, Boleto: 50ms, Wallet: 400ms |
| Configuração de falha | ✅ | paymentFailureRate, paymentDelayMs configuráveis |
| Métricas de pagamento | ✅ | app_payment_attempts_total, app_payment_duration_seconds |
| Logs de pagamento | ✅ | payment_pending, payment_confirmed, payment_failed |

## Fase 5 — Estoque e Inventário
| Item | Status | Notas |
|------|--------|-------|
| Controle de estoque integrado ao produto | ✅ | Decremento no checkout |
| Evento de estoque baixo (stock < 5) | ✅ | Log `inventory_low` |
| Bloqueio de venda sem estoque | ✅ | No carrinho e no checkout |
| Métricas de inventário | ✅ | app_inventory_low_products, app_inventory_out_of_stock_products |
| Logs de inventário | ✅ | inventory_low, inventory_out_of_stock |

## Fase 6 — Logs Enriquecidos e Correlation ID
| Item | Status | Notas |
|------|--------|-------|
| Middleware de correlation_id (UUID v4) | ✅ | Gera ou propaga x-correlation-id |
| Correlation ID em todos os logs | ✅ | Presente nos logs de request_completed, erros, carrinho, checkout, pagamento |
| Headers de contexto (x-user-id, x-cart-id) | ✅ | Extraídos no middleware |
| Padronização de estrutura de log | ✅ | Todos os logs incluem correlation_id |

## Fase 7 — OpenTelemetry Tracing
| Item | Status | Notas |
|------|--------|-------|
| Dependências OTEL | ⏳ | Opcional — pendenciado para versão futura |
| Instrumentação Express/HTTP | ⏳ | |
| Spans por operação | ⏳ | |
| Exportador OTLP | ⏳ | |
| trace_id nos logs | ⏳ | |

## Fase 8 — Incidentes Simulados
| Item | Status | Notas |
|------|--------|-------|
| Pagamento offline | ✅ | POST /internal/incidents/payment |
| Estoque zerado | ✅ | POST /internal/incidents/inventory |
| Carrinho lento | ✅ | POST /internal/incidents/cart-latency |
| Promoção inesperada | ✅ | POST /internal/incidents/promotion (90% off) |
| Métricas de incidentes | ✅ | app_payment_incident_active, app_inventory_incident_active, app_cart_latency_incident_active |
| Reset de incidentes | ✅ | POST /internal/incidents/reset (inclui novos incidentes) |

## Fase 9 — Tráfego Sintético
| Item | Status | Notas |
|------|--------|-------|
| Job de visitação de produtos | ✅ | A cada 15s, visita 1-5 produtos |
| Simulação de abandono de carrinho (70%) | ✅ | 70% dos carrinhos não finalizam |
| Simulação de checkout (30%) | ✅ | 30% dos carrinhos viram pedidos |
| Falhas ocasionais | ✅ | 5% de login failures simulados |
| Métricas de conversão | ✅ | app_conversion_rate_percent atualizada |

## Fase 10 — Dashboards e Alertas
| Item | Status | Notas |
|------|--------|-------|
| Seção "Negócio (Ecommerce)" no dashboard | ✅ | 5 novos painéis (conversão, pedidos, pagamentos, estoque, carrinhos) |
| Painel "Status dos Incidentes" atualizado | ✅ | Agora inclui pagamento, estoque e carrinho |
| Regras de alerta (AlertManager) | ⏳ | Pendenciado — requer arquivo rules.yml |
| Seção "Pagamentos" | ✅ | Panel-14 no dashboard |
| Seção "Estoque" | ✅ | Panel-15 no dashboard |
| Seção "Carrinho" | ✅ | Panel-16 no dashboard |

## Fase 11 — Health Checks
| Item | Status | Notas |
|------|--------|-------|
| GET /health/live | ✅ | Retorna status + uptime |
| GET /health/ready | ✅ | Retorna status (sempre ready por enquanto) |
| Bypass de latência | ✅ | Rotas /health/* excluídas do middleware de latência |
