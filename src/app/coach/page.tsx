import { Header } from "@/components/Header";
import { AICoach } from "@/components/AICoach";

export const metadata = {
  title: "Chat with Willson | Willpowered",
  description: "Get personalized guidance from Willson, your AI coach trained on 'The Will of Heroes' methodology.",
};

export default function CoachPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4">
              Chat with Willson
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get personalized guidance based on the science of perseverance and 
              the wisdom from "The Will of Heroes."
            </p>
          </div>

          {/* Full-page AI Coach */}
          <div className="h-[calc(100vh-250px)] min-h-[500px]">
            <AICoach isFullPage={true} />
          </div>
        </div>
      </main>
    </>
  );
}

