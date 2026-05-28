# Plan detallado para construir y fortalecer la aplicación del agente

## 1. Objetivo del plan

Construir y consolidar una aplicación de agente didáctico en español, basada en TypeScript + Node.js + LangChain + OpenRouter, que:

- responda con claridad en lenguaje natural,
- use herramientas locales (cálculo y hora actual) cuando aporte valor,
- pueda encadenar herramientas para combinar datos externos con cálculos,
- integre de forma incremental servicios de terceros vía HTTP (caso ejemplo: búsqueda de vuelos),
- mantenga una arquitectura entendible y extensible,
- y preserve calidad mediante pruebas, validación de entorno y documentación.

Este plan traduce el brief (`docs/brief-agent.md`) en pasos ejecutables para que cualquier integrante del equipo pueda continuar el trabajo de forma consistente.

---

## 2. Principios de ejecución

1. **Enfoque pedagógico primero:** priorizar claridad del flujo sobre complejidad técnica.
2. **Cambios pequeños y verificables:** cada avance debe poder ejecutarse, probarse y explicarse.
3. **Consistencia arquitectónica:** respetar separación de responsabilidades por capas.
4. **Documentar cada decisión relevante:** cambios en comportamiento, límites y configuración deben quedar explícitos.
5. **Evolución segura:** no romper ejecución por consola ni pruebas existentes.
6. **Herramientas HTTP acotadas:** cada integración devuelve texto plano resumido al agente; la lógica de red y el formateo JSON viven fuera del prompt.

---

## 3. Alcance funcional

### Incluye (MVP fortalecido — herramientas locales)

- Entrada de preguntas en lenguaje natural desde consola.
- Respuestas en español, claras y breves.
- Uso de herramienta de cálculo para operaciones simples.
- Uso de herramienta de hora actual cuando la consulta lo requiera.
- Manejo de solicitudes mixtas (cálculo + hora) cuando sea razonable.
- Validación estricta de configuración de OpenRouter antes de ejecutar.

### Incluye (evolución — integraciones HTTP)

- Cliente HTTP compartido (timeouts, errores, sin exponer secretos en logs).
- Validación de variables de entorno para la API elegida (además de OpenRouter).
- Herramientas que consultan APIs de terceros, procesan JSON y devuelven un resumen en texto plano.
- **Caso de estudio ejemplo:** búsqueda de vuelos en tiempo real; el agente puede combinar esa herramienta con la calculadora (por ejemplo, impuestos estimados y comparación con un presupuesto).
- Pruebas unitarias con datos de ejemplo y respuestas simuladas (sin llamadas reales obligatorias en CI).
- Documentación de configuración, límites y escenario de prueba manual con API real.

### No incluye (por ahora)

- Interfaz web o panel de administración.
- Orquestación multiagente.
- Reservas, pagos o persistencia de itinerarios.
- Pasar el JSON completo de la API al modelo cuando un resumen basta.
- Múltiples proveedores de la misma capacidad en paralelo (por ejemplo, dos APIs de vuelos a la vez).
- Herramientas complejas no justificadas por el objetivo educativo.

---

## 4. Plan por fases

### Fase 0: Alineación y línea base

**Objetivo:** asegurar que todo el equipo comparta contexto, límites y criterios de éxito.

**Actividades:**

- Revisar `docs/brief-agent.md` y confirmar entendimiento común.
- Levantar estado actual: qué ya funciona, qué es frágil y qué falta documentar.
- Definir una lista corta de escenarios de uso prioritarios (locales y, si aplica, el caso vuelos + presupuesto).

**Entregables:**

- Resumen de estado actual (fortalezas, límites, deuda inmediata).
- Lista de escenarios prioritarios para validar cambios.

**Criterio de salida:**

- El equipo entiende el mismo objetivo y evita cambios fuera de alcance.

---

### Fase 1: Consolidación de arquitectura y responsabilidades

**Objetivo:** mantener una estructura clara por capas para facilitar mantenimiento y extensión.

**Actividades:**

- Verificar que cada capa tenga una responsabilidad concreta:
  - entrada,
  - ejecución,
  - composición del agente,
  - herramientas (locales e integraciones HTTP),
  - configuración,
  - acceso HTTP compartido (cliente y utilidades de error).
- Reducir acoplamientos innecesarios entre módulos.
- Establecer reglas de extensión para nuevas herramientas (cómo se agregan sin romper el flujo).
- Documentar el contrato de una herramienta HTTP: schema de entrada, llamada al cliente, formateo a texto, registro en el agente y actualización del prompt.

**Entregables:**

- Arquitectura confirmada y coherente con el brief (`docs/architecture.md` actualizado si hace falta).
- Guía breve de “cómo extender el agente sin romperlo” (incluye herramientas locales y HTTP).

**Criterio de salida:**

