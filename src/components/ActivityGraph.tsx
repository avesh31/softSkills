"use client";

import { useMemo } from "react";

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityGraphProps {
  data: ActivityDay[];
  months?: number; // How many months to show
}

export default function ActivityGraph({ data, months = 3 }: ActivityGraphProps) {
  // 1. Determine Date Range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - months);

  // Normalize all dates to midnight for safe comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // 2. Build map of data for fast lookup
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      map[d.date] = d.count;
    });
    return map;
  }, [data]);

  // 3. Generate Calendar Grid (Weeks -> Days)
  const weeks = useMemo(() => {
    const grid: { date: string; count: number }[][] = [];
    let currentDay = new Date(startDate);
    
    // Retreat to the most recent Sunday to start the column cleanly
    currentDay.setDate(currentDay.getDate() - currentDay.getDay());

    while (currentDay <= endDate) {
      const week: { date: string; count: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDay.toISOString().split('T')[0];
        // Only render visible blocks within the active date range window (grey-out future days or pre-start days)
        if (currentDay > endDate) {
            week.push({ date: dateStr, count: -1 }); // Future
        } else {
            week.push({
                date: dateStr,
                count: activityMap[dateStr] || 0
            });
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
      grid.push(week);
    }
    return grid;
  }, [startDate, endDate, activityMap]);

  // 4. Color Intensity Mapping
  const getIntensityColor = (count: number) => {
    if (count < 0) return 'transparent'; // Future dates hide
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (count < 2) return 'rgba(99, 102, 241, 0.4)';  // Light
    if (count < 4) return 'rgba(99, 102, 241, 0.7)';  // Medium
    return 'rgba(99, 102, 241, 1)';                   // Dark
  };

  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        Contribution Activity ({months} Months)
      </h4>
      
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {weeks.map((week, wIndex) => (
          <div key={`w-${wIndex}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {week.map((day, dIndex) => (
              <div 
                key={`d-${wIndex}-${dIndex}`}
                title={day.count >= 0 ? `${day.count} activities on ${day.date}` : ''}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: getIntensityColor(day.count),
                  transition: 'transform 0.1s',
                  cursor: day.count >= 0 ? 'pointer' : 'default',
                  opacity: day.count >= 0 ? 1 : 0
                }}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Less</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: getIntensityColor(0) }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: getIntensityColor(1) }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: getIntensityColor(3) }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: getIntensityColor(5) }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
