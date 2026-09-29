"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { useTranslation } from '@/i18n/useTranslation'
import { useUIStore } from '@/store/useUIStore'
import { DialogActionsContext } from "@/components/ui/dialogActionsContext"
import { useSheetDrag } from "@/components/ui/useSheetDrag"

function Dialog({ onOpenChange, actionsRef, ...props }: DialogPrimitive.Root.Props) {
  const ownActionsRef = React.useRef<DialogPrimitive.Root.Actions | null>(null)
  const actions = actionsRef ?? ownActionsRef

  return (
    <DialogActionsContext value={actions}>
      <DialogPrimitive.Root
        data-slot="dialog"
        actionsRef={actions}
        onOpenChange={(open, details) => {
          if (!open && details.reason === 'outside-press' && useUIStore.getState().colorFlowerOpen) {
            details.cancel()
            return
          }
          onOpenChange?.(open, details)
        }}
        {...props}
      />
    </DialogActionsContext>
  )
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fill-mode-forwards data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const t = useTranslation()
  const actions = React.useContext(DialogActionsContext)
  const { popupRef, backdropRef } = useSheetDrag(() => actions?.current?.close())

  return (
    <DialogPortal>
      <DialogOverlay ref={backdropRef} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-popover text-[15px] md:rounded-2xl md:text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/10 duration-200 outline-none md:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fill-mode-forwards data-closed:fade-out-0 data-closed:zoom-out-95 max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[92dvh] max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:pb-[var(--safe-bottom)] max-md:data-open:zoom-in-100 max-md:data-open:slide-in-from-bottom max-md:data-closed:zoom-out-100 max-md:data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
        ref={popupRef}
      >
        <div data-sheet-handle aria-hidden="true" className="flex shrink-0 touch-none justify-center pt-2.5 pb-1 md:hidden">
          <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto overscroll-contain p-5 max-md:pt-0.5 md:gap-4 md:p-6">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 rounded-full bg-popover/90 backdrop-blur-sm"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">{t.close}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-3xl border-t bg-muted/50 p-5 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading pr-10 text-xl leading-tight font-bold tracking-tight break-words text-balance md:text-lg",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
