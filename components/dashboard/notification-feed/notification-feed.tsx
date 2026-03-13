"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Info, BellOff, X, ArrowRight, Plus, Route, MapPin, Package, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import Lottie from "lottie-react"
import comingSoonAnimation from "@/public/animations/coming-soon.json"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Import API functions and types
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/notifications"
import { getUserData } from "@/utils/functions/userUtils"
import type { Tables } from "@/lib/types/database"

// Import local modules
import { INITIAL_DISPLAY_COUNT } from "./constants"
import { safeDateFormat, getNotificationType, getNotificationIcon, truncateMessage } from "./functions"
import { SourceBubble} from "./components"
import type { NotificationType, MainTab, Notification, NotificationCitations } from "./types"

export function NotificationFeed() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("alerts")
  const [showMore, setShowMore] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<Tables<'users'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserData()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return

    async function fetchNotifications() {
      if (!user?.id) return
      try {
        setLoading(true)
        const fetchedNotifications = await getNotifications(user.id)
        setNotifications(fetchedNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [user, toast])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.notification_id === id ? { ...n, read_status: true } : n
      ))
      toast({
        title: "Marked as read",
        description: "Notification marked as read successfully",
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      await markAllNotificationsAsRead(user.id)
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })))
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setDialogOpen(true)
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
    }
  }

  const renderNotificationIcon = (notification: Notification) => {
    const iconData = getNotificationIcon(notification)
    
    switch (iconData.type) {
      case 'route':
        return <Route className={iconData.className} />
      case 'factory':
        return <Factory className={iconData.className} />
      default:
        return <Package className={iconData.className} />
    }
  }

  const renderNotificationList = () => {
    const displayNotifications = showMore 
      ? notifications 
      : notifications.slice(0, INITIAL_DISPLAY_COUNT)
    
    const hasMoreNotifications = notifications.length > INITIAL_DISPLAY_COUNT
    const unreadCount = notifications.filter(n => !n.read_status).length

    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-4 bg-white dark:bg-gray-900 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            disabled={unreadCount === 0}
          >
            <BellOff className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {displayNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400"
              >
                <BellOff className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No notifications to display</p>
              </motion.div>
            ) : (
              displayNotifications.map((notification, index) => {
                const type = getNotificationType(notification)
                const citations = notification.citations as NotificationCitations | null
                const isRead = notification.read_status || false
                const truncatedMessage = truncateMessage(notification.message)

                return (
                  <motion.div
                    key={notification.notification_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "rounded-lg border p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                      isRead 
                        ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" 
                        : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    )}
                    onClick={() => handleViewDetails(notification)}
                  >
                    {/* Main content */}
                    <div className="flex items-start gap-4 mb-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="rounded-full p-2 bg-gray-100 dark:bg-gray-800">
                          {renderNotificationIcon(notification)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-base leading-relaxed">{notification.title}</p>
                            {!isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {notification.severity && (
                              <Badge variant="outline" className={`text-xs px-2 py-1 font-medium ${
                                notification.severity === 'HIGH' 
                                  ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
                                  : notification.severity === 'MEDIUM'
                                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}>
                                {notification.severity}
                              </Badge>
                            )}
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.notification_id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {truncatedMessage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">{truncatedMessage}</p>
                        )}

                        {/* Simplified metadata row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {notification.created_at && safeDateFormat(notification.created_at) || "Unknown time"}
                            </p>
                            
                            {/* Show source count if available */}
                            {(() => {
                              const citations = notification.citations as NotificationCitations | null
                              const sourceCount = citations?.sources?.length || 0
                              const entityCount = citations?.affectedEntities?.length || 0
                              const relationshipCount = citations?.relationships?.length || 0
                              
                              if (sourceCount > 0 || entityCount > 0 || relationshipCount > 0) {
                                return (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span>•</span>
                                    {sourceCount > 0 && <span>{sourceCount} sources</span>}
                                    {entityCount > 0 && sourceCount > 0 && <span>•</span>}
                                    {entityCount > 0 && <span>{entityCount} entities</span>}
                                    {relationshipCount > 0 && (sourceCount > 0 || entityCount > 0) && <span>•</span>}
                                    {relationshipCount > 0 && <span>{relationshipCount} risks</span>}
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(notification)
                            }}
                          >
                            View Details
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sources - clean layout */}
                    {(() => {
                      const citations = notification.citations as NotificationCitations | null
                      if (citations?.sources && citations.sources.length > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex flex-wrap gap-2">
                              {/* Show first 2 sources */}
                              {citations.sources.slice(0, 2).map((source, idx) => (
                                <SourceBubble key={idx} source={source} />
                              ))}
                              {/* Show count if more than 2 sources */}
                              {citations.sources.length > 2 && (
                                <div className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700">
                                  +{citations.sources.length - 2} more sources
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Show More Button */}
        {hasMoreNotifications && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {showMore ? (
                <span>Show Less</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Show {notifications.length - INITIAL_DISPLAY_COUNT} More</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 flex space-x-1 w-fit">
          {[
            { id: "alerts" as MainTab, label: "Real-Time Alerts" },
            { id: "activity" as MainTab, label: "Recent Activity" },
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`relative px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeMainTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
        <Button variant="link" asChild>
          <Link href="/news-room" className="flex items-center text-sm">
            View Real-Time Alerts
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeMainTab === "alerts" && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {renderNotificationList()}
          </motion.div>
        )}
        {activeMainTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Lottie 
                animationData={comingSoonAnimation} 
                loop={true}
                autoplay={true}
                style={{ width: 300, height: 300 }}
              />
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  We're working hard to bring you detailed activity tracking. 
                  Stay tuned for updates on your supply chain activities.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full p-1.5 bg-gray-100 dark:bg-gray-800">
                    {renderNotificationIcon(selectedNotification)}
                  </div>
                  <DialogTitle className="text-lg font-semibold">{selectedNotification.title}</DialogTitle>
                  {selectedNotification.severity && (
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                      selectedNotification.severity === 'HIGH' 
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
                        : selectedNotification.severity === 'MEDIUM'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {selectedNotification.severity}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {getTypeIcon(getNotificationType(selectedNotification))}
                  <span>{selectedNotification.created_at && safeDateFormat(selectedNotification.created_at) || "Unknown time"}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedNotification.notification_type?.replace('_', ' ')}</span>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Full Message */}
                {selectedNotification.message && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Details</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedNotification.message}
                      </p>
                    </div>
                  </div>
                )}

                {(() => {
                  const citations = selectedNotification.citations as NotificationCitations | null
                  
                  return (
                    <>
                      {/* Sources */}
                      {citations?.sources && citations.sources.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Sources ({citations.sources.length})</h4>
                          <div className="space-y-2">
                            {citations.sources.map((source, idx) => (
                              <SourceBubble key={idx} source={source} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Relationships */}
                      {citations?.relationships && citations.relationships.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Risk Relationships ({citations.relationships.length})</h4>
                          <div className="space-y-3">
                            {citations.relationships.map((relationship, idx) => (
                              <div key={idx} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="font-medium text-orange-700 dark:text-orange-300 text-sm">
                                    {Math.round(relationship.strength * 100)}% Impact Strength
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{relationship.source}</span>
                                  <span className="mx-2 text-gray-500">→</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{relationship.target}</span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Impact: {relationship.relationship}
                                </div>
                                {relationship.context && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Context: {relationship.context}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affected Entities */}
                      {citations?.affectedEntities && citations.affectedEntities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Affected Entities ({citations.affectedEntities.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {citations.affectedEntities.map((entity, idx) => (
                              <div key={idx} className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                                <MapPin className="w-3 h-3 mr-1" />
                                {entity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      {citations && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Additional Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {citations.category && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">{citations.category.toLowerCase()}</div>
                              </div>
                            )}
                            {citations.confidence && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confidence</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">{Math.round(citations.confidence * 100)}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Notification ID: {selectedNotification.notification_id}
                  </div>
                  {!selectedNotification.read_status && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.notification_id)
                        setDialogOpen(false)
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
