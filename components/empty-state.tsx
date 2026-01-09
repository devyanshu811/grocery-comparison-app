import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionText?: string
  actionHref?: string
}

export function EmptyState({ icon = "📦", title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {icon && <div className="text-6xl mb-4 opacity-50">{icon}</div>}
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {actionText && actionHref && (
        <Link href={actionHref}>
          <Button>{actionText}</Button>
        </Link>
      )}
    </div>
  )
}
