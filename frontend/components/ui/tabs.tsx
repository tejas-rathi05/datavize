"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tabsListVariants = cva(
  "bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg p-[3px]",
  {
    variants: {
      size: {
        default: "h-9",
        sm: "h-7",
        lg: "h-11",
        xl: "h-14",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        default: "h-[calc(100%-1px)] px-2 py-1 text-sm [&_svg:not([class*='size-'])]:size-4",
        sm: "h-[calc(100%-1px)] px-1.5 py-0.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "h-[calc(100%-1px)] px-3 py-1.5 text-lg [&_svg:not([class*='size-'])]:size-5",
        xl: "h-[calc(100%-1px)] px-4 py-2 text-xl [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ size, className }))}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ size, className }))}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
