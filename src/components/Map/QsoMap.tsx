import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import { useContestStore } from '../../stores/useContestStore';
import { greatCirclePoints } from './GreatCircle';

/** Shape returned by /api/contests/:contestId/map-data (flat array) */
interface RawQso {
  station_callsign: string;
  call: string;
  band: string;
  gridsquare: string;
  my_gridsquare: string;
  coordinates: { lat: number; lng: number } | null;
  stationCoordinates: { lat: number; lng: number } | null;
}

interface StationPos {
  callsign: string;
  pos: { lat: number; lng: number };
}

interface ContactPos {
  callsign: string;
  band: string;
  gridsquare: string;
  pos: { lat: number; lng: number };
  stationPos: { lat: number; lng: number } | null;
}

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const PURPLE = '#512888';
const GOLD = '#F4C55C';

// Center on Kansas (KSU area)
const DEFAULT_CENTER: [number, number] = [39.0, -96.5];
const DEFAULT_ZOOM = typeof window !== 'undefined' && window.innerWidth <= 768 ? 3 : 4;

export default function QsoMap() {
  const activeContest = useContestStore((s) => s.activeContest);
  const [rawQsos, setRawQsos] = useState<RawQso[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Derive unique stations and contacts from the flat QSO array
  const { stationPositions, contactsWithPos } = useMemo(() => {
    const stationMap = new Map<string, StationPos>();
    const contacts: ContactPos[] = [];

    for (const qso of rawQsos) {
      // Collect unique stations by callsign
      if (qso.stationCoordinates && !stationMap.has(qso.station_callsign)) {
        stationMap.set(qso.station_callsign, {
          callsign: qso.station_callsign,
          pos: qso.stationCoordinates,
        });
      }

      // Collect contacts
      if (qso.coordinates) {
        contacts.push({
          callsign: qso.call,
          band: qso.band,
          gridsquare: qso.gridsquare,
          pos: qso.coordinates,
          stationPos: qso.stationCoordinates || null,
        });
      }
    }

    return {
      stationPositions: Array.from(stationMap.values()),
      contactsWithPos: contacts,
    };
  }, [rawQsos]);

  if (!activeContest) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Select a contest to view the map.</div>
      </div>
    );
  }

  return (
    <div className="map-container-mobile" style={styles.container}>
      {loading && <div style={styles.loading}>Loading map data...</div>}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />

        {/* Great circle paths from station to contacts */}
        {contactsWithPos.map((c, i) => {
          if (!c.stationPos) return null;
          const path = greatCirclePoints(
            c.stationPos.lat,
            c.stationPos.lng,
            c.pos.lat,
            c.pos.lng,
            30
          );
          return (
            <Polyline
              key={`path-${i}`}
              positions={path.map(([lat, lng]) => [lat, lng] as [number, number])}
              pathOptions={{ color: GOLD, weight: 1, opacity: 0.25 }}
            />
          );
        })}

        {/* Contact locations: small gold dots */}
        {contactsWithPos.map((c, i) => (
          <CircleMarker
            key={`contact-${i}`}
            center={[c.pos.lat, c.pos.lng]}
            radius={3}
            pathOptions={{ color: GOLD, fillColor: GOLD, fillOpacity: 0.7, weight: 0 }}
          >
            <Tooltip>{c.callsign} ({c.gridsquare}) {c.band}</Tooltip>
          </CircleMarker>
        ))}

        {/* Station locations: purple circles with callsign tooltip */}
        {stationPositions.map((s, i) => (
          <CircleMarker
            key={`station-${i}`}
            center={[s.pos.lat, s.pos.lng]}
            radius={8}
            pathOptions={{
              color: PURPLE,
              fillColor: PURPLE,
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {s.callsign}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#1a1028',
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
