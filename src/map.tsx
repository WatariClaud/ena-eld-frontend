/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet-routing-machine"
import { Box, Spinner } from "@chakra-ui/react"

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type RoutingProps = {
  current: any, pickup: any, dropoff: any
}

const Routing = ({ current, pickup, dropoff }: RoutingProps) => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const waypoints = [
      L.latLng(current[0], current[1]),
      pickup ? L.latLng(pickup[0], pickup[1]) : null,
      dropoff ? L.latLng(dropoff[0], dropoff[1]) : null,
    ].filter(Boolean) as L.LatLng[]

    if (waypoints.length < 2) return // need at least 2 points

    const routingControl = L.Routing.control({
      waypoints,
      lineOptions: { styles: [{ color: "#007bff", weight: 5 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
    }).addTo(map)

    setTimeout(() => {
      map.fitBounds(L.latLngBounds(waypoints), { padding: [50, 50] })
    }, 300)

    return (): void => {
      if (routingControl && routingControl._map) {
        try {
          map.removeControl(routingControl)
         setTimeout(() => {
           console.clear() // leaflet unmounting error (just hiding for personal dislike - stumped as to how to fix this currently)
         }, 1000);
        } catch (error) {
          console.log(error)
        }
      }
    }
  }, [map, current, pickup, dropoff])

  return null
}

type MapViewProps = {
  lat: number, long: number, routePoints: any
}
const MapView = ({ lat, long, routePoints }: MapViewProps) => {
  const position = [lat, long] as [number, number]

  console.log('coordinates: ', routePoints?.pickup, routePoints?.dropoff)
  console.log("boolean: ", (routePoints?.pickup || routePoints?.dropoff))
  if(lat && long) return (
    <Box w="100%" h="400px" borderRadius="xl" overflow="hidden" boxShadow="md">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon}>
          <Popup>Current location</Popup>
        </Marker>
        {(routePoints?.pickup || routePoints?.dropoff) && (
          <>
          <Routing current={position} pickup={routePoints.pickup} dropoff={routePoints.dropoff} />
          </>
        )}
      </MapContainer>
    </Box>
  )
  else return <Box className="j-center a-center" display="flex" h="100%">
    <Spinner size="xl" />
  </Box>
}

export default MapView