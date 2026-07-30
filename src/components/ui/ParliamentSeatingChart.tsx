import React from 'react';

interface Props {
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  total: number;
}

export const ParliamentSeatingChart: React.FC<Props> = ({ approveCount, rejectCount, abstainCount, total }) => {
  // Ensure we have at least some visual seats if total is very low
  const displayTotal = Math.max(50, total);
  const rows = 4;
  
  // Distribute seats across rows
  const seatsPerRow = [];
  let remaining = displayTotal;
  for (let i = 0; i < rows; i++) {
    // Inner rows have fewer seats. Let's make it proportional to radius
    const rowRatio = (i + 2) / ((rows * (rows + 3)) / 2);
    let seatsInRow = Math.round(displayTotal * rowRatio);
    if (i === rows - 1) seatsInRow = remaining; // give rest to last row
    seatsPerRow.push(seatsInRow);
    remaining -= seatsInRow;
  }

  // Flatten points
  const points = [];
  let seatIndex = 0;

  for (let r = 0; r < rows; r++) {
    const rowSeats = seatsPerRow[r];
    const radius = 100 + (r * 25);
    
    for (let i = 0; i < rowSeats; i++) {
      // Angle from 180 to 0 (semi-circle)
      // We leave a small gap at the bottom edges
      const angle = Math.PI - (Math.PI * (i + 0.5) / rowSeats);
      
      const x = 200 + radius * Math.cos(angle);
      const y = 200 - radius * Math.sin(angle);
      
      points.push({ id: seatIndex++, x, y });
    }
  }

  // Now assign colors based on actual votes
  // Sort by color to group them left-to-right: Approve -> Abstain -> Reject -> Empty
  const coloredPoints = points.map((p, i) => {
    let color = 'hsla(0,0%,50%,0.2)';
    let opacity = 0.5;
    
    if (i < approveCount) {
      color = 'hsl(152,70%,50%)'; // Approve (Green)
      opacity = 1;
    } else if (i < approveCount + abstainCount) {
      color = 'hsl(220,15%,55%)'; // Abstain (Gray)
      opacity = 1;
    } else if (i < approveCount + abstainCount + rejectCount) {
      color = 'hsl(0,72%,55%)'; // Reject (Red)
      opacity = 1;
    }

    return { ...p, color, opacity };
  });

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
      <svg viewBox="0 0 400 220" style={{ width: '100%', maxWidth: '400px', height: 'auto', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))' }}>
        {coloredPoints.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={p.color}
            opacity={p.opacity}
            style={{ transition: 'all 0.5s ease-in-out' }}
          />
        ))}
        <text x="200" y="210" textAnchor="middle" fill="var(--text-primary)" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {total} Votes Cast
        </text>
      </svg>
    </div>
  );
};
