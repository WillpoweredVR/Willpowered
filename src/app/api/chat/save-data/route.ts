import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PrincipleInput {
  text: string;
  description?: string;
  whenTested?: string;
  howToHold?: string;
}

interface SavePrinciplesInput {
  principles: PrincipleInput[];
}

interface SavePurposeInput {
  purpose: string;
}

interface SaveGoalInput {
  title: string;
  description?: string;
  why_statement?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolName, toolInput } = body as { 
      toolName: string; 
      toolInput: SavePrinciplesInput | SavePurposeInput | SaveGoalInput;
    };

    switch (toolName) {
      case "save_principles": {
        const input = toolInput as SavePrinciplesInput;
        
        // Get existing principles
        const { data: profile } = await supabase
          .from("profiles")
          .select("principles")
          .eq("id", user.id)
          .single();

        const existingPrinciples = (profile?.principles as PrincipleInput[] | null) || [];
        
        // Create new principles with IDs
        const newPrinciples = input.principles.map((p, index) => ({
          id: `${Date.now()}-${index}`,
          text: p.text,
          description: p.description || null,
          whenTested: p.whenTested || null,
          howToHold: p.howToHold || null,
          createdAt: new Date().toISOString(),
        }));

        // Merge with existing (or replace if you prefer)
        const allPrinciples = [...existingPrinciples, ...newPrinciples];

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ principles: allPrinciples })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error saving principles:", updateError);
          return NextResponse.json(
            { error: "Failed to save principles" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: `Saved ${newPrinciples.length} principles`,
          principlesCount: allPrinciples.length
        });
      }

      case "save_purpose": {
        const input = toolInput as SavePurposeInput;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ purpose_statement: input.purpose })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error saving purpose:", updateError);
          return NextResponse.json(
            { error: "Failed to save purpose" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: "Purpose statement saved"
        });
      }

      case "save_goal": {
        const input = toolInput as SaveGoalInput;

        // Check for existing goal
        const { data: existingGoal } = await supabase
          .from("goals")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existingGoal) {
          // Update existing goal
          const { error: updateError } = await supabase
            .from("goals")
            .update({
              title: input.title,
              description: input.description || null,
              why_statement: input.why_statement || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingGoal.id);

          if (updateError) {
            console.error("Error updating goal:", updateError);
            return NextResponse.json(
              { error: "Failed to update goal" },
              { status: 500 }
            );
          }

          return NextResponse.json({ 
            success: true, 
            message: "Goal updated"
          });
        } else {
          // Create new goal
          const { error: insertError } = await supabase
            .from("goals")
            .insert({
              user_id: user.id,
              title: input.title,
              description: input.description || null,
              why_statement: input.why_statement || null,
            });

          if (insertError) {
            console.error("Error creating goal:", insertError);
            return NextResponse.json(
              { error: "Failed to create goal" },
              { status: 500 }
            );
          }

          return NextResponse.json({ 
            success: true, 
            message: "Goal created"
          });
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${toolName}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Save data API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

