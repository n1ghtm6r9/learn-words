import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import { useShakeOnInvalid } from "./useShakeOnInvalid"

function Input({ className, type, ref, ...props }: React.ComponentProps<"input">) {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"
  const shakeRef = useShakeOnInvalid(invalid)

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      ref={(element: HTMLInputElement | null) => {
        shakeRef.current = element
        if (typeof ref === "function") ref(element)
        else if (ref) ref.current = element
      }}
      className={cn(
        "h-12 w-full min-w-0 md:h-10 md:text-sm rounded-xl border border-input bg-card px-3.5 py-2 text-base shadow-[inset_0_1px_2px_oklch(0.24_0.03_265/0.04)] ring-3 ring-transparent transition-[border-color,box-shadow,background-color] duration-200 ease-out outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:ring-destructive/30 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/70 dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
