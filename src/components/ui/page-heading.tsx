interface PageHeadingProps {
  title: string
  description?: string
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
