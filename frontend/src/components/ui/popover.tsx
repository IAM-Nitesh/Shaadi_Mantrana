// Copied from https://ui.shadcn.com/docs/components/popover
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils"

const Popover: any = PopoverPrimitive.Root

const PopoverTrigger: any = PopoverPrimitive.Trigger

const PopoverContent: any = React.forwardRef(
  ({ className, align = "center", sideOffset = 4, ...props }: any, ref: any) => {
    const PopoverPortal: any = PopoverPrimitive.Portal;
    const PopoverPrimitiveContent: any = PopoverPrimitive.Content;
    return (
      <PopoverPortal>
        <PopoverPrimitiveContent
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-72 rounded-md border border-popover bg-popover p-4 text-popover-foreground shadow-md outline-none",
            className
          )}
          {...props}
        />
      </PopoverPortal>
    );
  }
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent } 