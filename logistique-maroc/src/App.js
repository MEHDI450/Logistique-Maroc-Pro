import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import logoImg from "./logo.png"; // IMPORTATION DU LOGO ICI

// --- CONFIGURATION LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Icone Camion SVG
const truckIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c" width="48px" height="48px">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  `),
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

// --- BASE DE DONNÉES ÉTENDUE (VILLES MAROC) ---
const CITIES_DB = [
  { name: "Tanger", lat: 35.7595, lon: -5.8340 },
  { name: "Tétouan", lat: 35.5755, lon: -5.3626 },
  { name: "Al Hoceima", lat: 35.2517, lon: -3.9372 },
  { name: "Nador", lat: 35.1681, lon: -2.9335 },
  { name: "Oujda", lat: 34.6814, lon: -1.9086 },
  { name: "Berkane", lat: 34.9200, lon: -2.3200 },
  { name: "Fès", lat: 34.0181, lon: -5.0078 },
  { name: "Meknès", lat: 33.8950, lon: -5.5547 },
  { name: "Rabat", lat: 34.0209, lon: -6.8416 },
  { name: "Salé", lat: 34.0333, lon: -6.8167 },
  { name: "Kénitra", lat: 34.2610, lon: -6.5802 },
  { name: "Casablanca", lat: 33.5731, lon: -7.5898 },
  { name: "Mohammedia", lat: 33.6866, lon: -7.3821 },
  { name: "El Jadida", lat: 33.2568, lon: -8.5076 },
  { name: "Settat", lat: 33.0010, lon: -7.6166 },
  { name: "Khouribga", lat: 32.8833, lon: -6.9167 },
  { name: "Beni Mellal", lat: 32.3373, lon: -6.3498 },
  { name: "Marrakech", lat: 31.6295, lon: -7.9811 },
  { name: "Safi", lat: 32.2994, lon: -9.2372 },
  { name: "Essaouira", lat: 31.5085, lon: -9.7595 },
  { name: "Agadir", lat: 30.4278, lon: -9.5981 },
  { name: "Taroudant", lat: 30.4703, lon: -8.8770 },
  { name: "Tiznit", lat: 29.6974, lon: -9.7316 },
  { name: "Guelmim", lat: 28.9870, lon: -10.0574 },
  { name: "Tan-Tan", lat: 28.4380, lon: -11.1032 },
  { name: "Laayoune", lat: 27.1253, lon: -13.1625 },
  { name: "Dakhla", lat: 23.6848, lon: -15.9570 },
  { name: "Errachidia", lat: 31.9314, lon: -4.4245 },
  { name: "Ouarzazate", lat: 30.9335, lon: -6.9370 },
  { name: "Zagora", lat: 30.3324, lon: -5.8384 },
  { name: "Taza", lat: 34.2182, lon: -4.0104 },
  { name: "Ifrane", lat: 33.5225, lon: -5.1052 },
  { name: "Khenifra", lat: 32.9358, lon: -5.6696 },
  { name: "Larache", lat: 35.1932, lon: -6.1557 },
  { name: "Ksar El Kebir", lat: 35.0017, lon: -5.9053 },
  { name: "Sefrou", lat: 33.8340, lon: -4.8281 },
  { name: "Azrou", lat: 33.4416, lon: -5.2247 },
  { name: "Midelt", lat: 32.6852, lon: -4.7451 },
  { name: "Tinghir", lat: 31.5151, lon: -5.5342 },
  { name: "Chefchaouen", lat: 35.1688, lon: -5.2636 }
].sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function MovingTruck({ routePath }) {
  const [position, setPosition] = useState(null);
  const requestRef = useRef();
  const indexRef = useRef(0);

  useEffect(() => {
    if (!routePath || routePath.length < 2) return;
    indexRef.current = 0;
    const animate = () => {
      indexRef.current = (indexRef.current + 3); // Vitesse
      if (indexRef.current < routePath.length) {
        setPosition(routePath[Math.floor(indexRef.current)]);
        requestRef.current = requestAnimationFrame(animate);
      } else {
        indexRef.current = 0;
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [routePath]);

  if (!position) return null;
  return <Marker position={position} icon={truckIcon} zIndexOffset={1000} />;
}

function LogisticsApp() {
  const [selectedCities, setSelectedCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Pour la recherche
  const [fullRoadGeometry, setFullRoadGeometry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filtrer les villes selon la recherche
  const displayedCities = CITIES_DB.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCity = (city) => {
    if (selectedCities.find((c) => c.name === city.name)) {
      setSelectedCities(selectedCities.filter((c) => c.name !== city.name));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
    setFullRoadGeometry([]);
    setShowReport(false);
  };

  const solveTSP = (cities) => {
    let unvisited = [...cities];
    let path = [unvisited.shift()];
    while (unvisited.length > 0) {
      let current = path[path.length - 1];
      let nearestIdx = 0;
      let minDst = Infinity;
      unvisited.forEach((c, i) => {
        let d = haversine(current.lat, current.lon, c.lat, c.lon);
        if (d < minDst) { minDst = d; nearestIdx = i; }
      });
      path.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    path.push(path[0]);
    return path;
  };

  const fetchRealRoad = async (sortedCities) => {
    setLoading(true);
    let allCoordinates = [];
    let totalDistance = 0;
    let reportLines = [];

    try {
      for (let i = 0; i < sortedCities.length - 1; i++) {
        const start = sortedCities[i];
        const end = sortedCities[i+1];
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
            const routeData = data.routes[0];
            const segmentCoords = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            allCoordinates = [...allCoordinates, ...segmentCoords];
            const distKm = (routeData.distance / 1000).toFixed(1);
            totalDistance += parseFloat(distKm);
            reportLines.push(`${i+1}. ${start.name} -> ${end.name} : ${distKm} km`);
        }
      }
      setFullRoadGeometry(allCoordinates);
      setReportData({ start: sortedCities[0].name, lines: reportLines, total: totalDistance.toFixed(1) });
      setShowReport(true);
    } catch (error) {
      alert("Erreur de connexion internet pour le calcul de route.");
    }
    setLoading(false);
  };

  const handleCalculate = () => {
    if (selectedCities.length < 2) return alert("Sélectionnez au moins 2 villes");
    const sortedPath = solveTSP(selectedCities);
    fetchRealRoad(sortedPath);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR AVEC LOGO ET RECHERCHE */}
      <div className="sidebar">
        
        {/* LOGO */}
        <div className="logo-container">
          <img src={logoImg} alt="Logo" className="app-logo" />
        </div>

        <h1 className="title">LOGISTIQUE MAROC</h1>
        
        {/* BARRE DE RECHERCHE */}
        <input 
          type="text" 
          placeholder="Rechercher une ville..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <h3>Villes disponibles :</h3>
        <div className="city-list-container">
            <ul className="city-list">
            {displayedCities.map((city, i) => {
                const isSelected = selectedCities.find(c => c.name === city.name);
                return (
                <li 
                    key={i} 
                    onClick={() => toggleCity(city)}
                    className={isSelected ? "selected-city" : ""}
                >
                    {city.name} {isSelected && "✅"}
                </li>
                )
            })}
            </ul>
        </div>

        <div className="selected-count">
            {selectedCities.length} ville(s) sélectionnée(s)
        </div>

        <button className="btn btn-reset" onClick={() => { setSelectedCities([]); setFullRoadGeometry([]); }}>
            TOUT EFFACER
        </button>
        <button className="btn btn-calc" onClick={handleCalculate} disabled={loading}>
          {loading ? "Calcul en cours..." : "LANCER ITINÉRAIRE"}
        </button>
      </div>

      {/* CARTE */}
      <div className="map-wrapper">
        <MapContainer center={[31.7917, -7.0926]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* AFFICHER TOUTES LES VILLES (FILTRÉES) */}
          {displayedCities.map((city, idx) => {
            const isSelected = selectedCities.find((c) => c.name === city.name);
            return (
              <CircleMarker
                key={idx}
                center={[city.lat, city.lon]}
                pathOptions={{ color: "white", fillColor: isSelected ? "#e74c3c" : "#34495e", fillOpacity: 0.8, weight: 1 }}
                radius={isSelected ? 8 : 4}
                eventHandlers={{ click: () => toggleCity(city) }}
              >
                <Popup>{city.name}</Popup>
              </CircleMarker>
            );
          })}

          {fullRoadGeometry.length > 0 && (
            <>
              <Polyline positions={fullRoadGeometry} pathOptions={{ color: "#3498db", weight: 5 }} />
              <MovingTruck routePath={fullRoadGeometry} />
            </>
          )}
        </MapContainer>
      </div>

      {/* POPUP RAPPORT */}
      {showReport && reportData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>FEUILLE DE ROUTE</h2>
            <hr />
            <div className="report-list">
              {reportData.lines.map((line, idx) => <div key={idx} style={{padding: "5px", borderBottom:"1px solid #eee"}}>{line}</div>)}
            </div>
            <div style={{marginTop: "10px", fontWeight:"bold", fontSize:"18px", color: "#e74c3c"}}>
                TOTAL : {reportData.total} km
            </div>
            <button className="btn btn-close" onClick={() => setShowReport(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogisticsApp;