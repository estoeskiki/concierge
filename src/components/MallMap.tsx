import { useState, useEffect, useRef } from 'react';
import { loadNavGraph, getNavNodes, aStar, nearestCorridorNode, KIOSK_NODE_ID, KIOSK_FLOOR, NavNode } from '../lib/pathfinding';
import { getAllStores } from '../lib/search';

// SVG coordinate system
const W     = 1200;
const H     = 500;
const EW    = 80;
const CY1   = 185;
const CY2   = 315;
const CY    = 250;
const COLS  = 5;
const SLOT_W = (W - EW * 2) / COLS;

const SLOT_CX = Array.from({ length: COLS }, (_, i) => EW + i * SLOT_W + SLOT_W / 2);

type Phase = 'idle' | 'drawing-start' | 'elevator-card' | 'drawing-dest';

interface MallMapProps {
  destinationNodeId?: string | null;
  destinationLabel?: string;
  destinationFloor?: number;
}

export default function MallMap({ destinationNodeId, destinationLabel, destinationFloor }: MallMapProps) {
  const [activeFloor, setActiveFloor] = useState(KIOSK_FLOOR);
  const [route, setRoute]   = useState<NavNode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase]   = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const handleFloorClick = (f: number) => {
    clearTimers();
    setPhase('idle');
    setActiveFloor(f);
  };

  useEffect(() => {
    loadNavGraph().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimers();

    let goalId = destinationNodeId ?? undefined;
    if (!goalId && destinationFloor != null) {
      const fallback = nearestCorridorNode(destinationFloor, 400);
      if (fallback) goalId = fallback.id;
    }

    if (goalId) {
      const path = aStar(KIOSK_NODE_ID, goalId);
      setRoute(path);

      const floors = [...new Set(path.map(n => n.floor))].sort();
      const isMulti = floors.length > 1;

      if (isMulti) {
        setActiveFloor(KIOSK_FLOOR);
        setPhase('drawing-start');
        timers.current = [
          // After draw animation finishes, show elevator card
          setTimeout(() => setPhase('elevator-card'), 1900),
          // Auto-advance to destination floor
          setTimeout(() => {
            setActiveFloor(destinationFloor ?? floors[floors.length - 1]);
            setPhase('drawing-dest');
          }, 3800),
        ];
      } else {
        setActiveFloor(destinationFloor ?? KIOSK_FLOOR);
        setPhase('drawing-start');
      }
    } else {
      setRoute([]);
      setPhase('idle');
    }

    return clearTimers;
  }, [loaded, destinationNodeId, destinationFloor]);

  // — Derived data for current floor —
  const allNodes  = getNavNodes().filter(n => n.floor === activeFloor);
  const bathNodes = allNodes.filter(n => n.type === 'bathroom');
  const stores    = getAllStores().filter(s => s.floor === activeFloor);

  type SlotItem = { kind: 'store'; data: typeof stores[0] } | { kind: 'bathroom'; node: NavNode } | { kind: 'empty' };
  function buildSlotRow(rowStores: typeof stores, rowBaths: NavNode[]): SlotItem[] {
    const bathByCol = new Map<number, NavNode>();
    rowBaths.forEach(n => {
      const col = Math.max(0, Math.min(COLS - 1, Math.floor((n.x - EW) / SLOT_W)));
      bathByCol.set(col, n);
    });
    let si = 0;
    return Array.from({ length: COLS }, (_, col) => {
      if (bathByCol.has(col)) return { kind: 'bathroom', node: bathByCol.get(col)! };
      const s = rowStores[si++];
      return s ? { kind: 'store', data: s } : { kind: 'empty' };
    });
  }

  const northBaths = bathNodes.filter(n => n.y < CY);
  const southBaths = bathNodes.filter(n => n.y >= CY);
  const northSlots = buildSlotRow(stores.slice(0, COLS), northBaths);
  const southSlots = buildSlotRow(stores.slice(COLS, COLS * 2), southBaths);

  const floorRoute  = route.filter(n => n.floor === activeFloor);
  const routeFloors = [...new Set(route.map(n => n.floor))].sort();
  const isMultiFloor = routeFloors.length > 1;

  const destSlot = (() => {
    if (!destinationLabel || destinationFloor !== activeFloor) return null;
    const nc = northSlots.findIndex(s => s.kind === 'store' && s.data.name === destinationLabel);
    if (nc >= 0) return { col: nc, isNorth: true };
    const sc = southSlots.findIndex(s => s.kind === 'store' && s.data.name === destinationLabel);
    if (sc >= 0) return { col: sc, isNorth: false };
    return null;
  })();

  // Snap elevator nodes (first/last of floorRoute) to the corridor edge
  const snappedFloorRoute = floorRoute.map((n, i) => {
    if (i !== 0 && i !== floorRoute.length - 1) return n;
    if (n.x <= EW)     return { ...n, x: EW };
    if (n.x >= W - EW) return { ...n, x: W - EW };
    return n;
  });

  const storeBend = destSlot ? { x: SLOT_CX[destSlot.col], y: CY } : null;
  const storeTerminus = destSlot ? {
    x: SLOT_CX[destSlot.col],
    y: destSlot.isNorth ? CY1 : CY2,
  } : null;

  const allRoutePoints = [
    ...snappedFloorRoute.map(n => `${n.x},${n.y}`),
    ...(storeBend     ? [`${storeBend.x},${storeBend.y}`]         : []),
    ...(storeTerminus ? [`${storeTerminus.x},${storeTerminus.y}`] : []),
  ];
  const routePoints = allRoutePoints.join(' ');

  if (!loaded) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface-low)', borderRadius: '20px', border: '2px solid var(--border)' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Floor tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[1, 2, 3].map(f => (
          <button key={f} onClick={() => handleFloorClick(f)} style={{
            padding: '8px 22px', borderRadius: '999px', cursor: 'pointer',
            border: `2px solid ${activeFloor === f ? 'var(--primary)' : 'var(--border)'}`,
            background: activeFloor === f ? 'var(--primary)' : 'var(--bg-surface)',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
            color: activeFloor === f ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            Nivel {f}
            {routeFloors.includes(f) && activeFloor !== f && (
              <span style={{ marginLeft: '6px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', verticalAlign: 'middle' }} />
            )}
          </button>
        ))}
        {isMultiFloor && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--tertiary)', fontWeight: 700 }}>
            {routeFloors.map(f => `P${f}`).join(' → ')} via ascensor
          </span>
        )}
      </div>

      {/* Map + overlay wrapper */}
      <div style={{ position: 'relative' }}>

        {/* SVG Floor Plan */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--border)', background: '#f8fafc' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>

            <rect x={0} y={0} width={W} height={H} fill="#f8fafc" />

            {/* Store zones */}
            <rect x={EW} y={0}   width={W - EW * 2} height={CY1}     fill="#fffbeb" />
            <rect x={EW} y={CY2} width={W - EW * 2} height={H - CY2} fill="#fffbeb" />

            {/* Slot dividers north */}
            {Array.from({ length: COLS + 1 }, (_, i) => (
              <line key={`nd${i}`} x1={EW + i * SLOT_W} y1={0} x2={EW + i * SLOT_W} y2={CY1} stroke="#e2e8f0" strokeWidth={1.5} />
            ))}
            {/* Slot dividers south */}
            {Array.from({ length: COLS + 1 }, (_, i) => (
              <line key={`sd${i}`} x1={EW + i * SLOT_W} y1={CY2} x2={EW + i * SLOT_W} y2={H} stroke="#e2e8f0" strokeWidth={1.5} />
            ))}

            {/* Destination slot highlight */}
            {destSlot && (
              <rect
                x={EW + destSlot.col * SLOT_W + 2} y={destSlot.isNorth ? 2 : CY2 + 2}
                width={SLOT_W - 4} height={(destSlot.isNorth ? CY1 : H - CY2) - 4}
                fill="rgba(255,107,152,0.12)" stroke="var(--secondary)" strokeWidth={2} rx={4}
              />
            )}

            {/* North row slots */}
            {northSlots.map((slot, col) => {
              const cx = SLOT_CX[col]; const cy = CY1 / 2;
              if (slot.kind === 'store') return (
                <g key={slot.data.id}>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28}>{slot.data.emoji || '🏪'}</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize={13} fontFamily="sans-serif" fontWeight="600" fill="#334155">
                    {slot.data.name.length > 9 ? slot.data.name.slice(0, 9) + '…' : slot.data.name}
                  </text>
                </g>
              );
              if (slot.kind === 'bathroom') return (
                <g key={slot.node.id}>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28}>🚻</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fontFamily="sans-serif" fontWeight="700" fill="#0ea5e9">Baños</text>
                </g>
              );
              return <text key={`ne${col}`} x={cx} y={cy + 6} textAnchor="middle" fontSize={13} fill="#cbd5e1" fontFamily="sans-serif">—</text>;
            })}

            {/* South row slots */}
            {southSlots.map((slot, col) => {
              const cx = SLOT_CX[col]; const cy = CY2 + (H - CY2) / 2;
              if (slot.kind === 'store') return (
                <g key={slot.data.id}>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28}>{slot.data.emoji || '🏪'}</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize={13} fontFamily="sans-serif" fontWeight="600" fill="#334155">
                    {slot.data.name.length > 9 ? slot.data.name.slice(0, 9) + '…' : slot.data.name}
                  </text>
                </g>
              );
              if (slot.kind === 'bathroom') return (
                <g key={slot.node.id}>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28}>🚻</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fontFamily="sans-serif" fontWeight="700" fill="#0ea5e9">Baños</text>
                </g>
              );
              return <text key={`se${col}`} x={cx} y={cy + 6} textAnchor="middle" fontSize={13} fill="#cbd5e1" fontFamily="sans-serif">—</text>;
            })}

            {/* Corridor */}
            <rect x={0} y={CY1} width={W} height={CY2 - CY1} fill="#ffffff" />
            <line x1={0} y1={CY1} x2={W} y2={CY1} stroke="#e2e8f0" strokeWidth={2} />
            <line x1={0} y1={CY2} x2={W} y2={CY2} stroke="#e2e8f0" strokeWidth={2} />
            <line x1={EW} y1={CY} x2={W - EW} y2={CY} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="12 6" />

            {/* Elevator zones */}
            <rect x={0}      y={0} width={EW} height={H} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={2} />
            <rect x={W - EW} y={0} width={EW} height={H} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={2} />
            <text x={EW / 2}     y={H / 2 - 16} textAnchor="middle" fontSize={22}>🛗</text>
            <text x={EW / 2}     y={H / 2 + 10} textAnchor="middle" fontSize={11} fontFamily="sans-serif" fontWeight="700" fill="#3b82f6">ELEV</text>
            <text x={W - EW / 2} y={H / 2 - 16} textAnchor="middle" fontSize={22}>🛗</text>
            <text x={W - EW / 2} y={H / 2 + 10} textAnchor="middle" fontSize={11} fontFamily="sans-serif" fontWeight="700" fill="#3b82f6">ELEV</text>

            {/* Outer wall */}
            <rect x={0} y={0} width={W} height={H} fill="none" stroke="#94a3b8" strokeWidth={3} />

            {/* Route polyline — key includes phase+floor to restart animation on floor switch */}
            {routePoints && floorRoute.length >= 2 && (
              <polyline
                key={`${phase}-${activeFloor}-${routePoints}`}
                points={routePoints}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="map-route"
              />
            )}

            {/* You Are Here */}
            {activeFloor === KIOSK_FLOOR && (
              <g>
                <circle cx={600} cy={CY} r={22} fill="var(--primary)" opacity={0.25} className="map-pulse" />
                <circle cx={600} cy={CY} r={13} fill="var(--primary)" stroke="#fff" strokeWidth={3} />
                <text x={600} y={CY + 5} textAnchor="middle" fontSize={9} fontFamily="sans-serif" fontWeight="900" fill="#000">YO</text>
                <text x={600} y={CY - 28} textAnchor="middle" fontSize={11} fontFamily="sans-serif" fontWeight="700" fill="#5a7000">Estás aquí</text>
              </g>
            )}

            <text x={W - EW - 10} y={H - 10} textAnchor="end" fontSize={13} fontFamily="sans-serif" fontWeight="700" fill="#94a3b8">
              NIVEL {activeFloor}
            </text>
          </svg>
        </div>

        {/* Elevator card — slides up between the two floor animations */}
        {phase === 'elevator-card' && (
          <div
            onClick={() => {
              clearTimers();
              setActiveFloor(destinationFloor ?? routeFloors[routeFloors.length - 1]);
              setPhase('drawing-dest');
            }}
            className="animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '16px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(6,14,29,0.92)',
              backdropFilter: 'blur(12px)',
              border: '2px solid var(--tertiary)',
              borderRadius: '20px',
              padding: '18px 32px',
              display: 'flex', alignItems: 'center', gap: '18px',
              boxShadow: '0 8px 40px rgba(0,240,255,0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>🛗</span>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem', color: 'rgba(0,240,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
                Cambia de piso
              </p>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                Toma el ascensor · Nivel {KIOSK_FLOOR} → Nivel {destinationFloor}
              </p>
            </div>
            <span style={{ color: 'var(--tertiary)', fontSize: '1.3rem', marginLeft: '4px' }}>→</span>
          </div>
        )}
      </div>

      {/* Route info bar */}
      {route.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: '16px',
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Ruta hacia
            </p>
            <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {destinationLabel ?? 'Destino'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMultiFloor && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Toma el ascensor
                </p>
                <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, color: 'var(--tertiary)', margin: 0 }}>
                  {routeFloors.map(f => `Nivel ${f}`).join(' → ')}
                </p>
              </div>
            )}
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
              ~{Math.round(route.reduce((acc, n, i) => {
                if (i === 0) return 0;
                const prev = route[i - 1];
                return acc + (n.floor !== prev.floor ? 0 : Math.sqrt((n.x - prev.x) ** 2 + (n.y - prev.y) ** 2));
              }, 0) / 10)}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
