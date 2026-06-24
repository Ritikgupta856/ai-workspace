"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full flex-col rounded-2xl border border-border bg-sidebar shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
      className
    )}
    {...props}
  />
))
InputGroup.displayName = "InputGroup"

const inputGroupAddonVariants = cva(
  "flex items-center gap-2 px-3 py-2",
  {
    variants: {
      align: {
        default: "",
        "block-end": "border-t border-border",
        "block-start": "border-b border-border",
        "inline-end": "",
        "inline-start": "",
      },
    },
    defaultVariants: {
      align: "default",
    },
  }
)

interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputGroupAddonVariants> {}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  )
)
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant = "ghost", size = "icon-sm", ...props }, ref) => (
  <Button
    ref={ref}
    className={cn("shrink-0", className)}
    variant={variant}
    size={size}
    {...props}
  />
))
InputGroupButton.displayName = "InputGroupButton"

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full resize-none bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
InputGroupTextarea.displayName = "InputGroupTextarea"

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex w-full bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
InputGroupInput.displayName = "InputGroupInput"

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex items-center px-3 py-3 text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
))
InputGroupText.displayName = "InputGroupText"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupInput,
  InputGroupText,
}
