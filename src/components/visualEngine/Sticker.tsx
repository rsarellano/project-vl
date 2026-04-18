"use client"

import React from 'react';
import { Entity } from '@/types/infographics';
import { getPositionAtTime } from '@/lib/animations';

interface StickerProps {
    data: Entity;
    progress: number;
    stepSize: number;
}

export const Sticker = ({ data, progress, stepSize }: StickerProps) => {

    const currentPos = getPositionAtTime(data.keyframes, progress);

    const pixelX = currentPos.x * stepSize;
    const pixelY = currentPos.y * stepSize;
    const pixelWidth = data.width * stepSize;
    const pixelHeight = data.height * stepSize;

    return (
        <g transform={`translate(${pixelX}, ${pixelY})`} className="transition-all duration-75">

            {data.shape === 'arrow' && (
                <path
                    d={`M 0 ${pixelHeight / 2} L ${pixelWidth} ${pixelHeight / 2} M ${pixelWidth - 5} ${pixelHeight / 2 - 5} L ${pixelWidth} ${pixelHeight / 2} L ${pixelWidth - 5} ${pixelHeight / 2 + 5}`}
                    stroke={data.color}
                    strokeWidth="2"
                    fill="none"
                />
            )}

            {data.shape === 'line' && (
                <line
                    x1="0" y1={pixelHeight / 2}
                    x2={pixelWidth} y2={pixelHeight / 2}
                    stroke={data.color} strokeWidth="2" strokeDasharray="4"
                />
            )}

            {(!data.shape || data.shape === 'box') && (
                <rect
                    width={pixelWidth}
                    height={pixelHeight}
                    fill={data.color}
                    rx="4"
                    opacity="0.9"
                />
            )}

            <text
                x={pixelWidth / 2}
                y={pixelHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={data.shape === 'box' || !data.shape ? 'white' : data.color}
                className="text-[4px] font-bold pointer-events-none drop-shadow-md"
            >
                {data.label}
            </text>
        </g>
    );
};
