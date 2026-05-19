"""
Flask middleware for request logging, Request ID tracking, and rate limiting.

Responsabilidades:
1. Adiciona um ID único a cada requisição HTTP para rastreamento
2. Registra entrada/saída de requisições com método, caminho, status e duração
3. Implementa rate limiting por IP com janela deslizante de 60 segundos

O rate limiting usa uma "pilha" (lista) de timestamps para cada IP.
Quando uma nova requisição chega, remove todos os timestamps com mais de 60s
e verifica se o número de requisições na janela excede o limite configurado.
"""
import time
import uuid
from collections import defaultdict

from flask import Flask, g, request, jsonify
from logger import get_logger
from config import RATE_LIMIT_PER_MINUTE

logger = get_logger("http")

# Armazena o histórico de requisições por IP
# Estrutura: { "192.168.1.1": [timestamp1, timestamp2, ...], ... }
_request_history: dict[str, list[float]] = defaultdict(list)

# Janela de tempo em segundos para contar requisições
RATE_LIMIT_WINDOW_SECONDS = 60.0


def register_middleware(app: Flask):
    """
    Registra os middleware de antes/depois de requisição no Flask.
    
    - @before_request: valida rate limit, atribui Request ID, registra início
    - @after_request: calcula duração, registra fim, injeta headers
    """

    @app.before_request
    def _before():
        """
        Middleware executado ANTES de processar cada requisição.
        
        Responsabilidades:
        1. Verificar rate limit por IP (janela deslizante de 60s)
        2. Gerar e armazenar Request ID único
        3. Registrar timestamp de início da requisição
        4. Logar início da requisição
        """
        ip = request.remote_addr or "unknown"
        current_time = time.time()

        # ─── STEP 1: Limpar requisições antigas ───────────────────────────────
        # Remove todos os timestamps com mais de 60 segundos de idade
        # A pilha fica ordenada (timestamps antigos no início)
        _request_history[ip] = [
            timestamp for timestamp in _request_history[ip]
            if current_time - timestamp < RATE_LIMIT_WINDOW_SECONDS
        ]

        # ─── STEP 2: Verificar se excedeu o limite ────────────────────────────
        request_count = len(_request_history[ip])
        
        if request_count >= RATE_LIMIT_PER_MINUTE:
            # Requisição bloqueada por excesso de requisições
            oldest_request = _request_history[ip][0]
            wait_seconds = RATE_LIMIT_WINDOW_SECONDS - (current_time - oldest_request)
            
            logger.warning(
                f"⛔ Rate limit excedido para {ip}: {request_count}/{RATE_LIMIT_PER_MINUTE} req/min",
                extra={
                    "data": {
                        "event": "rate_limit_exceeded",
                        "ip": ip,
                        "current_requests": request_count,
                        "limit": RATE_LIMIT_PER_MINUTE,
                        "wait_seconds": round(wait_seconds, 2),
                    },
                },
            )
            
            return (
                jsonify({
                    "detail": f"Limite de requisições excedido. Máximo: {RATE_LIMIT_PER_MINUTE} por minuto.",
                    "retry_after": round(wait_seconds),
                }),
                429  # Too Many Requests
            )

        # ─── STEP 3: Registrar nova requisição na pilha ────────────────────────
        _request_history[ip].append(current_time)

        # ─── STEP 4: Gerar Request ID e registrar início ────────────────────────
        g.request_id = uuid.uuid4().hex[:8]
        g.request_start = time.perf_counter()
        
        logger.info(
            f"► {request.method} {request.path}",
            extra={
                "request_id": g.request_id,
                "data": {
                    "event": "request_start",
                    "request_id": g.request_id,
                    "method": request.method,
                    "path": request.path,
                    "remote_addr": ip,
                    "current_requests_on_window": request_count + 1,
                },
            },
        )

    @app.after_request
    def _after(response):
        """
        Middleware executado DEPOIS de processar a requisição.
        
        Responsabilidades:
        1. Calcular tempo total da requisição
        2. Registrar fim da requisição com status code
        3. Injetar Request ID nos headers da resposta
        """
        # ─── STEP 1: Garantir que os atributos globais estão definidos ───────
        # (proteção contra middleware que não executou antes ou contextos especiais)
        if not hasattr(g, 'request_start'):
            g.request_start = time.perf_counter()
        
        if not hasattr(g, 'request_id'):
            g.request_id = uuid.uuid4().hex[:8]

        # ─── STEP 2: Calcular duração em milissegundos ────────────────────────
        duration_ms = (time.perf_counter() - g.request_start) * 1000

        # ─── STEP 3: Logar fim da requisição ──────────────────────────────────
        logger.info(
            f"◄ {response.status_code} {request.method} {request.path} ({duration_ms:.0f}ms)",
            extra={
                "request_id": g.request_id,
                "data": {
                    "event": "request_end",
                    "request_id": g.request_id,
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                },
            },
        )

        # ─── STEP 4: Injetar Request ID nos headers da resposta ──────────────
        response.headers["X-Request-ID"] = g.request_id
        
        return response
