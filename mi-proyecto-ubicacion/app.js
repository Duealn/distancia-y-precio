let map;
let directionsService;
let directionsRenderer;
let rutasCercanas = [];
let rutaActualIndex = 0;
const costoPorKm = 0.50; // la money
let userCircle;

const stores = [
  { id: 1, name: "Metro", lat: -0.19445, lng: -78.492803 },
  { id: 2, name: "Tienda", lat: -0.1200, lng: -78.4500 },
  { id: 3, name: "Camari", lat: -0.254078, lng: -78.487358 },
  { id: 4, name: "Tatiana Godos", lat: -0.194739, lng: -78.491096 },
  { id: 5, name: "Supermercado", lat: -0.1901, lng: -78.4823 }
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -0.19, lng: -78.49 },
    zoom: 13,
    mapId: "4ef31f1f147b4e9ee8db016b"
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

async function getDrivingDistance(origin, destination) {
  const request = {
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === "OK") {
        const distanciaKm = result.routes[0].legs[0].distance.value / 1000;
        resolve({ distanciaKm, ruta: result });
      } else {
        reject(status);
      }
    });
  });
}

// crear marcador
function crearMarcador(tienda, loc, distanciaKm) {
  const costo = Math.ceil(distanciaKm * costoPorKm); // redondeo al entero superior

  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: loc,
    title: tienda.name,
    content: `<div style="padding:5px;background:#fff;border:1px solid #1976d2;border-radius:5px;">
                <strong>${tienda.name}</strong><br>
                Distancia: ${distanciaKm.toFixed(2)} km<br>
                Costo: $${costo}</div>`
  });

  return marker;
}

// Botón buscar tiendas cercanas
document.getElementById("btn").onclick = async () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta ubicación");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const userLoc = new google.maps.LatLng(userLat, userLng);

    map.setCenter(userLoc);

    // Círculo de 5 km
    if (userCircle) userCircle.setMap(null);
    userCircle = new google.maps.Circle({
      strokeColor: "#1976d2",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#1976d2",
      fillOpacity: 0.2,
      map,
      center: userLoc,
      radius: 5000 // 5 km
    });

    // Marcador usuario
    new google.maps.marker.AdvancedMarkerElement({
      map,
      position: userLoc,
      title: "Tú estás aquí"
    });

    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    rutasCercanas = [];

    for (const tienda of stores) {
      const tiendaLoc = new google.maps.LatLng(tienda.lat, tienda.lng);
      try {
        const { distanciaKm, ruta } = await getDrivingDistance(userLoc, tiendaLoc);

        if (distanciaKm <= 30) {
          rutasCercanas.push({ tienda, distanciaKm, ruta });
          crearMarcador(tienda, tiendaLoc, distanciaKm);
        }

      } catch (err) {
        console.error("Error obteniendo la ruta:", err);
      }
    }

    if (rutasCercanas.length === 0) {
      lista.innerHTML = "<li>No hay tiendas dentro de 5 km</li>";
    } else {
      rutasCercanas.sort((a, b) => a.distanciaKm - b.distanciaKm);

      lista.innerHTML = rutasCercanas
        .map(r => {
          const costo = Math.ceil(r.distanciaKm * costoPorKm); // redondeo al entero superior
          return `<li>${r.tienda.name} — ${r.distanciaKm.toFixed(2)} km — $${costo}</li>`;
        })
        .join("");

      rutaActualIndex = 0;
      directionsRenderer.setDirections(rutasCercanas[0].ruta);
    }
  });
};

// Botón cambiar ruta
document.getElementById("btnCambiarRuta").onclick = () => {
  if (rutasCercanas.length === 0) {
    alert("Primero busca las tiendas cercanas.");
    return;
  }

  rutaActualIndex = (rutaActualIndex + 1) % rutasCercanas.length;
  directionsRenderer.setDirections(rutasCercanas[rutaActualIndex].ruta);

  const destino = rutasCercanas[rutaActualIndex].tienda;
  map.setCenter({ lat: destino.lat, lng: destino.lng });
};
