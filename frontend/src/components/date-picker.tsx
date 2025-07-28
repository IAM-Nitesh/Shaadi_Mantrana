// Copied from https://ui.shadcn.com/docs/components/date-picker
"use client"

import * as React from "react"
import { format } from "date-fns"
import { FaRegCalendarAlt as CalendarIcon } from "react-icons/fa"

import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

export function DatePicker({ date, onChange, className }: {
  date: Date | undefined,
  onChange: (date: Date | undefined) => void,
  className?: string
}) {
  // Calculate date restrictions dynamically
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(1900, 0, 1);
  const [selectedYear, setSelectedYear] = React.useState(date?.getFullYear() || eighteenYearsAgo.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(date?.getMonth() || 0);
  const [open, setOpen] = React.useState(false);

  // Custom disabled function to ensure no future dates or dates less than 18 years ago
  const disabledDays = (date: Date) => {
    return date > eighteenYearsAgo || date < minDate;
  };

  // Generate year options (1900 to 18 years ago)
  const yearOptions = [];
  for (let year = 1900; year <= eighteenYearsAgo.getFullYear(); year++) {
    yearOptions.push(year);
  }

  // Generate month options
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle year/month changes
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-lg rounded-lg" align="start" sideOffset={4}>
        <div className="p-3 border-b">
          <div className="flex gap-2 mb-2">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {monthOptions.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => {
            onChange(d);
            setOpen(false);
          }}
          initialFocus
          disabled={disabledDays}
          month={new Date(selectedYear, selectedMonth)}
          onMonthChange={(date) => {
            setSelectedYear(date.getFullYear());
            setSelectedMonth(date.getMonth());
          }}
        />
      </PopoverContent>
    </Popover>
  )
} 