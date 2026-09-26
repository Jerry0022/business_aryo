import { describe, expect, it } from "vitest";
import { getLlmConfig } from "./llm";

describe("LLM provider selection", () => {
  it("is disabled without any key", () => {
    expect(getLlmConfig({})).toBeNull();
  });

  it("prefers Groq and defaults to gpt-oss-120b", () => {
    const config = getLlmConfig({ GROQ_API_KEY: "g", XAI_API_KEY: "x" });
    expect(config?.provider.id).toBe("groq");
    expect(config?.model).toBe("openai/gpt-oss-120b");
    expect(config?.provider.extraBody(config.model, "id")).toEqual({
      reasoning_effort: "low",
      include_reasoning: false,
    });
  });

  it("falls back to Grok (xAI) and honours model overrides", () => {
    const config = getLlmConfig({ XAI_API_KEY: "x", XAI_MODEL: "grok-4.7" });
    expect(config?.provider.id).toBe("xai");
    expect(config?.model).toBe("grok-4.7");
  });

  it("sends no reasoning options to non-gpt-oss Groq models", () => {
    const config = getLlmConfig({ GROQ_API_KEY: "g", GROQ_MODEL: "qwen/qwen3.8-27b" });
    expect(config?.provider.extraBody(config.model, "id")).toEqual({});
  });
});
