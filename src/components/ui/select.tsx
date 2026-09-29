import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 py-2 text-base ring-3 ring-transparent md:h-10 md:text-sm transition-[border-color,box-shadow,background-color] duration-200 ease-out outline-none select-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/20 data-[popup-open]:border-ring data-[popup-open]:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="flex shrink-0 text-muted-foreground">
        <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" className="min-w-0 truncate text-left" {...props} />
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50 outline-none">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fill-mode-forwards data-closed:fade-out-0",
            className
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex min-h-11 cursor-default items-center gap-2 rounded-xl py-2 pr-3 pl-2.5 text-base md:min-h-9 md:rounded-lg md:text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground",
        className
      )}
      {...props}
    >
      <span className="flex w-3.5 shrink-0">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectItemBlank({ className }: { className?: string }) {
  return <span className={cn("w-3.5 shrink-0", className)} aria-hidden="true" />
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectItemBlank }
