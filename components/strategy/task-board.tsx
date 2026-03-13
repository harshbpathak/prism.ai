"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Plus,
  Filter,
  Calendar,
  MessageSquare,
  Paperclip,
} from "lucide-react"

interface TaskBoardProps {
  strategy: any
}

const taskColumns = [
  { id: "todo", title: "To Do", color: "bg-slate-600", count: 8 },
  { id: "in-progress", title: "In Progress", color: "bg-blue-600", count: 6 },
  { id: "review", title: "Review", color: "bg-yellow-600", count: 4 },
  { id: "completed", title: "Completed", color: "bg-green-600", count: 16 },
]

const tasks = [
  {
    id: 1,
    title: "Establish backup supplier contracts",
    description: "Negotiate and finalize contracts with secondary steel suppliers",
    status: "completed",
    priority: "high",
    assignee: "JD",
    assigneeName: "John Doe",
    node: "Steel Supplier",
    dueDate: "2024-01-20",
    tags: ["contracts", "suppliers"],
    comments: 3,
    attachments: 2,
    progress: 100,
  },
  {
    id: 2,
    title: "Deploy emergency production team",
    description: "Mobilize specialized team for critical component manufacturing",
    status: "in-progress",
    priority: "critical",
    assignee: "SM",
    assigneeName: "Sarah Miller",
    node: "Parts Manufacturer",
    dueDate: "2024-01-25",
    tags: ["production", "emergency"],
    comments: 7,
    attachments: 1,
    progress: 65,
  },
  {
    id: 3,
    title: "Reroute shipments through alternate hubs",
    description: "Coordinate with logistics partners to establish alternative routes",
    status: "in-progress",
    priority: "high",
    assignee: "MJ",
    assigneeName: "Mike Johnson",
    node: "Logistics Hub",
    dueDate: "2024-01-28",
    tags: ["logistics", "routing"],
    comments: 5,
    attachments: 3,
    progress: 40,
  },
  {
    id: 4,
    title: "Increase inventory buffer by 20%",
    description: "Adjust inventory levels to prevent future disruptions",
    status: "review",
    priority: "medium",
    assignee: "AL",
    assigneeName: "Anna Lee",
    node: "Steel Supplier",
    dueDate: "2024-01-30",
    tags: ["inventory", "buffer"],
    comments: 2,
    attachments: 0,
    progress: 90,
  },
  {
    id: 5,
    title: "Implement quality monitoring system",
    description: "Set up automated quality control and monitoring",
    status: "todo",
    priority: "medium",
    assignee: "RW",
    assigneeName: "Robert Wilson",
    node: "Parts Manufacturer",
    dueDate: "2024-02-05",
    tags: ["quality", "monitoring"],
    comments: 1,
    attachments: 1,
    progress: 0,
  },
  {
    id: 6,
    title: "Activate secondary production line",
    description: "Bring online backup manufacturing capacity",
    status: "in-progress",
    priority: "critical",
    assignee: "LB",
    assigneeName: "Lisa Brown",
    node: "Parts Manufacturer",
    dueDate: "2024-01-26",
    tags: ["production", "capacity"],
    comments: 4,
    attachments: 2,
    progress: 75,
  },
  {
    id: 7,
    title: "Coordinate with backup logistics partners",
    description: "Establish agreements with alternative logistics providers",
    status: "todo",
    priority: "high",
    assignee: "DT",
    assigneeName: "David Taylor",
    node: "Logistics Hub",
    dueDate: "2024-02-01",
    tags: ["partnerships", "logistics"],
    comments: 0,
    attachments: 0,
    progress: 0,
  },
  {
    id: 8,
    title: "Adjust production schedule",
    description: "Optimize production timeline based on supply constraints",
    status: "review",
    priority: "medium",
    assignee: "KM",
    assigneeName: "Kevin Martinez",
    node: "Assembly Plant",
    dueDate: "2024-01-29",
    tags: ["scheduling", "optimization"],
    comments: 6,
    attachments: 1,
    progress: 85,
  },
]

export function TaskBoard({ strategy }: TaskBoardProps) {
  const [selectedFilter, setSelectedFilter] = useState("all")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400"
      case "high":
        return "bg-orange-500/20 text-orange-600 border-orange-500/30 dark:text-orange-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400"
      case "low":
        return "bg-green-500/20 text-green-600 border-green-500/30 dark:text-green-400"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30 dark:text-gray-400"
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="p-6 h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-row items-center mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Task Kanban Board</h2>
          <p className="text-gray-700 dark:text-slate-400">Drag and drop tasks to update their status and track progress</p>
        </div>
        <div className="flex items-center gap-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800"
          >
            <Filter className="w-4 h-4 mr-1" />
            <span>Filter</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 cursor-not-allowed"
            disabled
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Section</span>
          </Button>
          <Button size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-280px)]">
        {taskColumns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 shadow-md dark:shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="text-gray-900 dark:text-white font-bold">{column.title}</span>
              </div>
              <Badge className={
                column.id === "todo"
                  ? "bg-gray-200 dark:bg-slate-600 text-black dark:text-white border-gray-300 dark:border-slate-600"
                  : column.id === "in-progress"
                  ? "bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white border-blue-200 dark:border-blue-600"
                  : column.id === "blocked"
                  ? "bg-red-100 dark:bg-red-600 text-red-800 dark:text-white border-red-200 dark:border-red-600"
                  : "bg-gray-200 dark:bg-slate-700/50 text-black dark:text-white border-gray-300 dark:border-slate-600"
              }>{column.count}</Badge>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {getTasksByStatus(column.id).map((task) => (
                <Card
                  key={task.id}
                  className="bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">{task.title}</h4>
                        <p className="text-gray-600 dark:text-slate-400 text-xs leading-relaxed">{task.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Task Meta */}
                    <div className="space-y-3">
                      {/* Priority and Node */}
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                          {task.node}
                        </Badge>
                      </div>

                      {/* Progress Bar (for in-progress tasks) */}
                      {task.status === "in-progress" && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-slate-400">Progress</span>
                            <span className="text-gray-900 dark:text-white">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-300 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Due Date */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                          <span className={`${isOverdue(task.dueDate) ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-slate-400"}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue(task.dueDate) && <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400" />}
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                            {task.assignee}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Task Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          {task.comments > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{task.comments}</span>
                            </div>
                          )}
                          {task.attachments > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              <span>{task.attachments}</span>
                            </div>
                          )}
                        </div>
                        {task.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />}
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              className="bg-gray-200/50 dark:bg-slate-700/30 text-gray-600 dark:text-slate-400 border-gray-300/50 dark:border-slate-600/30 text-xs px-2 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button */}
              <Button
                variant="outline"
                className="w-full border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500 bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
