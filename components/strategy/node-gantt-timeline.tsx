"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  GitBranch,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

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
  tasks: Task[]
  progress: number
}

interface NodeGanttTimelineProps {
  nodes: Node[]
}

export function NodeGanttTimeline({ nodes }: NodeGanttTimelineProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null)

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-500"
      case "In Progress":
        return "bg-blue-500"
      case "Blocked":
        return "bg-red-500"
      default:
        return "bg-slate-500"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case "In Progress":
        return <Clock className="w-3 h-3 text-blue-400" />
      case "Blocked":
        return <XCircle className="w-3 h-3 text-red-400" />
      default:
        return <Pause className="w-3 h-3 text-slate-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTimelineDates = () => {
    const allTasks = nodes.flatMap(node => node.tasks)
    const startDates = allTasks.map(task => new Date(task.startDate))
    const endDates = allTasks.map(task => {
      const start = new Date(task.startDate)
      start.setDate(start.getDate() + task.duration)
      return start
    })
    
    const minDate = new Date(Math.min(...startDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())))
    
    const dates = []
    const current = new Date(minDate)
    while (current <= maxDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  const getTaskPosition = (task: Task) => {
    const dates = getTimelineDates()
    const startDate = new Date(task.startDate)
    const startIndex = dates.findIndex(date => 
      date.toDateString() === startDate.toDateString()
    )
    const width = (task.duration / dates.length) * 100
    const left = (startIndex / dates.length) * 100
    
    return { left: `${left}%`, width: `${width}%` }
  }

  const getCompletionPercentage = (node: Node) => {
    const totalTasks = node.tasks.length
    const completedTasks = node.tasks.filter(task => task.status === "Done").length
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const getNodeStatusColor = (node: Node) => {
    const percentage = getCompletionPercentage(node)
    if (percentage >= 80) return "border-green-500 bg-green-500/20"
    if (percentage >= 50) return "border-blue-500 bg-blue-500/20"
    if (percentage >= 20) return "border-yellow-500 bg-yellow-500/20"
    return "border-red-500 bg-red-500/20"
  }

  const timelineDates = getTimelineDates()

  return (
    <TooltipProvider>
      <Card className="bg-white border-gray-200 dark:bg-slate-800/60 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gantt Timeline</h3>
              <p className="text-sm text-gray-700 dark:text-slate-400 font-normal">Visualize task dependencies and timelines</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 shadow-md rounded-xl dark:bg-slate-800/40 dark:border-slate-700/50">
              <div className="flex items-center gap-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">Timeline Overview</h4>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
                  {timelineDates.length} days
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Blocked</span>
                </div>
              </div>
            </div>

            {/* Date Header */}
            <div className="relative">
              <div className="flex border-b border-gray-200 shadow-sm bg-white dark:bg-slate-800/40 dark:border-slate-700/50">
                <div className="w-48 flex-shrink-0 p-3 bg-white dark:bg-slate-800/50 border-r border-gray-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">Nodes & Tasks</span>
                </div>
                <div className="flex-1 flex flex-wrap">
                  {timelineDates.map((date, index) => (
                    <div 
                      key={index} 
                      className="flex-1 p-2 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 bg-white dark:bg-slate-800/30 basis-1/2 md:basis-auto"
                    >
                      <div className="text-xs font-bold text-gray-800 dark:text-white">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Rows */}
            <div className="space-y-2">
              {nodes.map((node, nodeIndex) => (
                <div key={node.id} className="relative bg-white border border-gray-200 shadow-md rounded-xl dark:bg-slate-800/40 dark:border-slate-700/50 mb-4">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{node.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{node.tasks.length} tasks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30">{node.progress}% Complete</Badge>
                      <Progress value={node.progress} className="h-2 bg-gray-200 dark:bg-slate-700 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Summary */}
            <Card className="bg-gray-50 border-gray-100 dark:bg-slate-700/30 dark:border-slate-600/50 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {nodes.reduce((sum, node) => sum + node.tasks.length, 0)}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-slate-300">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {nodes.reduce((sum, node) => 
                        sum + node.tasks.filter(task => task.status === "Done").length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-slate-300">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {nodes.reduce((sum, node) => 
                        sum + node.tasks.filter(task => task.status === "In Progress").length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-slate-300">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                      {nodes.reduce((sum, node) => 
                        sum + node.tasks.filter(task => task.status === "Blocked").length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-slate-300">Blocked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </TooltipProvider>
  )
} 