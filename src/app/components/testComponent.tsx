import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Box() {
  return (
    <mesh position={[2, 0, 0]}>
      <boxGeometry args={[2, 1, 3]} />
      <meshStandardMaterial
        color="skyblue" // like bg-sky-400
        metalness={0.3} // like giving it a shiny accent
        roughness={0.6} // smoother or rougher look
        opacity={0.9} // like opacity-90
        transparent={true} // required for opacity
      />
    </mesh>
  );
}

const testComponent = () => {
  const [showBox, setShowBox] = useState(false);
  const [boxData, setBoxData] = useState(null);

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
        {showBox && <Box />}
        {/* <OrbitControls /> */}
      </Canvas>
    </div>
  );
};

export default testComponent;
