import { createClient } from "@/lib/supabase/server";

// Admin email whitelist (fallback if database check fails)
const ADMIN_EMAILS = [
  "colin.robertson3@gmail.com",
  "colin@willpowered.com",
];

/**
 * Check if the current user is an admin
 * First checks database, falls back to email whitelist
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Check database first
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();
    
    // If is_admin is set in DB, use that
    if (profile?.is_admin !== null && profile?.is_admin !== undefined) {
      return profile.is_admin;
    }
    
    // Fallback to email whitelist
    return ADMIN_EMAILS.includes(user.email || "");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if a specific user ID is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", userId)
      .single();
    
    if (profile?.is_admin) return true;
    
    // Fallback to email whitelist
    return ADMIN_EMAILS.includes(profile?.email || "");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin emails list
 */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS;
}
