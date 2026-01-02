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

interface MetricInput {
  name: string;
  target: number;
  unit?: string;
  frequency?: string;
}

interface CategoryInput {
  name: string;
  metrics: MetricInput[];
}

interface SaveScorecardInput {
  categories: CategoryInput[];
}

interface UpdatePrincipleContextInput {
  principleText: string;
  whenTested?: string;
  howToHold?: string;
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
      toolInput: SavePrinciplesInput | SavePurposeInput | SaveGoalInput | SaveScorecardInput | UpdatePrincipleContextInput;
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

      case "save_scorecard": {
        const input = toolInput as SaveScorecardInput;

        // Get existing scorecard
        const { data: profile } = await supabase
          .from("profiles")
          .select("scorecard")
          .eq("id", user.id)
          .single();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingScorecard = (profile?.scorecard as any) || { categories: [], data: { history: {} } };
        
        // Build new categories with IDs
        const newCategories = input.categories.map((cat, catIndex) => ({
          id: `cat-${Date.now()}-${catIndex}`,
          name: cat.name,
          metrics: cat.metrics.map((m, metricIndex) => ({
            id: `metric-${Date.now()}-${catIndex}-${metricIndex}`,
            name: m.name,
            target: m.target,
            unit: m.unit || "",
            frequency: m.frequency || "daily",
            createdAt: new Date().toISOString(),
          })),
        }));

        // Merge with existing categories (add new ones)
        const allCategories = [...(existingScorecard.categories || [])];
        
        for (const newCat of newCategories) {
          // Check if category with same name exists
          const existingCatIndex = allCategories.findIndex(
            (c: { name: string }) => c.name.toLowerCase() === newCat.name.toLowerCase()
          );
          
          if (existingCatIndex >= 0) {
            // Add metrics to existing category
            allCategories[existingCatIndex].metrics = [
              ...allCategories[existingCatIndex].metrics,
              ...newCat.metrics,
            ];
          } else {
            // Add new category
            allCategories.push(newCat);
          }
        }

        const updatedScorecard = {
          ...existingScorecard,
          categories: allCategories,
        };

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ scorecard: updatedScorecard })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error saving scorecard:", updateError);
          return NextResponse.json(
            { error: "Failed to save scorecard" },
            { status: 500 }
          );
        }

        const totalMetrics = newCategories.reduce((sum, cat) => sum + cat.metrics.length, 0);
        return NextResponse.json({ 
          success: true, 
          message: `Saved ${totalMetrics} metrics across ${newCategories.length} categories`,
          categoriesCount: allCategories.length,
          metricsCount: totalMetrics
        });
      }

      case "update_principle_context": {
        const input = toolInput as UpdatePrincipleContextInput;
        
        // Get existing principles
        const { data: profile } = await supabase
          .from("profiles")
          .select("principles")
          .eq("id", user.id)
          .single();

        interface ExistingPrinciple {
          id: string;
          text: string;
          description?: string;
          whenTested?: string;
          howToHold?: string;
          createdAt: string;
        }

        const existingPrinciples = (profile?.principles as ExistingPrinciple[] | null) || [];
        
        if (existingPrinciples.length === 0) {
          return NextResponse.json(
            { error: "No principles found to update" },
            { status: 404 }
          );
        }

        // Find the principle by matching text (case-insensitive, partial match)
        const searchText = input.principleText.toLowerCase().trim();
        const principleIndex = existingPrinciples.findIndex(p => {
          const pText = p.text.toLowerCase().trim();
          // Match if the texts are similar (either contains the other or starts the same)
          return pText === searchText || 
                 pText.includes(searchText) || 
                 searchText.includes(pText) ||
                 pText.split(' ').slice(0, 3).join(' ') === searchText.split(' ').slice(0, 3).join(' ');
        });

        if (principleIndex === -1) {
          console.error("Could not find principle:", input.principleText);
          console.error("Available principles:", existingPrinciples.map(p => p.text));
          return NextResponse.json(
            { error: `Could not find principle matching: "${input.principleText}"` },
            { status: 404 }
          );
        }

        // Update the principle with new context
        const updatedPrinciples = [...existingPrinciples];
        updatedPrinciples[principleIndex] = {
          ...updatedPrinciples[principleIndex],
          whenTested: input.whenTested || updatedPrinciples[principleIndex].whenTested,
          howToHold: input.howToHold || updatedPrinciples[principleIndex].howToHold,
        };

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ principles: updatedPrinciples })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating principle context:", updateError);
          return NextResponse.json(
            { error: "Failed to update principle" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: `Updated principle: "${updatedPrinciples[principleIndex].text}"`,
          principle: updatedPrinciples[principleIndex]
        });
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

