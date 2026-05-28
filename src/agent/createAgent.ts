import { createAgent } from "langchain";
import { createModel } from "./model.js";
import { calculatorTool } from "./tools/calculator.js";
import { currentTimeTool } from "./tools/currentTime.js";
import { searchFlightsTool } from "./tools/flights/searchFlights.js";
import { agentSystemPrompt } from "./prompt.js";

export const agentTools = [calculatorTool, currentTimeTool, searchFlightsTool];

export function buildAgentExecutor() {
  const model = createModel();

  return createAgent({
    model,
    tools: agentTools,
    systemPrompt: agentSystemPrompt,
  });
}