- Cualquier persona puede ubicar rápidamente dónde modificar cada tipo de cambio.

---

### Fase 2: Robustez funcional del agente (herramientas locales)

**Objetivo:** asegurar respuestas útiles, en español, con uso de herramientas locales solo cuando corresponde.

**Actividades:**

- Revisar el comportamiento del prompt y la lógica de decisión de herramientas.
- Validar estos grupos de solicitudes:
  - matemáticas simples,
  - hora actual,
  - combinadas (cálculo + hora).
  - planeación de vuelos
  - combinadas (vuelos + cálculos)
  - combinadas (vuelos + cálculos + hora)
- Ajustar criterios de uso de herramientas para evitar invocaciones innecesarias.
- Definir mensajes de salida consistentes para mejorar experiencia didáctica.

**Entregables:**

- Comportamiento del agente estable en los escenarios principales locales.
- Respuestas con tono y formato consistentes en español.

**Criterio de salida:**

- El agente resuelve correctamente los casos esperados y explica de forma breve qué hizo.

---

### Fase 3: Gestión de configuración y fallos esperados

**Objetivo:** garantizar arranque seguro y mensajes claros ante configuración incompleta.

**Actividades:**

- Confirmar validación temprana de variables de entorno de OpenRouter.
- Extender la validación para credenciales y URLs de APIs externas cuando la herramienta HTTP esté habilitada.
- Mejorar claridad de errores cuando falte configuración crítica (modelo o API de vuelos).
- Documentar checklist mínimo de entorno para ejecutar localmente (incluye `env.local` de ejemplo sin secretos reales).

**Entregables:**

- Flujo de arranque con validaciones claras.
- Documentación de configuración mínima y fallos comunes.

**Criterio de salida:**

- Si falta configuración, el sistema falla de forma controlada y entendible.

---

### Fase 4: Pruebas y calidad operativa

**Objetivo:** proteger estabilidad del comportamiento actual y facilitar cambios futuros con confianza.

**Actividades:**

- Verificar cobertura de pruebas clave del flujo principal.
- Asegurar pruebas para:
  - cálculo,
  - hora,
  - ejecución del agente (con executor inyectable),
  - validaciones críticas de entorno.
- Para integraciones HTTP (en Fase 6 o en paralelo si ya existe código):
  - formateadores JSON → texto con fixtures,
  - herramienta con `fetch` simulado o cliente inyectable,
  - sin dependencia de red en `npm test`.
- Ejecutar validaciones de calidad (lint y pruebas) en cada cambio relevante.

**Entregables:**

- Suite de pruebas estable para casos prioritarios.
- Rutina mínima de calidad antes de aceptar cambios.
- Opcional: script o documento de prueba manual contra API real (fuera de CI).

**Criterio de salida:**

- Los cambios se aceptan solo si mantienen ejecución correcta y pruebas en verde.

---

### Fase 5: Documentación final y handoff (línea base local)

**Objetivo:** dejar el proyecto listo para continuidad por cualquier miembro del equipo en el alcance local.

**Actividades:**

- Actualizar README con guía de uso real y límites actuales.
- Sincronizar documentación técnica y funcional (brief + plan + arquitectura).
- Definir próximos pasos priorizados sin inflar alcance.

**Entregables:**

- Documentación coherente con lo implementado hasta herramientas locales.
- Hoja de ruta que enlace explícitamente con la Fase 6.

**Criterio de salida:**

- Una persona nueva puede ejecutar, entender y extender el agente (herramientas locales) en poco tiempo.

---

### Fase 6: Integraciones HTTP y caso de estudio (vuelos)

**Objetivo:** incorporar al menos una herramienta que consulte una API externa, resuma resultados en texto plano y permita encadenar con la calculadora.

**Dependencias:** Fases 1, 3 y 4 en grado suficiente (arquitectura, env y pruebas con mocks).

**Actividades (orden sugerido):**

1. **Infraestructura HTTP**
   - Implementar cliente compartido: timeout, manejo de errores HTTP, mensajes legibles para el agente.
   - Definir allowlist de hosts si aplica al proveedor elegido.

2. **Configuración**
   - Añadir variables de entorno de la API (base URL, clave, timeout opcional).
   - Documentar en README y archivo de ejemplo de entorno.

3. **Formateador**
   - Crear módulo que transforme la respuesta JSON en texto plano (top N ofertas: ruta, fecha, precio, moneda, aerolínea).
   - Pruebas unitarias con fixtures JSON guardados en el repositorio.

4. **Herramienta de dominio**
   - Implementar herramienta de búsqueda de vuelos (schema Zod, descripción en español).
   - Registrar en la composición del agente.
   - Actualizar prompt: cuándo usar búsqueda de vuelos, cuándo usar calculadora después, no inventar precios si la API falla, aclarar que los precios son orientativos.

