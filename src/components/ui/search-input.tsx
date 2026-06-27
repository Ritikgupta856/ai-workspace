"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

interface SearchInputProps
    extends Omit<React.ComponentProps<typeof InputGroupInput>, "onChange"> {
    value?: string
    onValueChange?: (value: string) => void
    showShortcut?: boolean
    shortcutKey?: string
    className?: string
}

export function SearchInput({
    value,
    onValueChange,
    placeholder = "Search...",
    showShortcut = true,
    shortcutKey = "K",
    className,
    ...props
}: SearchInputProps) {
    return (
        <div className={cn("w-full max-w-sm", className)}>
            <InputGroup className="flex-row items-center rounded-lg">
                <InputGroupAddon>
                    <SearchIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>

                <InputGroupInput
                    value={value}
                    onChange={(e) => onValueChange?.(e.target.value)}
                    placeholder={placeholder}
                    {...props}
                />

                {showShortcut && (
                    <InputGroupAddon align="inline-end">
                        <Kbd>⌘</Kbd>
                        <Kbd>{shortcutKey}</Kbd>
                    </InputGroupAddon>
                )}
            </InputGroup>
        </div>
    )
}