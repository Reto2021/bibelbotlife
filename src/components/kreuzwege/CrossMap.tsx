import { useEffect, useMemo, useState } from "react";
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
}

export default function CrossMap({
  posts = [],
  center = [46.8, 8.23],
  zoom = 7,
  height = "70vh",
  pickMode = false,
  picked = null,
  onPick,
}: Props) {
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickMode && onPick && <ClickPicker onPick={onPick} />}
        {picked && <Marker position={[picked.lat, picked.lng]} icon={icon} />}
        {withCoords.map((p) => (
          <Marker key={p.id} position={[p.lat as number, p.lng as number]} icon={icon}>
            <Popup>
              <div className="space-y-1">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={`Kreuz bei ${p.place_label}`}
                    className="h-24 w-full rounded object-cover"
                  />
                )}
                <strong>{p.place_label}</strong>
                {p.story && <p className="text-xs">{p.story.slice(0, 140)}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
