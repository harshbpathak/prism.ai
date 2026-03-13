import { supabaseClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"

export async function getNotifications(userId: string): Promise<Tables<"notifications">[]> {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      if (error.code === 'PGRST205' || error.code === '404') {
        // Table doesn't exist yet, return empty array silently to prevent console spam
        return [];
      }
      console.error("Error fetching notifications:", error)
      return [];
    }
    return data || []
  } catch (error) {
    // Silently return empty array to prevent console spam for missing table
    return [];
  }
}


export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabaseClient
    .from("notifications")
    .update({ read_status: true })
    .eq("notification_id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabaseClient
    .from("notifications")
    .update({ read_status: true })
    .eq("user_id", userId)
    .eq("read_status", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}
