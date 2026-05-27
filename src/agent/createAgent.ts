import { createAgent } from "langchain";
import { createModel } from "./model.js";
import { calculatorTool } from "./tools/calculator.js";
import { currentTimeTool } from "./tools/currentTime.js";
import { agentSystemPrompt } from "./prompt.js";

export const agentTools = [calculatorTool, currentTimeTool];

export function buildAgentExecutor(_verbose = true) {
  const model = createModel();

  return createAgent({
    model,
    tools: agentTools,
    systemPrompt: agentSystemPrompt,
  });
}
