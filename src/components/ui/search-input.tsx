"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

interface SearchInputProps
    extends Omit<React.ComponentProps<typeof InputGroupInput>, "onChange"> {
    value?: string
    onValueChange?: (value: string) => void
    compact?: boolean
    className?: string
}

export function SearchInput({
    value,
    onValueChange,
    placeholder = "Search...",
    compact = false,
    className,
    ...props
}: SearchInputProps) {
    return (
        <div className={cn("w-full max-w-sm", className)}>
            <InputGroup className={cn("flex-row items-center rounded-lg", compact && "shadow-none")}>
                <InputGroupAddon className={compact ? "px-2.5 py-1.5" : undefined}>
                    <SearchIcon className={cn("text-muted-foreground", compact ? "size-3.5" : "size-4")} />
                </InputGroupAddon>

                <InputGroupInput
                    value={value}
                    onChange={(e) => onValueChange?.(e.target.value)}
                    placeholder={placeholder}
                    className={compact ? "py-2 text-xs" : undefined}
                    {...props}
                />
            </InputGroup>
        </div>
    )
}
