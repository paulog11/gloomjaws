import { TerrainType } from '../../common/types.js';
// ─── Axial coordinate math ─────────────────────────────────────────────────
export function axialDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}
export function axialNeighbors(coord) {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
    ];
    return directions.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}
export function coordKey(coord) {
    return `${coord.q},${coord.r}`;
}
// ─── Grid helpers ─────────────────────────────────────────────────────────────
export class HexGrid {
    spaces = new Map();
    constructor(spaces) {
        for (const space of spaces) {
            this.spaces.set(coordKey(space.coord), space);
        }
    }
    getByCoord(coord) {
        return this.spaces.get(coordKey(coord));
    }
    getById(id) {
        for (const space of this.spaces.values()) {
            if (space.id === id)
                return space;
        }
        return undefined;
    }
    isPassable(coord, ignoreOccupants = false) {
        const space = this.getByCoord(coord);
        if (!space)
            return false;
        if (space.terrain === TerrainType.WALL)
            return false;
        if (space.terrain === TerrainType.OBSTACLE)
            return false;
        if (space.terrain === TerrainType.DOOR && !space.doorOpen)
            return false;
        if (!ignoreOccupants && space.occupantId)
            return false;
        return true;
    }
    neighbors(coord) {
        return axialNeighbors(coord)
            .map(c => this.getByCoord(c))
            .filter((s) => s !== undefined);
    }
    passableNeighbors(coord) {
        return this.neighbors(coord).filter(s => this.isPassable(s.coord));
    }
    /**
     * BFS shortest path. Returns path including start and end, or null if unreachable.
     */
    findPath(from, to) {
        const goal = coordKey(to);
        const visited = new Set();
        const queue = [];
        const startSpace = this.getByCoord(from);
        if (!startSpace)
            return null;
        queue.push({ coord: from, path: [startSpace] });
        visited.add(coordKey(from));
        while (queue.length > 0) {
            const { coord, path } = queue.shift();
            if (coordKey(coord) === goal)
                return path;
            for (const neighbor of this.passableNeighbors(coord)) {
                const key = coordKey(neighbor.coord);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ coord: neighbor.coord, path: [...path, neighbor] });
                }
            }
        }
        return null;
    }
    /**
     * BFS distance (ignoring occupants). Returns Infinity if unreachable.
     */
    pathDistance(from, to) {
        const goal = coordKey(to);
        const visited = new Set();
        const queue = [];
        queue.push({ coord: from, dist: 0 });
        visited.add(coordKey(from));
        while (queue.length > 0) {
            const { coord, dist } = queue.shift();
            if (coordKey(coord) === goal)
                return dist;
            for (const neighbor of axialNeighbors(coord)) {
                const key = coordKey(neighbor);
                if (!visited.has(key) && this.isPassable(neighbor, true)) {
                    visited.add(key);
                    queue.push({ coord: neighbor, dist: dist + 1 });
                }
            }
        }
        return Infinity;
    }
    /**
     * Simple line-of-sight check using ray casting between hex centers.
     * Returns true if there is a clear line between two hexes.
     */
    hasLineOfSight(from, to) {
        const steps = axialDistance(from, to);
        if (steps === 0)
            return true;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const lerped = axialRound({
                q: from.q + (to.q - from.q) * t,
                r: from.r + (to.r - from.r) * t,
            });
            const space = this.getByCoord(lerped);
            if (!space)
                return false;
            if (space.terrain === TerrainType.WALL || space.terrain === TerrainType.OBSTACLE)
                return false;
        }
        return true;
    }
    allSpaces() {
        return Array.from(this.spaces.values());
    }
}
function axialRound(coord) {
    const s = -coord.q - coord.r;
    let rq = Math.round(coord.q);
    let rr = Math.round(coord.r);
    let rs = Math.round(s);
    const qDiff = Math.abs(rq - coord.q);
    const rDiff = Math.abs(rr - coord.r);
    const sDiff = Math.abs(rs - s);
    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    }
    else if (rDiff > sDiff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}
