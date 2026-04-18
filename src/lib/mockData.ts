import { InfographicBlueprint } from "@/types/infographics";

export const trainQuestionMock: InfographicBlueprint = {
  config: {
    minX: -20,
    maxX: 30,
    minY: 0,
    maxY: 10,
  },
  explanation:
    "To cross the pole, the train must travel a distance equal to its own length. If it travels at 16.67 m/s for 9 seconds, it covers 150 meters. Therefore, the train is 150 meters long.",

  pacing: [
    { percent: 0, speedMultiplier: 1.0 },
    { percent: 40, speedMultiplier: 1.0 },
    { percent: 45, speedMultiplier: 0.2 },
    { percent: 60, speedMultiplier: 0.2 },
    { percent: 65, speedMultiplier: 1.0 },
    { percent: 100, speedMultiplier: 1.0 },
  ],

  entities: [
    {
      id: "pole-1",
      label: "Pole",
      width: 1,
      height: 6,
      color: "#64748b",
      shape: "box",
      keyframes: [
        { time: 0, x: 10, y: 2 },
        { time: 100, x: 10, y: 2 },
      ],
    },
    {
      id: "train-1",
      label: "Train (150m)",
      width: 15,
      height: 3,
      color: "#ef4444",
      shape: "box",
      keyframes: [
        { time: 0, x: -5, y: 4 },
        { time: 100, x: 10, y: 4 },
      ],
    },
    {
      id: "dimension-line",
      label: "Distance = 150m",
      width: 15,
      height: 2,
      color: "#3b82f6",
      shape: "line",
      keyframes: [
        { time: 0, x: -5, y: 8 },
        { time: 100, x: 10, y: 8 },
      ],
    },
  ],
};
