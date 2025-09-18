// Premium TimePicker component, shadcn/ui style
"use client"

import * as React from "react";
import { Button } from "../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

function pad(n: number) { return n.toString().padStart(2, '0'); }

export function TimePicker({
  time,
  onChange,
  className,
  "data-field": dataField
}: {
  time: Date | undefined,
  onChange: (date: Date | undefined) => void,
  className?: string,
  "data-field"?: string
}) {
  const [open, setOpen] = React.useState(false);
  const [hour, setHour] = React.useState(time ? time.getHours() % 12 || 12 : 12);
  const [minute, setMinute] = React.useState(time ? time.getMinutes() : 0);
  const [ampm, setAMPM] = React.useState(time ? (time.getHours() >= 12 ? 'PM' : 'AM') : 'AM');

  React.useEffect(() => {
    if (time) {
      setHour(time.getHours() % 12 || 12);
      setMinute(time.getMinutes());
      setAMPM(time.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [time]);

  function handleSet() {
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    const d = new Date();
    d.setHours(h, minute, 0, 0);
    onChange(d);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={[
            "w-full justify-start text-left font-normal",
            !time ? "text-muted-foreground" : "",
            className || ""
          ].filter(Boolean).join(" ")}
          data-field={dataField}
        >
          <span className="mr-2 h-4 w-4 inline-block align-middle">
            {/* Simple clock SVG icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          {time ? `${pad(hour)}:${pad(minute)} ${ampm}` : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 bg-white shadow-lg rounded-lg" align="start" sideOffset={4}>
        <div className="flex items-center gap-2 mb-4">
          <select
            className="p-2 border rounded focus:outline-none"
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h: number) => (
              <option key={h} value={h}>{pad(h)}</option>
            ))}
          </select>
          <span className="text-lg font-bold">:</span>
          <select
            className="p-2 border rounded focus:outline-none"
            value={minute}
            onChange={e => setMinute(Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, i) => i).map((m: number) => (
              <option key={m} value={m}>{pad(m)}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded focus:outline-none"
            value={ampm}
            onChange={e => setAMPM(e.target.value as 'AM' | 'PM')}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <Button className="w-full" onClick={handleSet}>
          Set Time
        </Button>
      </PopoverContent>
    </Popover>
  );
} 