// Copied from https://ui.shadcn.com/docs/components/calendar
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-royal-obsidian text-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-royal-gold",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-royal-gold hover:text-royal-gold-light transition-opacity",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-royal-gold/50 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-royal-gold/20 [&:has([aria-selected])]:rounded-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-royal-gold/20 hover:text-royal-gold rounded-md transition-colors",
          classNames?.day
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-royal-gold text-royal-obsidian hover:bg-royal-gold-light hover:text-royal-obsidian focus:bg-royal-gold focus:text-royal-obsidian font-bold rounded-md",
        day_today: "bg-royal-gold/15 text-royal-gold font-semibold rounded-md",
        day_outside: "text-white/20 opacity-40",
        day_disabled: "text-white/20 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-royal-gold/20 aria-selected:text-white",
        day_hidden: "invisible",
      }}
      components={({
        IconLeft: (props: any) => <ChevronLeft className="h-4 w-4 text-royal-gold" {...props} />,
        IconRight: (props: any) => <ChevronRight className="h-4 w-4 text-royal-gold" {...props} />,
      } as any)}
      {...props}
    />
  )
} 