import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const testBoxData = [
  {
    color: "#3b82f6",
    metalness: 0.3,
    roughness: 0.6,
    opacity: 0.9,
    transparent: true,
    position: [2, 1, -3] as [number, number, number],
    size: [2, 1, 1] as [number, number, number],
  },
  {
    color: "#ef4444",
    metalness: 0.1,
    roughness: 0.9,
    opacity: 1,
    transparent: false,
    position: [-2, 0, 1] as [number, number, number],
    size: [1, 2, 1] as [number, number, number],
  },
];

type BoxData = {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  position: [number, number, number];
  size: [number, number, number];
};

function Box({ data }: { data: BoxData }) {
  return (
    <mesh position={data.position}>
      <boxGeometry args={data.size} />
      <meshStandardMaterial
        color={data.color}
        metalness={data.metalness}
        roughness={data.roughness}
        opacity={data.opacity}
        transparent={data.transparent}
      />
    </mesh>
  );
}

const testComponent = () => {
  const [showBox, setShowBox] = useState(false);
  const [boxData, setBoxData] = useState(null);

  useEffect(() => {});

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <button
        style={{
          position: "absolute",
          zIndex: 1,
          top: 20,
          left: 20,
          padding: "8px 16px",
        }}
        onClick={() => setShowBox(!showBox)}
      >
        {showBox ? "Remove Box" : "Add Box"}
      </button>

      <Canvas camera={{ position: [3, 3, 3] }}>
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        {showBox && testBoxData.map((box, i) => <Box key={i} data={box} />)}
        {/* <OrbitControls /> */}
      </Canvas>
    </div>
  );
};

export default testComponent;
