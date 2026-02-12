import { describe, expect, it } from "vitest";

import { healthMessage } from "./index";

describe("healthMessage", () => {
  it("returns a readiness message", () => {
    expect(healthMessage("friend")).toBe("Kokoro Presence ready, friend.");
  });
});
