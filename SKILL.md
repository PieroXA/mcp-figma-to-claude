# SKILL: Figma MCP — Diseño de pantallas optimizado

## Cuándo usar este skill
Siempre que el usuario pida diseñar pantallas, wireframes, UI components o cualquier cosa en Figma usando el MCP.

---

## REGLA #1 — SIEMPRE usa `batch_execute`

**NUNCA hagas una tool call por elemento.** Una pantalla típica con 20 nodos = 20 tool calls = ~16,000 tokens desperdiciados.

**SIEMPRE agrupa todo en UNO o pocos `batch_execute`.**

### Ratio de ahorro

| Enfoque | Pantalla de 20 nodos | Tokens aprox |
|---------|---------------------|--------------|
| ❌ Individual (1 nodo/call) | 20 tool calls | ~16,000 |
| ✅ batch_execute | 1 tool call | ~800 |
| Ahorro | — | **95%** |

---

## REGLA #2 — Usa los composite tools primero

Antes de `batch_execute`, usa los helpers de alto nivel que hacen múltiples nodos en una sola llamada:

| Tool | Lo que crea | Nodos en 1 call |
|------|-------------|-----------------|
| `create_mobile_screen` | Frame 390×844 + status bar + nav bar + content area | 4+ |
| `create_input_field` | Label + input bg + placeholder | 3 |
| `create_button` | Rect bg + label text | 2 |
| `create_card` | Frame con shadow | 1 (pero configurado completo) |

### Flujo estándar para una pantalla

```
1. create_mobile_screen → obtener frameId, contentAreaId
2. batch_execute con TODOS los elementos restantes usando contentAreaId como parentId
```

---

## REGLA #3 — Referencias `$N` en batch_execute

Cuando un comando necesita el ID de un nodo creado anteriormente en el mismo batch, usa `"$N"` donde N es el índice (0-based) del comando que lo creó.

```json
{
  "commands": [
    { "action": "create_frame",
      "params": { "name": "Card", "width": 358, "height": 120, "parentId": "91:5", "color": {"r":1,"g":1,"b":1} }
    },
    { "action": "create_text",
      "params": { "content": "Título", "parentId": "$0", "x": 16, "y": 16, "fontSize": 18, "fontStyle": "Bold", "color": {"r":0.059,"g":0.090,"b":0.165} }
    },
    { "action": "set_effects",
      "params": { "nodeId": "$0", "effects": [{"type":"DROP_SHADOW","color":{"r":0,"g":0,"b":0,"a":0.08},"offset":{"x":0,"y":2},"radius":12,"spread":0,"visible":true}] }
    }
  ]
}
```

- `"$0"` → ID del frame (comando 0)
- `"$1"` → ID del texto (comando 1)
- Las referencias se resuelven en el plugin antes de ejecutar cada comando.

---

## REGLA #4 — Design tokens (usar siempre estos valores)

```
PRIMARY BLUE   r:0.102  g:0.337  b:0.859   #1A56DB
BG LIGHT       r:0.973  g:0.980  b:0.992   #F8FAFC
WHITE          r:1      g:1      b:1        #FFFFFF
TEXT DARK      r:0.059  g:0.090  b:0.165   #0F172A
TEXT GRAY      r:0.392  g:0.455  b:0.545   #64748B
TEXT MUTED     r:0.580  g:0.639  b:0.722   #94A3B8
BORDER         r:0.886  g:0.910  b:0.941   #E2E8F0
INPUT BG       r:0.949  g:0.961  b:0.976   #F1F5F9
SUCCESS        r:0.063  g:0.725  b:0.506   #10B981
DANGER         r:0.937  g:0.267  b:0.267   #EF4444
WARNING        r:0.961  g:0.620  b:0.043   #F59E0B
CONDUCTOR      r:0.388  g:0.400  b:0.945   #6366F1
ADMIN          r:0.851  g:0.467  b:0.024   #D97706
SHADOW         r:0      g:0      b:0   a:0.08
```

---

## REGLA #5 — Tipografía

**SOLO Inter está garantizada.** Nunca uses otra fuente sin verificar primero.

| Uso | fontSize | fontStyle |
|-----|----------|-----------|
| Título grande (H1) | 26 | Bold |
| Título (H2) | 22 | Bold |
| Subtítulo (H3) | 18 | Bold |
| Label | 13 | Medium → usar Regular si Medium falla |
| Body | 15 | Regular |
| Caption | 12 | Regular |
| Botón | 16 | Bold |

**Si `Medium` falla:** usar `Regular`. Si `SemiBold` falla: usar `Bold`. No reintentar fuentes que fallaron.

---

## REGLA #6 — Layout móvil (390×844)

