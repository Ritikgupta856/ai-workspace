"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  useDroppable,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const COL_PREFIX = "col-"
const CARD_PREFIX = "card-"

function colId(id: string) {
  return `${COL_PREFIX}${id}`
}

function cardId(id: string) {
  return `${CARD_PREFIX}${id}`
}

function stripPrefix(id: string, prefix: string) {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id
}

export interface KanbanColumn {
  id: string
  title: string
  color?: string
}

export interface KanbanProps<T> {
  columns: KanbanColumn[]
  items: T[]
  getItemId: (item: T) => string
  getColumn: (item: T) => string
  renderCard: (item: T) => React.ReactNode
  onMove?: (itemId: string, from: string, to: string, index: number) => void
  className?: string
}

function findColumnByItemId<T>(
  map: Map<string, T[]>,
  itemId: string,
  getItemId: (item: T) => string
): string | null {
  for (const [colId, colItems] of map) {
    if (colItems.some((item) => getItemId(item) === itemId)) {
      return colId
    }
  }
  return null
}

function groupByColumn<T>(
  items: T[],
  columns: KanbanColumn[],
  getColumn: (item: T) => string
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const col of columns) {
    map.set(col.id, [])
  }
  for (const item of items) {
    const colId = getColumn(item)
    const arr = map.get(colId)
    if (arr) {
      arr.push(item)
    }
  }
  return map
}

function KanbanCard<T>({
  id,
  item,
  renderCard,
}: {
  id: string
  item: T
  renderCard: (item: T) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-md", isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      {renderCard(item)}
    </div>
  )
}

function KanbanColumn<T>({
  column,
  items,
  getItemId,
  renderCard,
}: {
  column: KanbanColumn
  items: T[]
  getItemId: (item: T) => string
  renderCard: (item: T) => React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: colId(column.id),
  })

  const itemIds = React.useMemo(
    () => items.map((item) => cardId(getItemId(item))),
    [items, getItemId]
  )

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/50",
        isOver && "ring-2 ring-primary/20"
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-muted/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <span className="text-sm font-medium text-foreground">
            {column.title}
          </span>
        </div>
        <Badge
          variant="secondary"
          className="pointer-events-none text-xs tabular-nums"
        >
          {items.length}
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <SortableContext
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <KanbanCard
                key={getItemId(item)}
                id={cardId(getItemId(item))}
                item={item}
                renderCard={renderCard}
              />
            ))}
          </div>
        </SortableContext>
        {items.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            Drop items here
          </div>
        )}
      </div>
    </div>
  )
}

