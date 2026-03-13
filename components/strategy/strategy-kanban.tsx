"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  GitBranch,
  Move,
  Filter,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react"

interface Task {
  id: number
  title: string
  status: string
  deadline: string
  priority: string
  assignee: string
  blocker?: string
  nodeName: string
  description?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  comments?: Array<{
    id: number
    author: string
    content: string
    timestamp: string
  }>
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  tasks: Task[]
  order: number
}

interface StrategyKanbanProps {
  nodes: Array<{
    id: number
    name: string
    tasks: Task[]
  }>
}

export function StrategyKanban({ nodes }: StrategyKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { 
      id: "todo", 
      title: "To Do", 
      color: "bg-slate-600",
      order: 1,
      tasks: nodes.flatMap(node => 
        node.tasks.filter(task => task.status === "To Do").map(task => ({
          ...task,
          nodeName: node.name,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          tags: ["urgent", "planning"],
          comments: []
        }))
      )
    },
    { 
      id: "in-progress", 
      title: "In Progress", 
      color: "bg-blue-600",
      order: 2,
      tasks: nodes.flatMap(node => 
        node.tasks.filter(task => task.status === "In Progress").map(task => ({
          ...task,
          nodeName: node.name,
          createdAt: "2024-01-14T09:00:00Z",
          updatedAt: "2024-01-16T14:30:00Z",
          tags: ["active"],
          comments: []
        }))
      )
    },
    { 
      id: "blocked", 
      title: "Blocked", 
      color: "bg-red-600",
      order: 3,
      tasks: nodes.flatMap(node => 
        node.tasks.filter(task => task.status === "Blocked").map(task => ({
          ...task,
          nodeName: node.name,
          createdAt: "2024-01-13T11:00:00Z",
          updatedAt: "2024-01-16T16:00:00Z",
          tags: ["blocked", "budget"],
          comments: []
        }))
      )
    },
    { 
      id: "done", 
      title: "Done", 
      color: "bg-green-600",
      order: 4,
      tasks: nodes.flatMap(node => 
        node.tasks.filter(task => task.status === "Done").map(task => ({
          ...task,
          nodeName: node.name,
          createdAt: "2024-01-12T08:00:00Z",
          updatedAt: "2024-01-15T17:00:00Z",
          tags: ["completed"],
          comments: []
        }))
      )
    }
  ])

  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false)
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee: "",
    deadline: "",
    nodeName: "",
    tags: ""
  })
  const [newColumnData, setNewColumnData] = useState({
    title: "",
    color: "bg-slate-600"
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400"
      case "high":
        return "bg-orange-500/20 text-orange-600 border-orange-500/30 dark:text-orange-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30 dark:text-gray-400"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "Blocked":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Pause className="w-4 h-4 text-slate-400" />
    }
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.currentTarget.classList.add("opacity-50", "scale-95")
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50", "scale-95")
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDraggedOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    
    if (!draggedTask) return

    const newColumns = columns.map(column => {
      if (column.id === targetColumnId) {
        const updatedTask = { 
          ...draggedTask, 
          status: targetColumnId === "todo" ? "To Do" : 
            targetColumnId === "in-progress" ? "In Progress" : 
            targetColumnId === "blocked" ? "Blocked" : "Done",
          updatedAt: new Date().toISOString()
        }
        return {
          ...column,
          tasks: [...column.tasks, updatedTask]
        }
      } else {
        return {
          ...column,
          tasks: column.tasks.filter(task => task.id !== draggedTask.id)
        }
      }
    })

    setColumns(newColumns)
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  const isCriticalPath = (task: Task) => {
    return task.priority === "critical" || task.nodeName.includes("Port") || task.nodeName.includes("TSMC")
  }

  const getColumnStats = (column: KanbanColumn) => {
    const totalTasks = column.tasks.length
    const criticalTasks = column.tasks.filter(task => task.priority === "critical").length
    const blockedTasks = column.tasks.filter(task => task.blocker).length
    
    return { totalTasks, criticalTasks, blockedTasks }
  }

  const addNewTask = () => {
    if (!newTaskData.title || !newTaskData.assignee) return

    const newTask: Task = {
      id: Date.now(),
      title: newTaskData.title,
      description: newTaskData.description,
      status: "To Do",
      deadline: newTaskData.deadline,
      priority: newTaskData.priority,
      assignee: newTaskData.assignee,
      nodeName: newTaskData.nodeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: newTaskData.tags ? newTaskData.tags.split(',').map(tag => tag.trim()) : [],
      comments: []
    }

    const updatedColumns = columns.map(column => {
      if (column.id === "todo") {
        return {
          ...column,
          tasks: [...column.tasks, newTask]
        }
      }
      return column
    })

    setColumns(updatedColumns)
    setNewTaskData({
      title: "",
      description: "",
      priority: "medium",
      assignee: "",
      deadline: "",
      nodeName: "",
      tags: ""
    })
    setShowAddTaskDialog(false)
  }

  const addNewColumn = () => {
    if (!newColumnData.title) return

    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title: newColumnData.title,
      color: newColumnData.color,
      order: columns.length + 1,
      tasks: []
    }

    setColumns([...columns, newColumn])
    setNewColumnData({
      title: "",
      color: "bg-slate-600"
    })
    setShowAddColumnDialog(false)
  }

  const updateTask = (taskId: number, updates: Partial<Task>) => {
    const updatedColumns = columns.map(column => ({
      ...column,
      tasks: column.tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    }))
    setColumns(updatedColumns)
    setEditingTask(null)
  }

  const deleteTask = (taskId: number) => {
    const updatedColumns = columns.map(column => ({
      ...column,
      tasks: column.tasks.filter(task => task.id !== taskId)
    }))
    setColumns(updatedColumns)
  }

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) return
    
    const columnToDelete = columns.find(col => col.id === columnId)
    if (!columnToDelete) return

    const updatedColumns = columns.map(column => {
      if (column.id === "todo") {
        return {
          ...column,
          tasks: [...column.tasks, ...columnToDelete.tasks.map(task => ({
            ...task,
            status: "To Do",
            updatedAt: new Date().toISOString()
          }))]
        }
      }
      return column
    }).filter(column => column.id !== columnId)

    setColumns(updatedColumns)
  }

  const availableNodes = nodes.map(node => node.name)
  const availableAssignees = ["Mike Johnson", "Lisa Wang", "Alex Chen", "David Kim", "Emma Rodriguez", "Tom Wilson", "Rachel Green", "Carlos Mendez", "Jennifer Lee"]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Task Kanban Board</h2>
          <p className="text-gray-600 dark:text-slate-400">Drag and drop tasks to update their status and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog open={showAddColumnDialog} onOpenChange={setShowAddColumnDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Add New Column</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Column Title</label>
                  <Input
                    value={newColumnData.title}
                    onChange={(e) => setNewColumnData({ ...newColumnData, title: e.target.value })}
                    placeholder="e.g., Review, Testing"
                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Color</label>
                  <Select value={newColumnData.color} onValueChange={(value) => setNewColumnData({ ...newColumnData, color: value })}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                      <SelectItem value="bg-slate-600">Gray</SelectItem>
                      <SelectItem value="bg-blue-600">Blue</SelectItem>
                      <SelectItem value="bg-green-600">Green</SelectItem>
                      <SelectItem value="bg-red-600">Red</SelectItem>
                      <SelectItem value="bg-yellow-600">Yellow</SelectItem>
                      <SelectItem value="bg-purple-600">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addNewColumn} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Add Column
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddColumnDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-600 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Task Title</label>
                  <Input
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                    placeholder="Enter task title"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <Textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                    placeholder="Enter task description"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Priority</label>
                    <Select value={newTaskData.priority} onValueChange={(value) => setNewTaskData({ ...newTaskData, priority: value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Assignee</label>
                    <Select value={newTaskData.assignee} onValueChange={(value) => setNewTaskData({ ...newTaskData, assignee: value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {availableAssignees.map(assignee => (
                          <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Deadline</label>
                    <Input
                      type="date"
                      value={newTaskData.deadline}
                      onChange={(e) => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Node</label>
                    <Select value={newTaskData.nodeName} onValueChange={(value) => setNewTaskData({ ...newTaskData, nodeName: value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select node" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {availableNodes.map(node => (
                          <SelectItem key={node} value={node}>{node}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Tags (comma separated)</label>
                  <Input
                    value={newTaskData.tags}
                    onChange={(e) => setNewTaskData({ ...newTaskData, tags: e.target.value })}
                    placeholder="urgent, planning, backend"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addNewTask} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTaskDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <div className="flex gap-6 min-w-max p-1">
            {columns.map((column, columnIndex) => {
              const stats = getColumnStats(column)
              return (
                <div key={column.id} className="w-80 flex-shrink-0 space-y-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50/80 border border-gray-200/50 dark:bg-slate-800/40 dark:border-slate-700/50 rounded-xl shadow-md backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                      <Badge className={`${column.color} text-white font-medium border-0 shadow-sm`}>
                        {stats.totalTasks}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {column.id !== "todo" && column.id !== "in-progress" && column.id !== "blocked" && column.id !== "done" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteColumn(column.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div 
                    className={`space-y-3 min-h-[600px] p-4 bg-gray-50/50 border border-gray-200/50 dark:bg-slate-800/20 dark:border-slate-700/40 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                      draggedOverColumn === column.id 
                        ? 'border-blue-500/50 bg-blue-500/10 dark:border-blue-400/50 dark:bg-blue-500/5' 
                        : 'border-gray-200/50 dark:border-slate-700/40'
                    }`}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {column.tasks.map((task, taskIndex) => (
                      <Card 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="bg-white/90 border-gray-200/60 dark:bg-slate-800/70 dark:border-slate-700/40 cursor-move hover:bg-white dark:hover:bg-slate-800/90 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10 dark:hover:shadow-slate-900/20 transform hover:-translate-y-1 group shadow-md backdrop-blur-sm"
                        style={{ animationDelay: `${taskIndex * 50}ms` }}
                      >
                        <CardContent className="p-4">
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight flex-1 mr-2">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              {isCriticalPath(task) && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">
                                  🔥 Critical
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTask(task)}
                                  className="text-slate-500 hover:text-blue-500 hover:bg-blue-500/20 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/20"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTask(task.id)}
                                  className="text-slate-500 hover:text-red-500 hover:bg-red-500/20 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Move className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>

                          {/* Task Details */}
                          <div className="space-y-3">
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                                <GitBranch className="w-3 h-3" />
                                <span className="font-medium">{task.nodeName}</span>
                              </div>
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                                <User className="w-3 h-3" />
                                <span>{task.assignee}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{task.deadline}</span>
                              </div>
                            </div>

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map((tag, index) => (
                                  <Badge key={index} className="bg-slate-200/80 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border-slate-300/50 dark:border-slate-600/50 text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Blocker Alert */}
                            {task.blocker && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-red-400" />
                                  <span className="text-xs text-red-400 font-medium">{task.blocker}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Empty State */}
                    {column.tasks.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-slate-400 border-2 border-dashed border-gray-300 dark:border-slate-600/50 rounded-lg bg-gray-50/50 dark:bg-slate-800/30">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">No tasks</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Drop tasks here</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column Stats */}
                  <Card className="bg-gray-50/80 border border-gray-200/50 dark:bg-slate-800/60 dark:border-slate-700/50 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">{column.title}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                        </div>
                        <div className="text-right">
                          {stats.criticalTasks > 0 && (
                            <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-xs mb-1">
                              {stats.criticalTasks} Critical
                            </Badge>
                          )}
                          {stats.blockedTasks > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs">
                              {stats.blockedTasks} Blocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Gradient fade effect to indicate more content */}
        {columns.length > 4 && (
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none" />
        )}
        
        {/* Scroll Indicator */}
        {columns.length > 4 && (
          <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200/50 dark:border-slate-600/50 shadow-md">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
              <span>Scroll horizontally to see more columns</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="bg-slate-800 border-slate-600 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Task Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Description</label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Priority</label>
                  <Select value={editingTask.priority} onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Assignee</label>
                  <Select value={editingTask.assignee} onValueChange={(value) => setEditingTask({ ...editingTask, assignee: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {availableAssignees.map(assignee => (
                        <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Deadline</label>
                  <Input
                    type="date"
                    value={editingTask.deadline}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Blocker (optional)</label>
                  <Input
                    value={editingTask.blocker || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, blocker: e.target.value })}
                    placeholder="What's blocking this task?"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateTask(editingTask.id, editingTask)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingTask(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Board Summary */}
      <Card className="bg-white/80 border-gray-200/50 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Board Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            {columns.map((column) => {
              const stats = getColumnStats(column)
              return (
                <div key={column.id} className="text-center">
                  <div className={`w-12 h-12 rounded-full ${column.color} flex items-center justify-center mx-auto mb-3`}>
                    {getTaskStatusIcon(column.id === "todo" ? "To Do" : 
                      column.id === "in-progress" ? "In Progress" : 
                      column.id === "blocked" ? "Blocked" : "Done")}
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-slate-200">{column.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">tasks</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 