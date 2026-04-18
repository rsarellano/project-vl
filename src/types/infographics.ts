export interface Keyframe {
  time: number;
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  label: string;
  width: number;
  height: number;
  color: string;
  shape?: "box" | "line" | "arrow";
  keyframes: Keyframe[];
}

export interface CanvasConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PacingMarker {
  percent: number;
  speedMultiplier: number;
}

export interface InfographicBlueprint {
  config: CanvasConfig;
  entities: Entity[];
  explanation: string;
  pacing: PacingMarker[];
}
