import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HOST_ROUTE_MAP: Record<string, string> = {
  "wegkreuze.ch": "/wegkreuze",
  "www.wegkreuze.ch": "/wegkreuze",
  "wegkreuze.de": "/wegkreuze",
  "www.wegkreuze.de": "/wegkreuze",
  "gipfelkreuze.ch": "/gipfelkreuze",
  "www.gipfelkreuze.ch": "/gipfelkreuze",
  "bergkreuze.ch": "/bergkreuze",
  "www.bergkreuze.ch": "/bergkreuze",
  "bergkreuze.de": "/bergkreuze",
  "www.bergkreuze.de": "/bergkreuze",
};

export function HostRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const target = HOST_ROUTE_MAP[host];
    if (target && window.location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [navigate]);

  return null;
}
