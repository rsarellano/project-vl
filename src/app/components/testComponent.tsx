import React, { useState } from "react";

// Sample 2D box data — now uses x, y instead of 3D positions
const testBoxData = [
  {
    color: "#3b82f6",
    position: [200, 150] as [number, number],
    size: [120, 80] as [number, number],
  },
  {
    color: "#ef4444",
    position: [400, 300] as [number, number],
    size: [100, 160] as [number, number],
  },
];

type BoxData = {
  color: string;
  position: [number, number];
  size: [number, number];
};


function Box({ data }: { data: BoxData }) {
  const [x, y] = data.position;
  const [width, height] = data.size;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={data.color}
      stroke="black"
      strokeWidth="2"
      rx="8"
      ry="8"
    />
  );
}

const TestComponent = () => {
  const [showBox, setShowBox] = useState(false);

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-gray-100">
     
      <button
        className="relative top-6 left-6 z-10 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition w-[200px]"
        onClick={() => setShowBox(!showBox)}
      >
        {showBox ? "Remove Boxes" : "Add Boxes"}
      </button>

    
      <div className="w-[640px] h-[800px] border-2 border-blue-500 rounded-lg flex items-center justify-center bg-white shadow-lg">
        <svg
          width="600"
          height="760"
          className="rounded-md bg-gray-50"
          style={{ overflow: "visible" }}
        >
        
          {showBox &&
            testBoxData.map((box, i) => <Box key={i} data={box} />)}
        </svg>
      </div>
      <button>test button</button>
    </div>
  );
};

export default TestComponent;
