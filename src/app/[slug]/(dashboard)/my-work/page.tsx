import { TaskListView } from "@/components/tasks/task-list-view"

/** The signed-in user's assigned tasks. The URL stays /my-work so existing links keep working. */
export default function MyTasksPage() {
  return <TaskListView />
}