```
Y=0    ┌─────────────────────┐
       │   Status Bar (44)   │  ← BG: headerColor
Y=44   ├─────────────────────┤
       │    Nav Bar (52)     │  ← Solo si hay headerTitle
Y=96   ├─────────────────────┤
       │                     │
       │   Content Area      │  ← parentId para todo el contenido
       │   (748 o 800 px)    │
       │                     │
Y=780  ├─────────────────────┤
       │  Bottom Nav (64)    │  ← Solo si aplica
Y=844  └─────────────────────┘

Márgenes horizontales: x=16 (cards) o x=32 (inputs/text)
Ancho inputs/botones: 326px (= 390 - 32*2)
Ancho cards: 358px (= 390 - 16*2)
```

---

## REGLA #7 — Estructura de batch para pantallas completas

### Patrón estándar

```
PASO 1: create_mobile_screen
  → obtener contentAreaId

PASO 2: create_card (si hay tarjetas principales)
  → obtener cardId

PASO 3: batch_execute con TODOS los demás elementos
  - Textos
  - Inputs (o usar create_input_field antes del batch)
  - Botones (o usar create_button antes del batch)
  - Íconos (rectángulos/elipses pequeños como placeholders)
  - Separadores
  - Bottom nav
```

### Plantilla de batch_execute

```json
{
  "commands": [
    { "action": "create_rectangle", "params": { "name": "section-bg", "parentId": "CONTENT_ID", "x": 0, "y": 0, "width": 390, "height": 200, "color": {"r":1,"g":1,"b":1} } },
    { "action": "create_text",      "params": { "name": "title",      "parentId": "CONTENT_ID", "x": 32, "y": 24, "content": "Título", "fontSize": 26, "fontStyle": "Bold", "color": {"r":0.059,"g":0.090,"b":0.165} } },
    { "action": "create_text",      "params": { "name": "subtitle",   "parentId": "CONTENT_ID", "x": 32, "y": 60, "content": "Subtítulo", "fontSize": 15, "fontStyle": "Regular", "color": {"r":0.392,"g":0.455,"b":0.545} } },
    { "action": "create_rectangle", "params": { "name": "divider",    "parentId": "CONTENT_ID", "x": 16, "y": 100, "width": 358, "height": 1, "color": {"r":0.886,"g":0.910,"b":0.941} } }
  ]
}
```

---

## REGLA #8 — Íconos sin emojis

Los íconos se representan con formas geométricas simples. Nunca usar emojis.

| Concepto | Representación |
|----------|----------------|
| Bus / vehículo | Rectángulo 36×22 + 2 círculos (ruedas) |
| Usuario | Círculo 20px + rectángulo 24×12 (cuerpo) |
| Ubicación / pin | Círculo 20px + triángulo abajo (polígono sides=3) |
| Alerta | Triángulo sides=3 tamaño 20 |
| Tick / check | 2 rectángulos delgados rotados |
| Flecha atrás | Rectángulo delgado 14×2 + polygon sides=3 rotado |
| Mapa | Rectángulo 24×20 con grid lines |
| Búsqueda | Círculo 16px con borde + rectángulo delgado |
| Configuración | Círculo 20px + 6 polígonos sides=6 pequeños alrededor |
| Punto de estado | Círculo 8px con color del estado |

---

## REGLA #9 — Posicionamiento de screens en el canvas

Colocar pantallas horizontalmente con 80px de gap:

```
Pantalla 1: x=0
Pantalla 2: x=470   (390 + 80)
Pantalla 3: x=940
Pantalla 4: x=1410
...
```

---

## Ejemplo completo — Login screen en 3 tool calls

```
CALL 1: create_mobile_screen
  name="02 · Login", x=470, y=0, headerTitle=null

CALL 2: create_input_field × 2 (email y password)
  Se pueden hacer como 2 calls individuales

CALL 3: batch_execute con todo lo demás:
  - Título "Bienvenido de vuelta"
  - Subtítulo
  - Botón primary "Iniciar sesión"
  - Link "¿No tienes cuenta?"
  - Separador
  - "Cambiar universidad" link arriba
```

**Total: 4-5 tool calls** para una pantalla completa vs. 25+ con el enfoque individual.

---

## Checklist antes de diseñar

- [ ] ¿Hay un `create_mobile_screen` primero?
- [ ] ¿Estoy agrupando en `batch_execute`?
- [ ] ¿Uso los design tokens correctos (colores, tamaños)?
- [ ] ¿Los íconos son formas geométricas (no emojis)?
- [ ] ¿Los fondos de pantallas se posicionan en x=N*470?
- [ ] ¿Uso `$N` para referencias entre nodos del mismo batch?
- [ ] ¿Tipografía solo Inter, con fallback Regular si Medium/SemiBold falla?
