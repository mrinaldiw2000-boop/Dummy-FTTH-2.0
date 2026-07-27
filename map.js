/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - LEAFLET GIS MAP MODULE
 * Renders Leaflet.js interactive map with color-coded markers for FAT nodes.
 * Strictly uses Tikor FAT coordinates, City, Area, MITRA, USED/TOTAL ports.
 */

let ftthMap = null;
let markerLayers = {
  fat: null,
  completed: null,
  inProgress: null
};

document.addEventListener("DOMContentLoaded", () => {
  if (typeof L === "undefined") return;

  const mapCanvas = document.getElementById("map-canvas");
  if (!mapCanvas) return;

  const dataset = getStoredProjectData();
  initGISMap(dataset);
});

function initGISMap(data) {
  ftthMap = L.map("map-canvas").setView([-6.2088, 106.8456], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(ftthMap);

  markerLayers.fat = L.layerGroup().addTo(ftthMap);
  markerLayers.completed = L.layerGroup().addTo(ftthMap);
  markerLayers.inProgress = L.layerGroup().addTo(ftthMap);

  renderGISMarkers(data);
}

function createCustomPin(colorHex, iconClass) {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${colorHex};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <i class="${iconClass}" style="font-size: 14px;"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
}

function renderGISMarkers(data) {
  Object.values(markerLayers).forEach(layer => layer.clearLayers());

  data.forEach(item => {
    let lat = item.Lat || -6.2;
    let lng = item.Lng || 106.8;

    if (item["Tikor FAT"] && item["Tikor FAT"].includes(",")) {
      const parts = item["Tikor FAT"].split(",");
      lat = parseFloat(parts[0].trim()) || lat;
      lng = parseFloat(parts[1].trim()) || lng;
    }

    const isCompleted = (item.Action || "").toLowerCase().includes("complete") || (item.Status || "").toLowerCase().includes("complete");
    const color = isCompleted ? "#28A745" : "#FF7A00";

    const marker = L.marker([lat, lng], {
      icon: createCustomPin(color, "fas fa-sitemap")
    }).bindPopup(createPopupHTML(item));

    markerLayers.fat.addLayer(marker);
    if (isCompleted) {
      markerLayers.completed.addLayer(marker);
    } else {
      markerLayers.inProgress.addLayer(marker);
    }
  });
}

function createPopupHTML(item) {
  const total = item.TOTAL || item.TargetHP || 16;
  const used = item.USED || item.ActualHP || 0;
  const idle = item.IDDLE || (total - used);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  return `
    <div style="font-family: sans-serif; min-width: 210px;">
      <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #FF7A00;">FTTH FAT Node</div>
      <div style="font-size: 1.05rem; font-weight: 800; color: #0F3D91; margin-bottom: 4px;">${item.FAT}</div>
      <div style="font-size: 0.82rem; color: #666; margin-bottom: 8px;"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${item.City} - ${item.Area}</div>
      <div style="border-top: 1px solid #eee; padding-top: 6px; font-size: 0.8rem; line-height: 1.6;">
        <div><strong>Tikor FAT:</strong> ${item["Tikor FAT"]}</div>
        <div><strong>MITRA:</strong> ${item.MITRA || item.Vendor}</div>
        <div><strong>Date RFS:</strong> ${item["Date RFS"] || item.Date}</div>
        <div><strong>Action:</strong> <span style="font-weight: 700; color: #0F3D91;">${item.Action || item.Status}</span></div>
        <div style="margin-top: 4px; padding: 4px 8px; background: #f8f9fa; border-radius: 6px; display: flex; justify-content: space-between;">
          <span>USED: <strong style="color: #28A745;">${used}</strong></span>
          <span>IDLE: <strong>${idle}</strong></span>
          <span>TOTAL: <strong>${total}</strong></span>
        </div>
        <div style="margin-top: 4px;"><strong>Port Utilization:</strong> <span style="color: #28A745; font-weight: 700;">${pct}%</span></div>
      </div>
    </div>
  `;
}
