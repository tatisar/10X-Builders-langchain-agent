# Brief del Agente Didáctico

## 1. Título de la tarea

Fortalecer y documentar un agente didáctico en español que responda preguntas de forma clara y pueda apoyarse en herramientas para calcular, consultar la hora actual y, de forma incremental, obtener datos de servicios externos mediante peticiones HTTP (por ejemplo, precios de vuelos en tiempo real).

---

## 2. Contexto

Hoy el proyecto ya cuenta con una base funcional: recibe una pregunta desde consola, decide si necesita usar una herramienta y entrega una respuesta al usuario en español.

El valor principal del proyecto es educativo: mostrar de forma sencilla cómo construir un agente que razona, usa herramientas, encadena varias de ellas cuando hace falta y mantiene una estructura ordenada para poder crecer sin romper lo existente.

El reto actual no está en “hacer que funcione”, sino en dejar una guía más clara de propósito, límites y criterios de calidad para que cualquier persona del equipo pueda continuar el trabajo con rapidez.

También existen puntos a cuidar a corto plazo:

- La herramienta de cálculo resuelve bien casos simples, pero su enfoque actual no es ideal para escenarios de producción.
- La configuración depende de variables de entorno correctas; si faltan, la ejecución falla (lo cual es deseable, pero requiere buena documentación).
- El proyecto está listo para crecer con nuevas herramientas, pero necesita mantener una forma de trabajo consistente para no perder claridad.
- Las integraciones con APIs de terceros añaden latencia, límites de uso y credenciales adicionales; deben documentarse y probarse sin depender siempre de la red en entornos automatizados.

**Dirección inmediata:** extender el agente con herramientas que consulten APIs externas, procesen respuestas en formato JSON y entreguen al modelo un resumen en texto plano (no el JSON crudo). Un caso de estudio prioritario es la búsqueda de vuelos: el usuario puede preguntar, por ejemplo, si un viaje a Japón cabe en un presupuesto de 2000 USD; el agente obtiene precios reales, resume las ofertas y usa la calculadora para impuestos o totales antes de concluir.

El objetivo de este brief es alinear al equipo en una visión compartida: mantener el agente simple, útil y fácil de extender, con foco en calidad, pruebas y comunicación clara.

---

## 3. Requerimientos del proyecto

### Lenguaje y stack

- El proyecto está construido con TypeScript sobre Node.js moderno.
- Usa LangChain para componer el agente y orquestar el uso de herramientas.
- Se conecta a OpenRouter para acceder al modelo de lenguaje.
- Usa validación de configuración para asegurar que el entorno esté completo antes de ejecutar (modelo de lenguaje y, cuando aplique, credenciales de APIs externas).
- Cuenta con pruebas automatizadas y validaciones de calidad para mantener estabilidad.
- Las herramientas HTTP usan las capacidades nativas de red del runtime (por ejemplo, `fetch`) sin añadir dependencias pesadas salvo que haya una justificación clara.

### Arquitectura y enfoque

La solución está dividida en capas claras para que cada parte tenga una responsabilidad concreta:

- Una capa de entrada recibe la pregunta del usuario.
- Una capa de ejecución coordina el proceso de respuesta.
- Una capa de composición arma el agente con su modelo, prompt y herramientas.
- Una capa de capacidades concentra las herramientas del dominio:
  - **Locales:** cálculo y hora actual.
  - **Integraciones HTTP:** consulta a servicios de terceros, procesamiento de JSON y devolución de un texto resumido al agente.
- Una capa de configuración centraliza y valida variables de entorno (OpenRouter y claves o URLs de APIs externas).
- Una subcapa compartida de acceso HTTP (cliente, timeouts, mensajes de error) evita duplicar lógica en cada herramienta nueva.

Este enfoque permite:

