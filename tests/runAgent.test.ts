import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { describe, expect, it, vi } from "vitest";
import { runAgent } from "../src/agent/runAgent.js";

describe("runAgent", () => {
  it("retorna output cuando el executor responde", async () => {
    const executor = {
      invoke: vi.fn().mockResolvedValue({
        messages: [new AIMessage("resultado de prueba")],
      }),
    };

    const output = await runAgent("pregunta", { executor });

    expect(executor.invoke).toHaveBeenCalledWith({
      messages: [new HumanMessage("pregunta")],
    });
    expect(output).toBe("resultado de prueba");
  });
});
