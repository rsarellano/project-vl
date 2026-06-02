import type { DrawingStage } from "@/types/infographics";

/**
 * Static Two Sum code-map sample for Phase 1 prototyping.
 * No AI call — load directly in VisualPage to validate code + highlights + explanations.
 */
export function getTwoSumCodeMapStage(): DrawingStage {
  const codeLines = [
    "const twoSum = (nums, target) => {",
    "  const complementMap = new Map();",
    "  for (let i = 0; i < nums.length; i++) {",
    "    const currentVal = nums[i];",
    "    const requiredComplement = target - currentVal;",
    "    if (complementMap.has(currentVal)) {",
    "      return [complementMap.get(currentVal), i];",
    "    }",
    "    complementMap.set(requiredComplement, i);",
    "  }",
    "  return [];",
    "};",
  ];

  return {
    width: 1400,
    height: 900,
    background: "#ffffff",
    layoutMode: "code-map",
    objects: [
      {
        id: "source",
        CodeDisplay: true,
        language: "javascript",
        text: codeLines,
        portions: [
          { id: "setup", lines: [0, 1], label: "Setup" },
          { id: "loop", lines: [2, 4], label: "Scan" },
          { id: "lookup", lines: [5, 7], label: "Lookup" },
          { id: "store", lines: [8, 8], label: "Store" },
          { id: "fallback", lines: [9, 10], label: "Fallback" },
        ],
      },
      {
        id: "explain-setup",
        BoxCreation: true,
        linkedPortion: "setup",
        text: [
          "Create a hash map",
          "to store each complement",
          "and its index",
        ],
      },
      {
        id: "explain-loop",
        BoxCreation: true,
        linkedPortion: "loop",
        text: [
          "Walk every index",
          "Read current value",
          "Compute target − current",
        ],
      },
      {
        id: "explain-lookup",
        BoxCreation: true,
        linkedPortion: "lookup",
        text: [
          "If current value",
          "already in map →",
          "return both indices",
        ],
      },
      {
        id: "explain-store",
        BoxCreation: true,
        linkedPortion: "store",
        text: [
          "Otherwise store",
          "complement → index",
          "for future hits",
        ],
      },
      {
        id: "explain-fallback",
        BoxCreation: true,
        linkedPortion: "fallback",
        text: [
          "No pair found",
          "after full scan",
          "return empty array",
        ],
      },
    ],
    connections: [
      { LineCreation: true, from: "setup", to: "explain-setup" },
      { LineCreation: true, from: "loop", to: "explain-loop" },
      { LineCreation: true, from: "lookup", to: "explain-lookup" },
      { LineCreation: true, from: "store", to: "explain-store" },
      { LineCreation: true, from: "fallback", to: "explain-fallback" },
    ],
  };
}
