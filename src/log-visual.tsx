/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Converts HOS log status changes into a sequence of coordinates for an SVG path.
 * REVISED MODIFICATION: Correctly draws the assumed 'OFF' status from 00:00,
 * and then ensures the loop starts the graph path by transitioning to the first logged status.
 * @param {Array<Object>} statusChanges - The log.status_changes array.
 * @param {number} svgWidth - The total width of the SVG container (e.g., 1000).
 * @param {number} rowHeight - The vertical distance between the center-lines of each status row.
 * @returns {string} The SVG path 'd' attribute string.
 */
const generateHosPath = (statusChanges: string | any[], svgWidth: number, rowHeight: number = 30): string => {
    if (!statusChanges || statusChanges.length === 0) {
        return ""; // Return empty path if no data
    }

    // 1. Define Y-Coordinates
    const STATUS_MAP = {
        'OFF': rowHeight * 0.5, 
        'SB': rowHeight * 1.5,  
        'DR': rowHeight * 2.5,  
        'ON': rowHeight * 3.5   
    };

    // 2. Define Time Scale Constants
    const MINUTES_IN_DAY = 1440; 

    /** Converts a timestamp to an X-coordinate. */
    const getXCoordinate = (timestamp: string | number | Date): number => {
        const date = new Date(timestamp);
        const minutes = date.getHours() * 60 + date.getMinutes();
        return (minutes / MINUTES_IN_DAY) * svgWidth;
    };

    // 3. Path Initialization: Handle 00:00 to First Log
    let path = "";
    
    const firstLog = statusChanges[0];
    // const firstStatus = firstLog.status.toUpperCase();
    const firstX = getXCoordinate(firstLog.timestamp);

    console.log({firstLog: firstLog.status})
    // Assume OFF DUTY from 00:00 up to the first log
    // const initialY = STATUS_MAP['OFF'];
    const firstY = STATUS_MAP['OFF'];

    // M: Move to 00:00 at OFF Y-coordinate
    path += `M 0,${firstY}`;
    // // L: Draw horizontal line from 00:00 to the first change time at OFF Y-coordinate
    // path += ` L ${firstX},${initialY}`;
    // // L: Draw vertical line from OFF Y-coordinate down to the actual first status Y-coordinate
    path += ` L ${firstX},${firstY}`;

    // 4. Iterate and Draw Segments
    for (let i = 0; i < statusChanges.length; i++) {
        const currentLog = statusChanges[i];
        const nextLog = statusChanges[i + 1];

        const currentStatus = currentLog.status.toUpperCase();
        type StatusKey = keyof typeof STATUS_MAP;
        const currentY = STATUS_MAP[currentStatus as StatusKey];

        if (nextLog) {
            const nextX = getXCoordinate(nextLog.timestamp);
            const nextY = STATUS_MAP[nextLog.status.toUpperCase() as StatusKey];

            // Horizontal line: current status maintained until the next change time
            path += ` L ${nextX},${currentY}`; 

            // Vertical line: transition to the next status's Y-coordinate
            // NOTE: We only draw the vertical line if the status actually changes, 
            // but the log only records a new entry when the status *changes* or a location update is needed. 
            // Assuming the log only records *changes* here:
            // if (currentY !== nextY) { // This check is redundant if log records only changes
                path += ` L ${nextX},${nextY}`;     
            // }
        } else {
            // Final segment: horizontal line until the end of the day (svgWidth)
            path += ` L ${svgWidth},${currentY}`; 
        }
    }

    return path;
};

interface LogVisualizerProps {
    log: any
}
const LogVisualizer = ({ log }: LogVisualizerProps) => {
    console.clear();
    console.log(log)
    
    // --- KEY CHANGE 1: Use a fixed internal ViewBox size ---
    // This value is now the coordinate system for the SVG content, NOT the physical width.
    const SVG_VIEWBOX_WIDTH = 1000;
    
    const ROW_HEIGHT = 50; // vertical spacing
    const LABEL_WIDTH = 80; // space for labels on the left
    const SVG_HEIGHT = ROW_HEIGHT * 4 + 20; // add some padding

    // Calculate the Path Coordinates
    // The path calculation must still use the ViewBox width.
    const pathD = generateHosPath(log.status_changes, SVG_VIEWBOX_WIDTH - LABEL_WIDTH, ROW_HEIGHT);

    // Define the Y positions for labels/grid lines
    const rowPositions = [0.5, 1.5, 2.5, 3.5].map(multiplier => multiplier * ROW_HEIGHT);

    const statusLabels = ['OFF', 'SB', 'DR', 'ON']; 

    return (
        // --- KEY CHANGE 2: Define 'width' via style and use viewBox for scaling ---
        <svg 
            style={{ width: '100%', height: 'auto' }} // Make the SVG responsive
            height={SVG_HEIGHT} 
            viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_HEIGHT}`} // Defines the internal coordinate system
        >
            {/* Draw Labels */}
            {rowPositions.map((y, index) => (
                <text
                    key={index}
                    x={LABEL_WIDTH - 10} 
                    y={y + 5} 
                    textAnchor="end"
                    fontSize="14"
                    fill="#333"
                >
                    {statusLabels[index]}
                </text>
            ))}

            {/* Draw Grid Lines */}
            {rowPositions.map((y, index) => (
                <line 
                    key={index}
                    x1={LABEL_WIDTH} // start after labels
                    y1={y} 
                    x2={SVG_VIEWBOX_WIDTH} // Use the ViewBox width as the end point
                    y2={y} 
                    stroke="#ccc" 
                    strokeDasharray="5,5" 
                />
            ))}

            {/* Draw the HOS Log Path */}
            <path 
                d={pathD} 
                fill="none" 
                stroke="black" 
                strokeWidth="4" 
                strokeLinecap="butt" 
                strokeLinejoin="miter"
                transform={`translate(${LABEL_WIDTH},0)`} 
            />
        </svg>
    );
};
export default LogVisualizer

/*

I borrowed quite a lot from GPT for this component as I am not previously this versed with drawing graphs using javascript.
I usually just draw textual pdf tables

*/