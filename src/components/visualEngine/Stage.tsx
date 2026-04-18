"use client"

import { Sticker } from "@/components/visualEngine/Sticker"
import { generateGridPositions } from "@/lib/gridUtils"
import { InfographicBlueprint } from "@/types/infographics"

interface StageProps {
    blueprint: InfographicBlueprint
    progress: number
}

export const Stage = ({ blueprint, progress }: StageProps) => {
    const { config, entities } = blueprint

    const stepSize = 10

    const viewWidth = (config.maxX - config.minX) * stepSize
    const viewHeight = (config.maxY - config.minY) * stepSize

    const viewBox = `${config.minX * stepSize} ${config.minY * stepSize} ${viewWidth} ${viewHeight}`

    const columns = generateGridPositions(config.minX, config.maxX, stepSize)
    const rows = generateGridPositions(config.minY, config.maxY, stepSize)

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <svg
                viewBox={viewBox}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full max-h-[80vh] bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-700 ease-in-out"
            >
                <g id="grid-lines" stroke="#f1f5f9" strokeWidth="0.5">
                    {columns.map(x => (
                        <line
                            key={`v-${x}`}
                            x1={x} y1={config.minY * stepSize}
                            x2={x} y2={config.maxY * stepSize}
                        />
                    ))}
                    {rows.map(y => (
                        <line
                            key={`h-${y}`}
                            x1={config.minX * stepSize} y1={y}
                            x2={config.maxX * stepSize} y2={y}
                        />
                    ))}
                </g>

                <g id="entities">
                    {entities.map((entity) => (
                        <Sticker
                            key={entity.id}
                            data={entity}
                            progress={progress}
                            stepSize={stepSize}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
};
