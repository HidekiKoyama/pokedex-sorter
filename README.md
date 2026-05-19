# Pokédex Sort Visualizer

Visualizador interativo de **algoritmos de ordenação** e **estruturas de dados** (Pilha/Fila) temático usando os 151 Pokémon originais.  
Projeto desenvolvido para a disciplina de **Estruturas de Dados**.

**Backend**: Flask (Python) · **Frontend**: React · **API Externa**: PokéAPI

---

## Objetivo Acadêmico

Este projeto demonstra na prática o funcionamento de:

- **5 Algoritmos de Ordenação**: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort e Quick Sort
- **Estruturas de Dados**: Pilha (LIFO — Last In, First Out) e Fila (FIFO — First In, First Out)
- **Análise de Complexidade**: Comparação visual de operações (comparações, trocas, escritas) entre algoritmos
- **Múltiplos Critérios de Ordenação**: Pokédex, Alfabético, Tipo, Base Stats, Habitat

---

## Estrutura do Projeto

```
pokedex-sorter/
├── backend/
│   ├── app.py                  ← Entry point Flask
│   ├── config.py               ← Configurações centralizadas
│   ├── middleware.py            ← Rate limit + request logging
│   ├── logger.py               ← Sistema de logs estruturados
│   ├── requirements.txt
│   ├── data.json               ← Cache local dos 151 Pokémon
│   ├── algorithms/
│   │   └── sorting.py          ← 5 algoritmos + geração de steps
│   ├── routes/
│   │   ├── pokemon.py          ← GET/POST /api/pokemon/
│   │   └── sort.py             ← POST /api/sort/<algorithm>
│   ├── services/
│   │   └── pokemon_service.py  ← Cache + fetch da PokéAPI
│   └── logs/                   ← Logs gerados em runtime
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx             ← Componente principal
        ├── index.js
        ├── components/
        │   ├── BarChart.jsx          ← Visualização em barras
        │   ├── CardGrid.jsx          ← Visualização em cards
        │   ├── DetailsPoke.jsx       ← Modal de detalhes do Pokémon
        │   ├── StatsPanel.jsx        ← Painel de estatísticas
        │   ├── CompareModal.jsx      ← Comparação entre algoritmos
        │   └── StackQueueControls.jsx ← Controles LIFO/FIFO
        ├── hooks/
        │   ├── useSort.js      ← Lógica da animação de ordenação
        │   └── usePokemon.js   ← Carregamento dos dados
        ├── services/
        │   └── api.js          ← Chamadas HTTP ao backend
        └── utils/
            └── shuffle.js      ← Fisher-Yates shuffle
```

---

## Pré-requisitos

- **Python** 3.10+ 
- **Node.js** 18+ e **npm**
- Conexão com a internet (para PokéAPI no primeiro carregamento ou para consultar detalhes e imagens do pokemon)

---

## Como Rodar

### 1. Backend (Flask)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

O servidor sobe em **http://localhost:5000**

### Dependências do Backend

| Pacote       | Versão  | Uso                              |
|-------------|---------|----------------------------------|
| flask       | 3.0.3   | Framework web                    |
| flask-cors  | 4.0.1   | Cross-Origin Resource Sharing    |
| requests    | 2.32.3  | HTTP client para PokéAPI         |
| psutil      | 5.9.8   | Métricas de CPU/memória do processo |

