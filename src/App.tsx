import { useEffect, useState } from 'react'
import './App.css'
import { Box, Flex, Text } from '@chakra-ui/react'
import MapView from './map'
import axios from 'axios'
import Form from './form'
import Logs from './logs'
import TripForm from './trip'

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 40 40" role="img" aria-labelledby="userIconTitle">
    <title id="userIconTitle">User profile</title>

    <circle cx="20" cy="20" r="20" fill="#E9ECEF"/>

    <circle cx="20" cy="14" r="5.5" fill="#6B7280"/>
    <path d="M8 31c0-4.418 5.373-8 12-8s12 3.582 12 8v1H8v-1z" fill="#6B7280"/>
  </svg>
)

const App = () => {
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);
  const [city, setCity] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [routePoints, setRoutePoints] = useState<{pickup?: any, dropoff?: any}>({})
  const [totalDuration, setTotalDuration] = useState<{ hrs: number, mins: number } | null>(null);
  const [tripStarted, setTripStarted] = useState(false)

  useEffect(() => {
    const savedTrip = localStorage.getItem("tripContext")
    if (savedTrip) setTripStarted(true)
  }, [])

  useEffect(() => {
    const getLocation = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              setLat(latitude)
              setLong(longitude)
              console.log("GPS Location:", latitude, longitude)

              // check using open street map (to extract location string details)
              try {
                const geoRes = await axios.get(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                )
                const cityName =
                  geoRes.data.address.city ||
                  geoRes.data.address.town ||
                  geoRes.data.address.village ||
                  geoRes.data.address.state
                setCity(cityName)
                console.log("City:", cityName)
              } catch (geoErr) {
                console.warn("Reverse geocoding failed:", geoErr)
              }
            },
            async (error) => {
              console.warn("GPS error:", error.message)
              // Fallback to IP-based lookup if gps error
              try {
                const ipRes = await axios.get("https://api.ipify.org?format=json")
                const ip = ipRes.data.ip
                const ipGeo = await axios.get(`http://ip-api.com/json/${ip}`)
                setLat(ipGeo.data.lat)
                setLong(ipGeo.data.lon)
                setCity(ipGeo.data.city)
                console.log("Fallback IP location:", ipGeo.data)
              } catch (ipErr) {
                console.error("IP-based location failed:", ipErr)
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        } else {
          console.warn("Geolocation not supported, falling back to IP")
          const ipRes = await axios.get("https://api.ipify.org?format=json")
          const ip = ipRes.data.ip
          const ipGeo = await axios.get(`http://ip-api.com/json/${ip}`)
          setLat(ipGeo.data.lat)
          setLong(ipGeo.data.lon)
          setCity(ipGeo.data.city)
          console.log("Fallback IP location:", ipGeo.data)
        }
      } catch (err) {
        console.error("Failed to fetch location:", err)
      }
    }

    getLocation()
  }, [])

  return (
    <Box>
      <Flex className='j-between a-center pointer'>
        <Text className='text-primary bold'>E.L.D</Text>
        <ProfileIcon/>
      </Flex>

      <Box mt={7} p={7} className='white-bg border-10'>
        <Flex gap={10}>
          <Box w="70%">
            {!tripStarted ? (
              <Form
                currentLocation={city}
                currentCoords={{ lat, lon: long }}
                onLocationsChange={(pickup, dropoff) =>
                  setRoutePoints((prev) => ({
                    pickup: pickup ?? prev.pickup,
                    dropoff: dropoff ?? prev.dropoff,
                  }))
                }
                totalDuration={totalDuration || { hrs: 0, mins: 0 }}
                onTripStart={() => setTripStarted(true)}
              />
            ) : (
              <TripForm onEndTrip={() => {
                localStorage.removeItem("tripContext")
                setTripStarted(false)
              }} />
            )}
          </Box>

          <Box w="100%">
            <MapView lat={lat} long={long} routePoints={routePoints} />
            <Logs onDurationCalculated={setTotalDuration}/>
          </Box>
        </Flex>
      </Box>
    </Box>
  )
}

export default App

