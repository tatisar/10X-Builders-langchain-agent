import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  isAIMessage,
  isToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";

const TOOL_GUIDE: Record<string, string> = {
  calculator: "Evalúa operaciones matemáticas simples.",
  current_time: "Devuelve la hora actual en formato local (es-CO).",
};

type StreamUpdate = Record<string, { messages?: BaseMessage[] }>;

export interface VerboseStreamAgent {
  stream: (
    input: { messages: HumanMessage[] },
    config: { streamMode: "updates" },
  ) => Promise<AsyncIterable<StreamUpdate>>;
}

function formatMessageContent(content: AIMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }
        if (typeof block === "object" && block !== null && "text" in block) {
          return String(block.text);
        }
        return "";
      })
      .join("");
  }

  return String(content ?? "");
}

function formatToolArgs(args: unknown): string {
  return JSON.stringify(args, null, 2).replace(/\n/g, "\n      ");
}

export function logVerboseHeader(input: string): void {
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  Ejecución del agente — modo detallado");
  console.log("════════════════════════════════════════════════════════");
  console.log("\n📥 Pregunta recibida:");
  console.log(`   "${input}"`);
  console.log("\n🔄 El agente analizará la pregunta y decidirá si necesita herramientas.");
}

export function logVerboseFooter(toolCount: number, stepCount: number): void {
  console.log("\n────────────────────────────────────────────────────────");
  console.log("✅ Ejecución completada");
  console.log(`   Pasos registrados: ${stepCount}`);
  console.log(`   Herramientas usadas: ${toolCount}`);
  console.log("   A continuación verás la respuesta final para el usuario.");
  console.log("════════════════════════════════════════════════════════\n");
}

function logModelToolPlan(step: number, toolCalls: AIMessage["tool_calls"]): void {
  console.log(`\n── Paso ${step}: El modelo planifica el uso de herramientas ──`);
  console.log("   El LLM revisó la pregunta y concluyó que no puede responder solo con texto.");
  console.log("   Por eso solicita ejecutar una o más herramientas:\n");

  for (const [index, toolCall] of (toolCalls ?? []).entries()) {
    const name = toolCall.name ?? "desconocida";
    const guide = TOOL_GUIDE[name];

    console.log(`   ${index + 1}. Herramienta: ${name}`);
    if (guide) {
      console.log(`      Propósito: ${guide}`);
    }
    console.log("      Parámetros enviados:");
    console.log(`      ${formatToolArgs(toolCall.args)}`);
  }
}

function logToolResult(step: number, message: ToolMessage): void {
  const name = message.name ?? "desconocida";
  const guide = TOOL_GUIDE[name];

  console.log(`\n── Paso ${step}: Resultado de la herramienta "${name}" ──`);
  if (guide) {
    console.log(`   Qué hace esta herramienta: ${guide}`);
  }
  console.log("   Valor devuelto al agente:");
  console.log(`   ${String(message.content)}`);
  console.log("\n   ➜ El modelo incorporará este dato antes de redactar la respuesta final.");
}

function logFinalDraft(step: number, content: string): void {
  console.log(`\n── Paso ${step}: El modelo redacta la respuesta final ──`);
  console.log("   Ya tiene la información necesaria (pregunta + resultados de herramientas).");
  console.log("   Borrador interno (lo que enviará al usuario):\n");
  console.log(`   ${content.replace(/\n/g, "\n   ")}`);
}

export async function runVerboseStream(
  agent: VerboseStreamAgent,
  input: string,
): Promise<string> {
  logVerboseHeader(input);

  const stream = await agent.stream(
    { messages: [new HumanMessage(input)] },
    { streamMode: "updates" },
  );

  let step = 0;
  let toolCount = 0;
  let finalAnswer = "";

  for await (const chunk of stream) {
    if ("model_request" in chunk) {
      const aiMessage = chunk.model_request.messages?.find((message) => isAIMessage(message));
      if (!aiMessage) {
        continue;
      }

      const toolCalls = aiMessage.tool_calls ?? [];
      if (toolCalls.length > 0) {
        step += 1;
        toolCount += toolCalls.length;
        logModelToolPlan(step, toolCalls);
        continue;
      }

      const content = formatMessageContent(aiMessage.content).trim();
      if (content) {
        step += 1;
        finalAnswer = content;
        logFinalDraft(step, content);
      }
    }

    if ("tools" in chunk) {
      for (const message of chunk.tools.messages ?? []) {
        if (!isToolMessage(message)) {
          continue;
        }
        step += 1;
        logToolResult(step, message);
      }
    }
  }

  logVerboseFooter(toolCount, step);
  return finalAnswer;
}