5. **Validación end-to-end**
   - Escenario manual: *“¿Un viaje a Japón con presupuesto de 2000 USD es viable?”* (origen, fechas y supuestos documentados).
   - Verificar encadenamiento: herramienta de vuelos → calculadora (impuestos/total).

6. **Documentación**
   - Actualizar README, arquitectura y brief si el comportamiento real difiere del planificado.
   - Registrar límites del proveedor (cuotas, latencia, disclaimer al usuario).

**Entregables:**

- Cliente HTTP reutilizable.
- Herramienta `search_flights` (o nombre acordado) operativa en local con credenciales válidas.
- Pruebas en verde sin llamadas reales en CI.
- Prompt y documentación alineados con el brief.

**Criterio de salida:**

- Una persona nueva puede ejecutar, entender y extender el agente en 
poco tiempo.
- El agente responde en español a consultas de vuelos + presupuesto usando datos de la API (o mensaje claro de error) y la calculadora para totales.
- `npm test` y `npm run lint` pasan sin regresiones en el alcance trabajado.
- No se registran secretos ni JSON crudo innecesario en logs.

---

## 5. Cronograma sugerido (iterativo)

- **Semana 1:** Fase 0 + Fase 1
- **Semana 2:** Fase 2
- **Semana 3:** Fase 3 + Fase 4
- **Semana 4:** Fase 5 + cierre de pendientes locales
- **Semana 5–6:** Fase 6 (integraciones HTTP y caso vuelos), en iteraciones pequeñas (infra → formateador → tool → prompt → E2E manual)

> Si el equipo tiene menos disponibilidad, se puede ejecutar por bloques quincenales manteniendo el orden de dependencias. La Fase 6 no debe iniciarse sin criterios de salida de Fases 1 y 3 como mínimo.

---

## 6. Criterios de aceptación globales (Definition of Done operativa)

Se considera completado el **MVP local** cuando:

- El comportamiento del agente coincide con el propósito didáctico y responde en español con claridad.
- Los casos prioritarios locales (cálculo, hora, mixtos) funcionan de forma estable.
- La configuración mínima de OpenRouter está validada y bien documentada.
- Las pruebas y validaciones de calidad se ejecutan sin regresiones en el alcance trabajado.
- La documentación refleja con precisión el estado real del proyecto y cómo continuar.

Se considera completada la **evolución HTTP** cuando, además:

- Existe al menos una herramienta HTTP registrada y documentada (vuelos).
- Las pruebas automatizadas no dependen de la API real en cada ejecución.
- El prompt guía el encadenamiento con la calculadora en escenarios de presupuesto.
- El usuario recibe precios orientativos y aviso de que no hay reserva ni pago.

---

## 7. Riesgos y mitigaciones

- **Riesgo:** crecimiento desordenado por agregar capacidades sin criterio.
  - **Mitigación:** aplicar reglas de extensión por capas y validar alcance antes de implementar.

- **Riesgo:** respuestas inconsistentes en tono o idioma.
  - **Mitigación:** definir guía de respuesta esperada y validarla en pruebas de comportamiento.

- **Riesgo:** fallas por configuración incompleta en entornos nuevos.
  - **Mitigación:** validación temprana + checklist de arranque + mensajes de error accionables.

- **Riesgo:** regresiones al introducir cambios funcionales.
  - **Mitigación:** cambios incrementales y ejecución obligatoria de pruebas/lint antes de cerrar.

- **Riesgo:** pruebas inestables o costosas por llamar APIs reales en CI.
  - **Mitigación:** mocks/fixtures obligatorios en `npm test`; prueba manual documentada aparte.

- **Riesgo:** latencia o límites de cuota del proveedor de vuelos.
  - **Mitigación:** timeout en cliente HTTP, límite de ofertas devueltas, mensajes de error claros al agente.

- **Riesgo:** exposición de API keys o datos sensibles en logs.
  - **Mitigación:** solo variables de entorno; logging de metadatos (status, duración), no bodies completos.

- **Riesgo:** el modelo inventa precios si la herramienta falla.
  - **Mitigación:** prompt explícito; la herramienta devuelve mensajes de error entendibles en lugar de datos vacíos ambiguos.

---

## 8. Próximos pasos recomendados tras este plan

1. Ejecutar Fase 0 en una sesión corta de alineación de equipo.
2. Cerrar o verificar Fases 1–5 para la línea base local antes de comprometer la Fase 6.
3. En Fase 6, avanzar en el orden: cliente HTTP → env → formateador + tests → herramienta → registro y prompt → prueba manual E2E.
4. Al cierre de cada fase, validar: funcionamiento, pruebas y documentación.
5. Registrar decisiones importantes (proveedor de API, campos del resumen, variables de entorno) para mantener trazabilidad.
