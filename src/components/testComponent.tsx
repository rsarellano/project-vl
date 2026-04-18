import React from 'react';

interface GridData {
  cols: number;
  rows: number;
  stickers: Array<{id: string, x: number, y: number, label: string}>;
}

const ExpandableGrid = ({ data }: { data: GridData }) => {
  const { cols, rows, stickers } = data;
  
  const step = 10;
  const totalWidth = cols * step;
  const totalHeight = rows * step;

  return (
    <div className="w-full overflow-auto bg-slate-200 p-4 rounded-xl">
      <div 
        style={{ width: `${totalWidth * 2}px` }}
        className="bg-white shadow-lg mx-auto"
      >
        <svg 
          viewBox={`0 0 ${totalWidth} ${totalHeight}`} 
          className="w-full h-full"
        >
          <g stroke="#e2e8f0" strokeWidth="0.1">
            {[...Array(cols + 1)].map((_, i) => (
              <line key={`v-${i}`} x1={i * step} y1="0" x2={i * step} y2={totalHeight} />
            ))}
            {[...Array(rows + 1)].map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * step} x2={totalWidth} y2={i * step} />
            ))}
          </g>

          {stickers.map((s) => (
            <g key={s.id} transform={`translate(${s.x * step}, ${s.y * step})`}>
              <rect width="9" height="9" x="0.5" y="0.5" rx="1" fill="#3b82f6" />
              <text x="5" y="5.5" textAnchor="middle" dominantBaseline="middle" fill="white" style={{fontSize: '3px'}}>
                {s.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
