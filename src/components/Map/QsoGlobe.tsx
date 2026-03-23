import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeInstance } from 'globe.gl';
import { useContestStore } from '../../stores/useContestStore';

interface RawQso {
  station_callsign: string;
  call: string;
  band: string;
  gridsquare: string;
  my_gridsquare: string;
  coordinates: { lat: number; lng: number } | null;
  stationCoordinates: { lat: number; lng: number } | null;
}

interface PointData {
  lat: number;
  lng: number;
  callsign: string;
  band?: string;
  gridsquare?: string;
  type: 'station' | 'contact';
  size: number;
}

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  callsign: string;
}

const PURPLE = '#512888';
const GOLD = '#F4C55C';

export default function QsoGlobe() {
  const activeContest = useContestStore((s) => s.activeContest);
  const [rawQsos, setRawQsos] = useState<RawQso[]>([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | undefined>(undefined);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Set initial view when globe mounts
  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: 39, lng: -96.5, altitude: 2.2 }, 1000);

    // Darken the globe material
    const scene = globe.scene();
    if (scene) {
      scene.background = null; // transparent
    }
  }, []);

  // Fetch QSO data
  useEffect(() => {
    if (!activeContest) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/contests/${activeContest.id}/map-data`);
        if (res.ok) {
          const data: RawQso[] = await res.json();
          setRawQsos(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeContest]);

  // Derive points and arcs
  const { points, arcs } = useMemo(() => {
    const stationMap = new Map<string, PointData>();
    const contactPoints: PointData[] = [];
    const arcList: ArcData[] = [];

    for (const qso of rawQsos) {
      if (qso.stationCoordinates && !stationMap.has(qso.station_callsign)) {
        stationMap.set(qso.station_callsign, {
          lat: qso.stationCoordinates.lat,
          lng: qso.stationCoordinates.lng,
          callsign: qso.station_callsign,
          type: 'station',
          size: 0.6,
        });
      }

      if (qso.coordinates) {
        contactPoints.push({
          lat: qso.coordinates.lat,
          lng: qso.coordinates.lng,
          callsign: qso.call,
          band: qso.band,
          gridsquare: qso.gridsquare,
          type: 'contact',
          size: 0.25,
        });

        if (qso.stationCoordinates) {
          arcList.push({
            startLat: qso.stationCoordinates.lat,
            startLng: qso.stationCoordinates.lng,
            endLat: qso.coordinates.lat,
            endLng: qso.coordinates.lng,
            callsign: qso.call,
          });
        }
      }
    }

    return {
      points: [...Array.from(stationMap.values()), ...contactPoints],
      arcs: arcList,
    };
  }, [rawQsos]);

  if (!activeContest) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Select a contest to view the globe.</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
      {loading && <div style={styles.loading}>Loading globe data...</div>}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef as any}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor={PURPLE}
          atmosphereAltitude={0.18}
          onGlobeReady={handleGlobeReady}
          // Points
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0.01}
          pointRadius="size"
          pointColor={(d: any) => (d as PointData).type === 'station' ? PURPLE : GOLD}
          pointLabel={(d: any) => {
            const p = d as PointData;
            if (p.type === 'station') {
              return `<div style="background:rgba(45,29,66,0.92);color:#E7DED0;padding:4px 10px;border-radius:4px;font-size:13px;border:1px solid ${PURPLE}"><b>${p.callsign}</b> (Station)</div>`;
            }
            return `<div style="background:rgba(45,29,66,0.92);color:#E7DED0;padding:4px 10px;border-radius:4px;font-size:13px;border:1px solid ${GOLD}"><b>${p.callsign}</b><br/>${p.gridsquare || ''} ${p.band || ''}</div>`;
          }}
          // Arcs
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => [`${GOLD}66`, `${GOLD}CC`]}
          arcAltitude={0.2}
          arcStroke={0.6}
          arcDashLength={0.6}
          arcDashGap={0.3}
          arcDashAnimateTime={1500}
          arcLabel={(d: any) => {
            const a = d as ArcData;
            return `<div style="background:rgba(45,29,66,0.92);color:#E7DED0;padding:4px 10px;border-radius:4px;font-size:13px;border:1px solid ${GOLD}">${a.callsign}</div>`;
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#1a1028',
    overflow: 'hidden',
  },
  loading: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    color: '#E7DED0',
    background: 'rgba(45, 29, 66, 0.9)',
    padding: '6px 16px',
    borderRadius: 6,
    fontSize: 14,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#E7DED0',
    fontSize: 16,
  },
};
