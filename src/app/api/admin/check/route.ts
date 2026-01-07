import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Admin email whitelist (fallback if database check fails)
const ADMIN_EMAILS = [
  "colin.robertson3@gmail.com",
  "colin@willpowered.com",
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ isAdmin: false, reason: "Not authenticated" });
    }
    
    // Check database first
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();
    
    // If is_admin is set in DB, use that
    if (profile?.is_admin === true) {
      return NextResponse.json({ isAdmin: true, email: user.email });
    }
    
    // Fallback to email whitelist
    const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "");
    
    return NextResponse.json({ 
      isAdmin: isAdminByEmail, 
      email: user.email,
      method: isAdminByEmail ? "email_whitelist" : "none"
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false, error: "Server error" }, { status: 500 });
  }
}
