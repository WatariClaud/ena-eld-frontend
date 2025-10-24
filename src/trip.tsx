import { Box, Flex, Button, Text, Input } from "@chakra-ui/react"
import { useState } from "react"
import { logs } from "./api/api"
import axios from "axios"
import { toaster } from "./components/ui/toaster"

interface TripFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEndTrip: any
}
const TripForm = ({ onEndTrip }: TripFormProps) => {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tripContext = JSON.parse(localStorage.getItem("tripContext") || "{}")

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)

    let remarks:string = ""
    const remarksInput = document.querySelector("#remarks") as HTMLInputElement
    if(remarksInput) remarks = remarksInput.value;
    const payload = {
      status: newStatus,
      location: tripContext.currentLocation || "Unknown",
      timestamp: new Date().toISOString(),
      remarks
    }

    try {
      const sessionUser = localStorage.getItem("session_user") || "{}";
      const token = JSON.parse(sessionUser).token;
      const response = await axios.post(`${logs}update-status/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      console.log(response)
      toaster.create({
        description: "Status update success",
        type: "success",
        closable: true,
        duration: 5000,
      });
      if (!response.data) throw new Error("Failed to log status")
      setStatus(newStatus)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const response = error.response?.data;
      console.log(response);
      if (response?.error) {
        const description =
          typeof response.details === "object"
            ? Object.values(response.details).join(", ")
            : response.details ?? response.error;

        toaster.create({
          description,
          type: "error",
          closable: true,
          duration: 5000,
        });
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Text fontSize="xl" mb={4}>
        Active Trip
      </Text>
      <Text fontSize="xl" mb={4}>
        Current Location — {tripContext.currentLocation}
      </Text>
      <Text fontSize="xl" mb={4}>
        Pickup Location — {tripContext.pickupLocation}
      </Text>
      <Text fontSize="xl" mb={4}>
        Dropoff Location — {tripContext.dropoffLocation}
      </Text>

      <Input id="remarks" w={500} mb={7} placeholder="Enter remarks"/>
      <Flex gap={4} wrap="wrap">
        {["OFF", "ON", "SB", "DR"].map((s) => (
          <Button
            key={s}
            onClick={() => handleStatusChange(s)}
            variant={status === s ? "solid" : "outline"}
            loading={loading && status === s}
          >
            {s}
          </Button>
        ))}
      </Flex>

      <Button mt={6} colorScheme="red" onClick={onEndTrip} className="blue-bg white-color primary-button border-7" w={500}>
        End Trip
      </Button>
    </Box>
  )
}


export default TripForm