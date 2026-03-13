"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface Node {
  id: number
  name: string
  riskLevel: string
  confidence: number
  status: string
  assignedTeam: string
  tasks: Array<{
    id: number
    title: string
    status: string
    deadline: string
    priority: string
    assignee: string
    blocker?: string
  }>
}

interface ExecutionFlowMapProps {
  nodes: Node[]
}

export function ExecutionFlowMap({ nodes }: ExecutionFlowMapProps) {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)

  // Handle empty or undefined nodes
  if (!nodes || nodes.length === 0) {
    return (
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Execution Nodes</h3>
          <p className="text-slate-400">No strategy execution nodes have been generated yet.</p>
        </CardContent>
      </Card>
    )
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "Planning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getCompletionPercentage = (node: Node) => {
    const totalTasks = node.tasks.length
    const completedTasks = node.tasks.filter(task => task.status === "Done").length
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "border-green-500 bg-green-500/20"
      case "In Progress":
        return "border-blue-500 bg-blue-500/20"
      case "Planning":
        return "border-yellow-500 bg-yellow-500/20"
      default:
        return "border-slate-600 bg-slate-700"
    }
  }

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-slate-800/60 border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Execution Flow Map</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 font-normal">Visualize the strategy execution timeline</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Container */}
            <div className="flex items-center justify-between p-8 bg-gradient-to-r from-gray-200/80 to-gray-100/80 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
              
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 transform -translate-y-1/2" />
              
              {nodes.map((node, index) => (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative flex flex-col items-center cursor-pointer group"
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      {/* Node Circle */}
                      <div className={`
                        relative w-20 h-20 rounded-full border-3 flex items-center justify-center mb-4 transition-all duration-500 hover:scale-110
                        ${hoveredNode?.id === node.id 
                          ? 'border-blue-500 bg-blue-500/20 shadow-2xl shadow-blue-500/30 transform scale-110' 
                          : `${getNodeStatusColor(node.status)} hover:border-slate-500 hover:shadow-lg`
                        }
                      `}>
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          {node.name.split(' ').map(word => word[0]).join('')}
                        </span>
                        
                        {/* Status Indicator */}
                        <div className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-800 rounded-full border-2 border-gray-300 dark:border-slate-700">
                          {getStatusIcon(node.status)}
                        </div>
                        
                        {/* Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-gray-300 dark:text-slate-600"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${getCompletionPercentage(node) * 2.26} 226`}
                            className={`transition-all duration-1000 ease-out ${
                              getCompletionPercentage(node) > 80 ? 'text-green-400' :
                              getCompletionPercentage(node) > 50 ? 'text-blue-400' :
                              getCompletionPercentage(node) > 20 ? 'text-yellow-400' : 'text-red-400'
                            }`}
                          />
                        </svg>

                        {/* Pulse Animation for Active Nodes */}
                        {node.status === "In Progress" && (
                          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
                        )}
                      </div>
                      
                      {/* Node Label */}
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{node.name}</p>
                        <Badge className={`text-xs ${getRiskLevelColor(node.riskLevel)}`}>
                          {node.riskLevel}
                        </Badge>
                        <div className="mt-2 text-xs text-gray-600 dark:text-slate-400">
                          {getCompletionPercentage(node)}% Complete
                        </div>
                      </div>
                      
                      {/* Connection Line */}
                      {index < nodes.length - 1 && (
                        <div className="absolute top-10 left-full w-16 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300 dark:from-slate-600 dark:to-slate-500 transform translate-x-1" />
                      )}
                    </div>
                  </TooltipTrigger>
                  
                  <TooltipContent side="top" className="w-80 p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{node.name}</h4>
                        <Badge className={getRiskLevelColor(node.riskLevel)}>{node.riskLevel}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{node.assignedTeam}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getCompletionPercentage(node)}% Complete</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-slate-400">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">{getCompletionPercentage(node)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                              getCompletionPercentage(node) > 80 ? 'bg-green-500' :
                              getCompletionPercentage(node) > 50 ? 'bg-blue-500' :
                              getCompletionPercentage(node) > 20 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${getCompletionPercentage(node)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">Tasks ({node.tasks.length})</p>
                        {node.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-xs p-2 bg-gray-100 dark:bg-slate-700/50 rounded">
                            <span className="text-gray-700 dark:text-slate-300 truncate flex-1">{task.title}</span>
                            <Badge className={`text-xs ${
                              task.status === "Done" ? "bg-green-500/20 text-green-400" :
                              task.status === "In Progress" ? "bg-blue-500/20 text-blue-400" :
                              task.status === "Blocked" ? "bg-red-500/20 text-red-400" :
                              "bg-slate-500/20 text-slate-400"
                            }`}>
                              {task.status}
                            </Badge>
                          </div>
                        ))}
                        {node.tasks.length > 3 && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 text-center">+{node.tasks.length - 3} more tasks</p>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-8 p-4 bg-gray-100 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-blue-400" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-yellow-400" />
                <span>Planning</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-red-400" />
                <span>Blocked</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 