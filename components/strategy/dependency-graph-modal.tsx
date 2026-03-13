"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  GitBranch, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Pause
} from "lucide-react"

interface Task {
  id: number
  title: string
  status: string
  deadline: string
  priority: string
  assignee: string
  blocker?: string
  startDate: string
  duration: number
  nodeName: string
}

interface Node {
  id: number
  name: string
  riskLevel: string
  confidence: number
  status: string
  assignedTeam: string
  tasks: Task[]
}

interface DependencyGraphModalProps {
  nodes: Node[]
}

export function DependencyGraphModal({ nodes }: DependencyGraphModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "border-green-500 bg-green-500/10"
      case "In Progress":
        return "border-blue-500 bg-blue-500/10"
      case "Blocked":
        return "border-red-500 bg-red-500/10"
      default:
        return "border-slate-500 bg-slate-500/10"
    }
  }

  const allTasks = (nodes || []).flatMap(node => 
    (node.tasks || []).map(task => ({
      ...task,
      nodeName: node.name
    }))
  )

  const isCriticalPath = (task: Task) => {
    return task.priority === "critical" || 
           task.nodeName.includes("Port") || 
           task.nodeName.includes("TSMC")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <GitBranch className="w-4 h-4 mr-2" />
          View Dependencies
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Task Dependency Graph
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full gap-6">
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTasks.map((task) => (
                  <Card 
                    key={task.id}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      getTaskStatusColor(task.status)
                    } ${isCriticalPath(task) ? 'ring-2 ring-red-500/50' : ''}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTaskStatusIcon(task.status)}
                          <h4 className="font-medium text-white text-sm">{task.title}</h4>
                        </div>
                        {isCriticalPath(task) && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            🔥 Critical
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <GitBranch className="w-3 h-3" />
                          <span>{task.nodeName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{task.assignee}</span>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>

                        {task.blocker && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Blocked</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {selectedTask && (
            <div className="w-80 border-l border-slate-700/50 bg-slate-800/30 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</Badge>
                    <Badge className={getTaskStatusColor(selectedTask.status)}>{selectedTask.status}</Badge>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Node:</span>
                    <span className="text-white">{selectedTask.nodeName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assignee:</span>
                    <span className="text-white">{selectedTask.assignee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{selectedTask.duration} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Deadline:</span>
                    <span className="text-white">{selectedTask.deadline}</span>
                  </div>
                </div>

                {selectedTask.blocker && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="font-medium text-red-400">Blocker</span>
                    </div>
                    <p className="text-sm text-red-300">{selectedTask.blocker}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 