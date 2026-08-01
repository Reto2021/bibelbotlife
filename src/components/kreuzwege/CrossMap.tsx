import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { CrossPost } from "@/hooks/use-cross-posts";

const icon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  posts?: CrossPost[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  pickMode?: boolean;
  picked?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  /** When set, clicking a marker calls this instead of showing the popup. */
  onMarkerClick?: (post: CrossPost) => void;
}

/** Keeps the map view in sync when center/zoom change from outside. */
function ViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}

export default function CrossMap({
  posts = [],
  center = [46.8, 8.23],
  zoom = 7,
  height = "70vh",
  pickMode = false,
  picked = null,
  onPick,
  onMarkerClick,
}: Props) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const withCoords = useMemo(
    () => posts.filter((p) => p.lat != null && p.lng != null),
    [posts],
  );

  if (!ready) return <div style={{ height }} className="rounded-xl bg-muted/40" />;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <ViewSync center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickMode && onPick && <ClickPicker onPick={onPick} />}
        {picked && <Marker position={[picked.lat, picked.lng]} icon={icon} />}
        {withCoords.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat as number, p.lng as number]}
            icon={icon}
            eventHandlers={onMarkerClick ? { click: () => onMarkerClick(p) } : undefined}
          >
            {!onMarkerClick && (
              <Popup>
                <div className="space-y-1">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={t("crossways.card.imageAlt", { place: p.place_label })}
                      className="h-24 w-full rounded object-cover"
                    />
                  )}
                  <strong>{p.place_label}</strong>
                  {p.story && <p className="text-xs">{p.story.slice(0, 140)}</p>}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