function Kanban<T>({
  columns,
  items,
  getItemId,
  getColumn,
  renderCard,
  onMove,
  className,
}: KanbanProps<T>) {
  const getItemIdRef = React.useRef(getItemId)
  const getColumnRef = React.useRef(getColumn)
  const onMoveRef = React.useRef(onMove)
  const columnsRef = React.useRef(columns)
  getItemIdRef.current = getItemId
  getColumnRef.current = getColumn
  onMoveRef.current = onMove
  columnsRef.current = columns

  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [sourceCol, setSourceCol] = React.useState<string | null>(null)
  const [columnMap, setColumnMap] = React.useState<Map<string, T[]>>(() =>
    groupByColumn(items, columns, getColumn)
  )
  const columnMapRef = React.useRef(columnMap)

  const activeItemId = activeId ? stripPrefix(activeId, CARD_PREFIX) : null

  React.useEffect(() => {
    if (!activeId) {
      const grouped = groupByColumn(items, columns, getColumnRef.current)
      setColumnMap(grouped)
      columnMapRef.current = grouped
    }
  }, [items, columns, activeId])

  const propsMap = React.useMemo(
    () => groupByColumn(items, columns, getColumnRef.current),
    [items, columns]
  )

  const displayMap = activeId ? columnMap : propsMap

  const activeItem = React.useMemo(() => {
    if (!activeItemId) return null
    const col = findColumnByItemId(columnMap, activeItemId, getItemIdRef.current)
    if (!col) return null
    const colItems = columnMap.get(col) ?? []
    return colItems.find((item) => getItemIdRef.current(item) === activeItemId) ?? null
  }, [activeItemId, columnMap])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    setActiveId(id)

    const itemId = stripPrefix(id, CARD_PREFIX)
    const initialMap = groupByColumn(items, columnsRef.current, getColumnRef.current)
    const startCol = findColumnByItemId(initialMap, itemId, getItemIdRef.current)
    if (startCol) {
      setSourceCol(startCol)
    }

    const grouped = groupByColumn(items, columnsRef.current, getColumnRef.current)
    setColumnMap(grouped)
    columnMapRef.current = grouped
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    if (activeIdStr === overIdStr) return

    const overIsCol = overIdStr.startsWith(COL_PREFIX)
    const activeItemIdStr = stripPrefix(activeIdStr, CARD_PREFIX)

    setColumnMap((prev) => {
      const next = new Map(prev)

      const sourceColId = findColumnByItemId(next, activeItemIdStr, getItemIdRef.current)
      if (!sourceColId) return prev

      const overItemId = stripPrefix(overIdStr, CARD_PREFIX)

      let targetColId: string
      if (overIsCol) {
        targetColId = stripPrefix(overIdStr, COL_PREFIX)
      } else {
        const col = findColumnByItemId(next, overItemId, getItemIdRef.current)
        if (!col) return prev
        targetColId = col
      }

      if (!next.has(targetColId)) return prev

      if (sourceColId === targetColId) {
        const colItems = next.get(sourceColId)!
        const oldIndex = colItems.findIndex(
          (item) => getItemIdRef.current(item) === activeItemIdStr
        )
        const newIndex = colItems.findIndex(
          (item) =>
            getItemIdRef.current(item) ===
            stripPrefix(overIdStr, CARD_PREFIX)
        )
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev
        next.set(sourceColId, arrayMove(colItems, oldIndex, newIndex))
      } else {
        const sourceItems = [...(next.get(sourceColId) ?? [])]
        const targetItems = [...(next.get(targetColId) ?? [])]
        const activeIdx = sourceItems.findIndex(
          (item) => getItemIdRef.current(item) === activeItemIdStr
        )
        if (activeIdx === -1) return prev

        const [movedItem] = sourceItems.splice(activeIdx, 1)
        next.set(sourceColId, sourceItems)

        let insertIdx: number
        if (overIsCol) {
          insertIdx = targetItems.length
        } else {
          insertIdx = targetItems.findIndex(
            (item) =>
              getItemIdRef.current(item) ===
              stripPrefix(overIdStr, CARD_PREFIX)
          )
          if (insertIdx === -1) insertIdx = targetItems.length
        }

        targetItems.splice(insertIdx, 0, movedItem)
        next.set(targetColId, targetItems)
      }

      columnMapRef.current = next
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event
    const itemId = activeItemId
    const from = sourceCol

    setActiveId(null)
    setSourceCol(null)

    if (!over || !itemId || !from) return

    const currentMap = columnMapRef.current
    const targetCol = findColumnByItemId(currentMap, itemId, getItemIdRef.current)
    if (!targetCol) return

    const colItems = currentMap.get(targetCol) ?? []
    const idx = colItems.findIndex(
      (item) => getItemIdRef.current(item) === itemId
    )
    if (idx === -1) return

    onMoveRef.current?.(itemId, from, targetCol, idx)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn("flex gap-4 overflow-x-auto pb-4", className)}
      >
        {columns.map((column) => {
          const colItems = displayMap.get(column.id) ?? []
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              items={colItems}
              getItemId={getItemIdRef.current}
              renderCard={renderCard}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-md bg-card shadow-xl ring-1 ring-border">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export { Kanban }