- Entender rápido qué hace cada módulo.
- Agregar nuevas herramientas sin reescribir todo.
- Probar piezas de forma aislada (formateadores con datos de ejemplo, herramientas con respuestas simuladas).
- Reducir riesgos al evolucionar el proyecto.

### Capacidades del agente

| Capacidad | Herramienta (conceptual) | Qué aporta |
|-----------|--------------------------|------------|
| Cálculo | Calculadora | Operaciones matemáticas para totales, porcentajes e impuestos. |
| Hora | Hora actual | Respuestas que dependen del momento presente. |
| Datos externos | Búsqueda de vuelos (y futuras APIs) | Precios y ofertas obtenidos en tiempo real desde un proveedor configurado. |

El agente puede **encadenar** herramientas: primero obtener datos externos, luego calcular con la herramienta matemática. No se espera una sola herramienta que haga consulta HTTP y cálculo a la vez; la separación mantiene el diseño didáctico y facilita las pruebas.

### Input esperado

El sistema espera preguntas escritas en lenguaje natural por parte del usuario.

**Tipos de solicitudes contempladas hoy:**

- Preguntas que requieren operaciones matemáticas sencillas.
- Preguntas sobre la hora actual.
- Preguntas mixtas que combinan cálculo y hora.

**Tipos de solicitudes previstas con integraciones HTTP:**

- Preguntas que requieren datos que solo existen fuera del modelo (por ejemplo, precios de vuelos entre dos ciudades en fechas concretas).
- Preguntas que combinan datos externos y cálculo (por ejemplo, verificar si el costo de un viaje, con impuestos estimados, se ajusta a un presupuesto dado).
- Preguntas donde el usuario no conoce códigos técnicos (IATA, formatos de fecha): el modelo debe inferir o pedir aclaración lo mínimo indispensable.

**Resultado esperado para el usuario:**

- Respuesta en español.
- Explicación breve de lo que hizo el agente (qué herramientas usó y en qué orden, si aplica).
- Uso de herramientas solo cuando realmente aporta valor.
- Cuando se usen precios de APIs externas, dejar claro que son orientativos, pueden cambiar y no implican reserva ni pago.

---

## 4. Restricciones

- Mantener el enfoque pedagógico: primero claridad, luego complejidad.
- Evitar agregar componentes que no aporten al objetivo principal del aprendizaje.
- No introducir dependencias innecesarias sin justificación funcional.
- Cuidar que cualquier mejora preserve compatibilidad con la ejecución por consola y pruebas existentes.
- Documentar claramente cualquier cambio en configuración, comportamiento o límites del agente.

**Límites específicos de integraciones HTTP:**

- No incluir interfaz web ni panel de administración como parte de este agente.
- No realizar reservas, pagos ni persistencia de itinerarios; solo consulta y recomendación.
- No exponer al modelo el JSON completo de la API si un resumen en texto plano es suficiente (menor ruido y menor consumo de contexto).
- No registrar en logs credenciales, tokens ni datos personales sensibles de las respuestas.
- Las pruebas automatizadas no deben depender de llamadas reales a APIs de pago en cada ejecución; usar datos de ejemplo o respuestas simuladas en CI.
- Respetar límites de uso y términos del proveedor de la API elegida.

---

## 5. Definition of Done (DoD)

El trabajo se considera terminado cuando:

- El brief refleja con precisión el estado actual del proyecto y su dirección inmediata (herramientas locales e integraciones HTTP planificadas o en curso).
- El lenguaje del documento es claro, humano y comprensible para perfiles no profundamente técnicos.
- Se explican propósito, funcionamiento general, límites y próximos pasos sin usar código.
- La información está alineada con la estructura real del repositorio, documentación y pruebas actuales.
- Queda claro cómo evaluar calidad mínima en cada cambio futuro (ejecución correcta, pruebas, consistencia y documentación).
- Para cada nueva herramienta HTTP queda documentado qué pregunta resuelve, qué variables de entorno requiere y qué no promete al usuario final.
