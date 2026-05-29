import { supabase, MALL_ID } from './supabase';

export interface NavNode {
  id: string;
  floor: number;
  x: number;
  y: number;
  type: string;
  label: string | null;
}

interface NavEdge {
  from_node_id: string;
  to_node_id: string;
  weight: number | null;
}

let NODES: NavNode[] = [];
let EDGES: NavEdge[] = [];
let loadPromise: Promise<void> | null = null;

export async function loadNavGraph(): Promise<void> {
  if (NODES.length > 0) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabase.from('nav_nodes').select('id, floor, x, y, type, label').eq('mall_id', MALL_ID),
        supabase.from('nav_edges').select('from_node_id, to_node_id, weight').eq('mall_id', MALL_ID),
      ]);
      if (nodes) NODES = nodes;
      if (edges) EDGES = edges;
    })();
  }
  return loadPromise;
}

export function getNavNodes(): NavNode[] { return NODES; }

function euclidean(a: NavNode, b: NavNode): number {
  if (a.floor !== b.floor) return 500; // floor-change penalty
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function aStar(startId: string, goalId: string): NavNode[] {
  const nodeMap = new Map(NODES.map(n => [n.id, n]));
  const start = nodeMap.get(startId);
  const goal  = nodeMap.get(goalId);
  if (!start || !goal) return [];

  // Build bidirectional adjacency list
  const adj = new Map<string, { id: string; w: number }[]>();
  for (const n of NODES) adj.set(n.id, []);
  for (const e of EDGES) {
    const from = nodeMap.get(e.from_node_id);
    const to   = nodeMap.get(e.to_node_id);
    if (!from || !to) continue;
    const w = e.weight ?? euclidean(from, to);
    adj.get(e.from_node_id)!.push({ id: e.to_node_id, w });
    adj.get(e.to_node_id)!.push({ id: e.from_node_id, w });
  }

  const open     = new Set([startId]);
  const cameFrom = new Map<string, string>();
  const g        = new Map<string, number>([[startId, 0]]);
  const f        = new Map<string, number>([[startId, euclidean(start, goal)]]);

  while (open.size > 0) {
    let cur = '';
    let minF = Infinity;
    for (const id of open) { const v = f.get(id) ?? Infinity; if (v < minF) { minF = v; cur = id; } }

    if (cur === goalId) {
      const path = [cur];
      while (cameFrom.has(cur)) { cur = cameFrom.get(cur)!; path.unshift(cur); }
      return path.map(id => nodeMap.get(id)!);
    }

    open.delete(cur);
    for (const { id: nb, w } of (adj.get(cur) ?? [])) {
      const tg = (g.get(cur) ?? Infinity) + w;
      if (tg < (g.get(nb) ?? Infinity)) {
        cameFrom.set(nb, cur);
        g.set(nb, tg);
        f.set(nb, tg + euclidean(nodeMap.get(nb)!, goal));
        open.add(nb);
      }
    }
  }
  return [];
}

// Nearest corridor node on a given floor to a given x position
export function nearestCorridorNode(floor: number, targetX: number): NavNode | null {
  const candidates = NODES.filter(n => n.floor === floor && n.type === 'corridor');
  if (!candidates.length) return null;
  return candidates.reduce((best, n) =>
    Math.abs(n.x - targetX) < Math.abs(best.x - targetX) ? n : best
  );
}

// Demo: kiosk is at the center corridor node on floor 1
export const KIOSK_NODE_ID = '00000001-0004-0000-0000-000000000000';
export const KIOSK_FLOOR   = 1;
