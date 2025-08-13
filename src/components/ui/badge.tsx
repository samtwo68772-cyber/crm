
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "text-foreground",
        high: "border-transparent bg-red-500/20 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        medium: "border-transparent bg-orange-500/20 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        low: "border-transparent bg-green-500/20 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        blue: "border-transparent bg-blue-500/20 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        teal: "border-transparent bg-teal-500/20 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
        green: "border-transparent bg-green-500/20 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
