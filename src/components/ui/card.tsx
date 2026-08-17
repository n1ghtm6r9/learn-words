import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { CARD_CLASS } from "@/lib/cardClass"

function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn(CARD_CLASS, className)} {...props} />
}

export { Card }
