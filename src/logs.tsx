/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, CloseButton, Dialog, HStack, Link, Portal, Table, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { toaster } from "./components/ui/toaster";
import axios from "axios";
import { logs } from "./api/api";
import LogVisualizer from "./log-visual";

const Logs = ({ onDurationCalculated }: { onDurationCalculated: (val: { hrs: number, mins: number }) => void }) => {
  const [logsData, setLogsData] = useState([])
 useEffect(() => {
    const fetchLogs = async () => {
      try {
        const sessionUser = localStorage.getItem("session_user") || "{}";
        const token = JSON.parse(sessionUser).token;
        const response = await axios.get(logs, {
          headers: { Authorization: `Token ${token}` },
        });
        setLogsData(response.data);
        console.clear()
        console.log({ fetchedLogs: response.data });
      } catch (error: any) {
        const response = error.response?.data;
        console.log(response);
        if (response?.error)
          toaster.create({
            description: response.error,
            type: "error",
            closable: true,
            duration: 5000,
          });
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
  const totalDurationForAllLogs = logsData.reduce((sum, log: any) => {
      if (!log.status_changes || log.status_changes.length < 2) return sum; // skip invalid logs

      const times = log.status_changes.map(
        (s: { timestamp: string }) => new Date(s.timestamp)
      );

      const start = times[0]?.getTime();
      const end = times[times.length - 1]?.getTime();

      if (isNaN(start) || isNaN(end)) {
        console.warn("Invalid start/end in log:", log.id);
        return sum;
      }

      return sum + (end - start);
    }, 0);

    const totalMins = Math.floor(totalDurationForAllLogs / 60000);
    const totalHrs = Math.floor(totalMins / 60);
    const remMins = totalMins % 60;

    console.log(`Total duration: ${totalHrs} hrs ${remMins} mins`);

    onDurationCalculated({ hrs: totalHrs, mins: remMins });
  }, [logsData])

  return (
    <Box>
      <Text className="bold" mt={7}>ELD Logs</Text>
      <Table.ScrollArea borderWidth="1px" rounded="md" height="220px" px={4}>
      <Table.Root size="sm" stickyHeader>
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader>ID</Table.ColumnHeader>
            <Table.ColumnHeader>Date</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Log Updates</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {logsData.map((log: any, index: number) => (
            <Table.Row key={index}>
              <Table.Cell>{log.id}</Table.Cell>
              <Table.Cell>{log.date}</Table.Cell>
              <Table.Cell textAlign="end">
                <HStack wrap="wrap" gap="4" justifyContent="flex-end">
                  <Dialog.Root
                    key="center"
                    placement="center"
                    motionPreset="slide-in-bottom"
                    size="lg"
                  >
                    <Dialog.Trigger asChild>
                      <Link
                        className="border-7"
                        color="var(--blue-primary-color)"
                        bg="var(--blue-primary-color-500)"
                        px={4}
                        onClick={() => {
                          console.log(log)
                        }}
                      >
                        View
                      </Link>
                    </Dialog.Trigger>
                    <Portal>
                      <Dialog.Backdrop />
                      <Dialog.Positioner>
                        <Dialog.Content>
                          <Dialog.Header>
                            <Dialog.Title fontSize={14}>Day logs for #{log.id} on date {log.date}</Dialog.Title>
                          </Dialog.Header>
                          <Dialog.Body>
                           <LogVisualizer log={log} key={index}/>
                          </Dialog.Body>
                          <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button>Save</Button>
                          </Dialog.Footer>
                          <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                          </Dialog.CloseTrigger>
                        </Dialog.Content>
                      </Dialog.Positioner>
                    </Portal>
                  </Dialog.Root>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
    </Box>
  )
}

export default Logs