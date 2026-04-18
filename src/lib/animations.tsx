import { Keyframe } from '@/types/infographics';

export const getPositionAtTime = (keyframes: Keyframe[], progress: number) => {
    if (!keyframes || keyframes.length === 0) {
        return { x: 0, y: 0 };
    }

    if (keyframes.length === 1) {
        return { x: keyframes[0].x, y: keyframes[0].y };
    }

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    const nextIdx = sorted.findIndex(frame => frame.time >= progress);

    if (nextIdx === 0) {
        return { x: sorted[0].x, y: sorted[0].y };
    }

    if (nextIdx === -1) {
        const lastFrame = sorted[sorted.length - 1];
        return { x: lastFrame.x, y: lastFrame.y };
    }

    const start = sorted[nextIdx - 1];
    const end = sorted[nextIdx];

    const timeRange = end.time - start.time;
    const factor = (progress - start.time) / timeRange;

    return {
        x: start.x + (end.x - start.x) * factor,
        y: start.y + (end.y - start.y) * factor
    };
};
