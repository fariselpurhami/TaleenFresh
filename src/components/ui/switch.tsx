// src/components/ui/switch.tsx

"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: "sm" | "default"
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = "default", ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent outline-none transition-all",
      "after:absolute after:-inset-x-3 after:-inset-y-2",
      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
      "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      "data-[state=checked]:bg-primary",
      "data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
      "disabled:cursor-not-allowed disabled:opacity-50",
      size === "default" && "h-[18.4px] w-[32px]",
      size === "sm" && "h-[14px] w-[24px]",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block rounded-full bg-background ring-0 transition-transform",
        "dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
        size === "default" && "size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        size === "sm" && "size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
))

Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
