import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("dedupes conflicting tailwind utilities via tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
