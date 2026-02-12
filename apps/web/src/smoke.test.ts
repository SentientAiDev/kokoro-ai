import { describe, expect, it } from "vitest";

import { healthMessage } from "@kokoro/shared";

describe("workspace integration", () => {
  it("consumes @kokoro/shared", () => {
    expect(healthMessage("dev")).toContain("Kokoro Presence ready");
  });
});
