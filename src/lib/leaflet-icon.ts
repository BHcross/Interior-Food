import L from "leaflet";

// O ícone padrão do Leaflet referencia caminhos relativos que quebram com
// bundlers (Turbopack/Webpack). Apontamos para o CDN oficial em vez de
// tentar importar os assets pelo bundler.
const CDN = "https://unpkg.com/leaflet@1.9.4/dist/images";

export const defaultMarkerIcon = new L.Icon({
  iconUrl: `${CDN}/marker-icon.png`,
  iconRetinaUrl: `${CDN}/marker-icon-2x.png`,
  shadowUrl: `${CDN}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