---

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```

O app abre em **http://localhost:3000**

> O `"proxy": "http://localhost:5000"` no `package.json` redireciona `/api/*` automaticamente para o Flask.

### Dependências do Frontend

| Pacote           | Versão  | Uso                        |
|-----------------|---------|----------------------------|
| react           | ^18.3.1 | Biblioteca UI              |
| react-dom       | ^18.3.1 | Renderização DOM           |
| react-router    | ^7.15.1 | Roteamento                 |
| react-router-dom| ^7.15.1 | Roteamento DOM             |
| react-scripts   | ^5.0.1  | Tooling (CRA)              |

---

## Endpoints da API

### Pokémon

| Método | Rota                           | Descrição                                    |
|--------|--------------------------------|----------------------------------------------|
| POST   | `/api/pokemon/load`            | Dispara carregamento background dos 151 Pokémon |
| GET    | `/api/pokemon/progress`        | Retorna progresso do carregamento            |
| GET    | `/api/pokemon/`                | Retorna todos os 151 Pokémon                 |
| GET    | `/api/pokemon/<id_ou_nome>`    | Retorna detalhes de um Pokémon (via PokéAPI) |

### Ordenação

| Método | Rota                    | Body (JSON)                               | Descrição                              |
|--------|-------------------------|-------------------------------------------|----------------------------------------|
| GET    | `/api/sort/algorithms`  | —                                         | Lista algoritmos + complexidades       |
| POST   | `/api/sort/bubble`      | `{ "array": [...], "sort_by": "id" }`     | Gera steps do Bubble Sort              |
| POST   | `/api/sort/selection`   | `{ "array": [...], "sort_by": "id" }`     | Gera steps do Selection Sort           |
| POST   | `/api/sort/insertion`   | `{ "array": [...], "sort_by": "id" }`     | Gera steps do Insertion Sort           |
| POST   | `/api/sort/merge`       | `{ "array": [...], "sort_by": "id" }`     | Gera steps do Merge Sort               |
| POST   | `/api/sort/quick`       | `{ "array": [...], "sort_by": "id" }`     | Gera steps do Quick Sort               |
| POST   | `/api/sort/compare`     | `{ "array": [...], "sort_by": "id" }`     | Compara todos os 5 algoritmos          |

#### Valores válidos para `sort_by`

| Valor              | Descrição                |
|--------------------|--------------------------|
| `id`               | Número da Pokédex (#)    |
| `name`             | Nome alfabético (A-Z)    |
| `type_primary`     | Tipo primário            |
| `base_stats_total` | Total de base stats      |
| `habitat`          | Habitat do Pokémon       |

---

### Exemplo de Request para `/api/sort/bubble`

```json
POST /api/sort/bubble
Content-Type: application/json

{
  "array": [
    { "id": 25, "name": "pikachu", "img": "https://...", "type_primary": "electric", "type_secondary": null, "base_stats_total": 320, "hp": 35, "attack": 55, "defense": 40, "sp_attack": 50, "sp_defense": 50, "speed": 90, "height": 4, "weight": 60, "habitat": "forest" },
    { "id": 1,  "name": "bulbasaur", "img": "https://...", "type_primary": "grass", "type_secondary": "poison", "base_stats_total": 318, "hp": 45, "attack": 49, "defense": 49, "sp_attack": 65, "sp_defense": 65, "speed": 45, "height": 7, "weight": 69, "habitat": "grassland" }
  ],
  "sort_by": "id"
}
```

### Exemplo de Response

```json
{
  "algorithm": "bubble",
  "sort_key": "id",
  "complexity": {
    "name": "Bubble Sort",
    "best": "O(n)",
    "average": "O(n²)",
    "worst": "O(n²)",
    "space": "O(1)"
  },
  "total_steps": 11325,
  "steps": [
    { "type": "compare",  "indices": [0, 1] },
    { "type": "swap",     "indices": [0, 1] },
    { "type": "sorted",   "index": 150 }
  ],
  "stats": {
    "compares": 11175,
    "swaps": 3742,
    "writes": 0,
    "total": 14917,
    "n": 151
  }
}
```

---

## Tipos de Steps (animação)

| Tipo        | Campos                        | Descrição                     | Usado por       |
|-------------|-------------------------------|-------------------------------|-----------------|
| `compare`   | `indices: [i, j]`             | Elementos sendo comparados    | Todos           |
| `swap`      | `indices: [i, j]`             | Elementos sendo trocados      | Bubble, Selection, Insertion, Quick |
| `overwrite` | `index: i, value: {...}`      | Sobrescrita de posição        | Merge Sort      |
| `pivot`     | `index: i`                    | Elemento pivot                | Quick Sort      |
| `sorted`    | `index: i`                    | Elemento na posição final     | Todos           |

---

## Estrutura de Dados de um Pokémon

Cada Pokémon no array segue este formato:

```json
{
  "id": 25,
  "name": "pikachu",
  "img": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  "type_primary": "electric",
  "type_secondary": null,
  "base_stats_total": 320,
  "hp": 35,
  "attack": 55,
  "defense": 40,
  "sp_attack": 50,
  "sp_defense": 50,
  "speed": 90,
  "height": 4,
  "weight": 60,
  "habitat": "forest"
}
```

---

## Algoritmos Implementados

| Algoritmo       | Melhor Caso   | Caso Médio    | Pior Caso     | Espaço    | Estável? |
|----------------|--------------|---------------|---------------|-----------|----------|
| Bubble Sort    | O(n)         | O(n²)         | O(n²)         | O(1)      | Sim      |
| Selection Sort | O(n²)        | O(n²)         | O(n²)         | O(1)      | Não      |
| Insertion Sort | O(n)         | O(n²)         | O(n²)         | O(1)      | Sim      |
| Merge Sort     | O(n log n)   | O(n log n)    | O(n log n)    | O(n)      | Sim      |
| Quick Sort     | O(n log n)   | O(n log n)    | O(n²)         | O(log n)  | Não      |

---

## Estruturas de Dados — Pilha e Fila

O projeto inclui uma demonstração interativa de **Pilha (Stack)** e **Fila (Queue)** aplicada ao array de Pokémon:

### Pilha — LIFO (Last In, First Out)
- **Analogia**: Como uma pilha de pratos — o último colocado é o primeiro retirado
- **Operação `push`**: Adiciona um Pokémon aleatório no **final** do array
- **Operação `pop`**: Remove o **último** elemento do array (topo da pilha)

### Fila — FIFO (First In, First Out)
- **Analogia**: Como uma fila de banco — o primeiro a chegar é o primeiro atendido
- **Operação `enqueue`**: Adiciona um Pokémon aleatório no **final** do array
- **Operação `dequeue`**: Remove o **primeiro** elemento do array (frente da fila)

O componente `StackQueueControls` mantém um histórico visual de todas as operações realizadas, mostrando qual Pokémon foi adicionado/removido, em qual posição, e o tamanho resultante do array.

---

## Funcionalidades

### Ordenação
- ✅ 5 algoritmos de ordenação com geração de steps animados
- ✅ **Múltiplos Critérios**: Ordene por Pokédex (#), Alfabético (A-Z), Tipo Primário, Base Stats ou Habitat
- ✅ **Controle de Quantidade**: Escolha via slider ou input de texto quantos Pokémon (10–151) ordenar
- ✅ Animação controlável (play/pause/reset/shuffle)
- ✅ Slider de velocidade (5ms–300ms)
- ✅ Contadores em tempo real (comparações, trocas, escritas, tempo)
- ✅ Complexidade teórica exibida por algoritmo
- ✅ Comparação de todos os algoritmos lado a lado com barras proporcionais

### Estruturas de Dados
- ✅ **Pilha (LIFO)**: Operações push/pop sobre o array de Pokémon
- ✅ **Fila (FIFO)**: Operações enqueue/dequeue sobre o array de Pokémon
- ✅ Histórico de operações com timestamp
- ✅ Diagrama visual da estrutura com marcadores de frente (FIFO) e topo (LIFO)

### Visualização
- ✅ **3 modos de visualização**: Barras, Cards e Detalhes
- ✅ Cores por estado: Normal, Comparando, Trocando, Pivot, Ordenado
- ✅ Clique em card para ver detalhes completos (modal reutilizável)
- ✅ Busca de detalhes de qualquer Pokémon por ID ou nome (via PokéAPI)

### Infraestrutura
- ✅ Feedback sonoro via Web Audio API
- ✅ Cache dos dados da PokéAPI no backend (`data.json`)
- ✅ **Rate Limit**: Middleware Flask para controle de requisições por IP (100 req/min)
- ✅ Sistema de logs estruturados (JSON) com rotação de arquivos
- ✅ Métricas de CPU/memória por requisição

---

## Variáveis de Ambiente (opcionais)

| Variável              | Padrão                                  | Descrição                       |
|-----------------------|-----------------------------------------|---------------------------------|
| `FLASK_HOST`          | `0.0.0.0`                               | Host do servidor                |
| `FLASK_PORT`          | `5000`                                  | Porta do servidor               |
| `FLASK_DEBUG`         | `true`                                  | Modo debug                      |
| `LOG_LEVEL`           | `INFO`                                  | Nível de log (DEBUG/INFO/etc.)  |
| `LOG_MAX_BYTES`       | `5242880` (5 MB)                        | Tamanho máximo do arquivo de log|
| `LOG_BACKUP_COUNT`    | `5`                                     | Quantidade de backups de log    |
| `POKEAPI_BASE`        | `https://pokeapi.co/api/v2/pokemon`     | URL base da PokéAPI             |
| `POKEAPI_TIMEOUT`     | `10`                                    | Timeout em segundos por request |
| `RATE_LIMIT_PER_MINUTE`| `100`                                  | Limite de requisições por IP/min|
