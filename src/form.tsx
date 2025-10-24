/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import {
  Field,
  Input,
  Button,
  Stack,
  HStack,
  Slider,
} from "@chakra-ui/react"
import { toaster } from "./components/ui/toaster"

type FormValues = {
  currentLocation: string
  pickupLocation: string
  dropoffLocation: string
  currentCycleUsed: number | string
}

interface FormProps {
  currentLocation?: string
  currentCoords?: { lat: number; lon: number }
  onLocationsChange?: (pickup: [number, number] | null, dropoff: [number, number] | null) => void,
  totalDuration: { hrs: number, mins: number }
  onTripStart?: () => void
}

const Form = ({
  currentLocation = "",
  currentCoords,
  onLocationsChange,
  totalDuration,
  onTripStart
}: FormProps) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      currentCycleUsed: 0,
      currentLocation,
    },
  })

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([])
  const [cycleUsed, setCycleUsed] = useState('')

  const onSubmit = handleSubmit((data) => {
    data.currentCycleUsed = data.currentCycleUsed || cycleUsed
    
    localStorage.setItem("tripContext", JSON.stringify({
      ...data,
      startedAt: new Date().toISOString()
    }))
    onTripStart?.()
  })

  useEffect(() => {
    if (currentLocation) setValue("currentLocation", currentLocation)
  }, [currentLocation, setValue])

  useEffect(() => {
    console.clear()
    console.log(totalDuration)
  }, [totalDuration])
  const fetchSuggestions = async (query: string, setter: Function) => {
    if (query.length < 3) return setter([]) // ignore short queries

    const baseUrl = "https://nominatim.openstreetmap.org/search"
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
      ...(currentCoords
        ? { viewbox: `${currentCoords.lon - 0.1},${currentCoords.lat + 0.1},${currentCoords.lon + 0.1},${currentCoords.lat - 0.1}`, bounded: "1" }
        : {}),
    })

    const res = await fetch(`${baseUrl}?${params}`)
    const data = await res.json()
    setter(data)
  }

  // Haversine formula (distance in km - used gpt for this :D)
  const getDistanceKm =(
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number }
  ) => {
    const R = 6371 // km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
    const dLon = ((point2.lon - point1.lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleSuggestionSelect = (
    setter: Function,
    field: "pickupLocation" | "dropoffLocation",
    name: string,
    lat?: number,
    lon?: number
  ) => {
    setValue(field, name)
    setter([])

    if (onLocationsChange && lat && lon) {
      const coords: [number, number] = [lat, lon]

      const destinationCoords = { lat, lon }

      if (field === "pickupLocation") onLocationsChange(coords, null)
      else onLocationsChange(null, coords)

      if (currentCoords) {
        console.clear()
        const avgSpeedKmh = 50
        const distance = getDistanceKm(currentCoords, destinationCoords)
        const timeHours = distance / avgSpeedKmh
        const timeMinutes = Math.round(timeHours * 60)
        toaster.create({
          description: `It will take ${timeMinutes} minutes at avg speed of ${avgSpeedKmh} km/h.`,
          type: "info",
          closable: true,
          duration: 5000,
        })
      }
    }
  }
  return (
    <form onSubmit={onSubmit}>
      <Stack gap="4" align="flex-start" maxW="sm">
        <Field.Root invalid={!!errors.currentLocation}>
          <Field.Label>Current Location</Field.Label>
          <Input
            {...register("currentLocation", { required: "Required" })}
            readOnly
          />
          <Field.ErrorText>{errors.currentLocation?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.pickupLocation} style={{ position: "relative" }}>
          <Field.Label>Pickup Location</Field.Label>
          <Input
            {...register("pickupLocation", { required: "Required" })}
            onChange={(e) => fetchSuggestions(e.target.value, setPickupSuggestions)}
            autoComplete="off"
          />
          {pickupSuggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 10,
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginTop: "4px",
                listStyle: "none",
                padding: "4px",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              {pickupSuggestions.map((place) => (
                <li
                  key={place.place_id}
                  onClick={() =>
                    handleSuggestionSelect(
                      setPickupSuggestions,
                      "pickupLocation",
                      place.display_name,
                      parseFloat(place.lat),
                      parseFloat(place.lon)
                    )
                  }
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f1f1",
                  }}
                >
                  {place.display_name}
                </li>
              ))}

            </ul>
          )}
          <Field.ErrorText>{errors.pickupLocation?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.dropoffLocation} style={{ position: "relative" }}>
          <Field.Label>Dropoff Location</Field.Label>
          <Input
            {...register("dropoffLocation", { required: "Required" })}
            onChange={(e) => fetchSuggestions(e.target.value, setDropoffSuggestions)}
            autoComplete="off"
          />
          {dropoffSuggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 10,
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginTop: "4px",
                listStyle: "none",
                padding: "4px",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              {dropoffSuggestions.map((place) => (
                <li
                  key={place.place_id}
                  onClick={() =>
                    handleSuggestionSelect(
                      setDropoffSuggestions,
                      "dropoffLocation",
                      place.display_name,
                      parseFloat(place.lat),
                      parseFloat(place.lon)
                    )
                  }
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f1f1",
                  }}
                >
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
          <Field.ErrorText>{errors.dropoffLocation?.message}</Field.ErrorText>
        </Field.Root>

        <Controller
          name="currentCycleUsed"
          control={control}
          render={() => {
            const maxHours = 80;

            const totalHours = totalDuration
              ? totalDuration.hrs + totalDuration.mins / 60
              : 0;

            const totalMinutes = Math.round(totalHours * 60);
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            const percentage = ((totalHours / maxHours) * 100).toFixed(1);
            setCycleUsed(`${hrs} ${mins}`)
            return (
              <Slider.Root
                width="100%"
                min={0}
                max={maxHours}
                step={0.1}
                value={[Number(percentage)]}
                onValueChange={() => {}}
                mt={7}
                mb={4}
                pointerEvents="none"
              >
                <HStack justify="space-between">
                  <Slider.Label>Current Cycle Used</Slider.Label>
                  <Slider.ValueText>
                    {hrs} hrs {mins} mins ({percentage}%)
                  </Slider.ValueText>
                </HStack>

                <Slider.Control>
                  <Slider.Track bg={"var(--white-primary-color)"}>
                    <Slider.Range bg={"var(--blue-primary-color)"} />
                  </Slider.Track>
                  <Slider.Thumbs borderColor="var(--blue-primary-color)" />
                </Slider.Control>
              </Slider.Root>
            );
          }}
        />
        <Button
          type="submit"
          className="blue-bg white-color primary-button border-7"
          mt={4}
        >
          Submit
        </Button>
      </Stack>
    </form>
  )
}

export default Form
