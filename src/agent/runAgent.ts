import {
  AIMessage,
  HumanMessage,
  isAIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { buildAgentExecutor } from "./createAgent.js";
import { runVerboseStream, type VerboseStreamAgent } from "./verboseLog.js";

type AgentInvoker = {
  invoke: (input: { messages: HumanMessage[] }) => Promise<{ messages: BaseMessage[] }>;
};

export interface RunAgentOptions {
  executor?: AgentInvoker;
  verbose?: boolean;
}

function extractAgentText(messages: BaseMessage[]): string {
  const lastAi = [...messages].reverse().find((message) => isAIMessage(message));
  if (!lastAi) {
    return "";
  }

  const { content } = lastAi as AIMessage;
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

function isVerboseStreamAgent(
  executor: AgentInvoker,
): executor is AgentInvoker & VerboseStreamAgent {
  return typeof (executor as AgentInvoker & VerboseStreamAgent).stream === "function";
}

export async function runAgent(
  input: string,
  options: RunAgentOptions = {},
): Promise<string> {
  const verbose = options.verbose ?? false;
  const executor = options.executor ?? buildAgentExecutor();

  if (verbose && isVerboseStreamAgent(executor)) {
    return runVerboseStream(executor, input);
  }

  const result = await executor.invoke({
    messages: [new HumanMessage(input)],
  });

  return extractAgentText(result.messages);
}
