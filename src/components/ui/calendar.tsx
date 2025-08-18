
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  
  // Special rendering for the meetings page calendar
  if (className?.includes('meeting-calendar-wrapper')) {
    return (
        <div className={cn("meeting-calendar-wrapper", className)}>
            <style>{`
                .meeting-calendar-wrapper .rdp-table {
                    border-collapse: separate;
                    border-spacing: 0.5rem;
                    width: 100%;
                }
                .meeting-calendar-wrapper .rdp-head_cell {
                    text-align: center;
                    color: hsl(var(--muted-foreground));
                    font-weight: 500;
                    padding-bottom: 0.5rem;
                }
                .meeting-calendar-wrapper .rdp-cell {
                    width: calc(100% / 7);
                    position: relative;
                    padding: 0;
                }
                .meeting-calendar-wrapper .rdp-cell:before {
                    content: '';
                    display: block;
                    padding-top: 100%;
                }
                .meeting-calendar-wrapper .rdp-day {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: flex-start;
                    transition: background-color 0.2s;
                    padding: 0.25rem;
                    min-width: 0;
                    min-height: 0;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    border: 1px solid hsl(var(--border));
                }
                .meeting-calendar-wrapper .rdp-day:not([aria-selected="true"]):not(.rdp-day_today):hover {
                    background-color: hsl(var(--muted));
                }
                .meeting-calendar-wrapper .rdp-day_today {
                    background-color: hsl(var(--primary)) !important;
                    color: hsl(var(--primary-foreground)) !important;
                    border-color: hsl(var(--primary)) !important;
                }
                .meeting-calendar-wrapper .rdp-day_today .w-full.text-right {
                     color: hsl(var(--primary-foreground)) !important;
                }
                .meeting-calendar-wrapper .rdp-day_outside {
                    background-color: hsl(var(--background));
                    color: hsl(var(--muted-foreground));
                    opacity: 0.5;
                }
                 .meeting-calendar-wrapper .rdp-day_outside .w-full.text-right {
                    color: hsl(var(--muted-foreground));
                }
                .meeting-calendar-wrapper .rdp-caption_label {
                    font-size: 1.125rem;
                    font-weight: 600;
                }
                .meeting-calendar-wrapper .rdp-nav_button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.375rem;
                    width: 2rem;
                    height: 2rem;
                }
                .meeting-calendar-wrapper .rdp-nav_button:hover {
                    background-color: hsl(var(--accent));
                }
            `}</style>
            <DayPicker
              showOutsideDays={showOutsideDays}
              className={cn("p-0", className)}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center text-lg font-medium",
                caption_label: "hidden",
                nav: "hidden",
                table: "rdp-table",
                head_row: "flex w-full",
                head_cell: "rdp-head_cell text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                row: "flex w-full mt-0",
                cell: "rdp-cell",
                day: "rdp-day",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "rdp-day_today",
                day_outside: "rdp-day_outside",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
              }}
              components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                ...props.components
              }}
              {...props}
            />
        </div>
    )
  }

  // Default rendering for all other calendars
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        ...props.components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
