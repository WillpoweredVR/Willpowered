"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, 
  BookOpen, 
  Flame, 
  Heart, 
  Lightbulb,
  ArrowRight,
  Quote,
  Mic,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/ChatModal";

export default function AboutPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-ember blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-amber-500 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Profile Image */}
            <div className="mb-8">
              <div className="relative w-44 h-44 mx-auto overflow-hidden rounded-full border-4 border-ember/30 shadow-2xl">
                <Image
                  src="/colin-robertson-headshot.jpeg"
                  alt="Colin Robertson"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <p className="text-ember font-medium mb-4 uppercase tracking-wider">My Story</p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              From Burning Out to <br />
              <span className="text-ember">Building Up</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              I spent years researching the science of willpower and pushing myself to the breaking point. 
              Now I&apos;m using AI to help others achieve greatness—without paying the price I did.
            </p>
          </div>
        </div>
      </section>

      {/* The Journey Begins */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-3">
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  The Obsession That Changed Everything
                </h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p>
                    I&apos;ve always believed that <strong className="text-foreground">the human brain is the most marvelous tool in the known universe</strong>. 
                    There&apos;s greatness at the center of every human mind, just waiting to be unlocked.
                  </p>
                  <p>
                    In 2011, I became obsessed with understanding how we unlock that potential. I read everything I could find on 
                    neuroscience, decision-making, habit formation, and the psychology of achievement. I used these lessons to push 
                    past my comfort zone as an introvert, achieve success as an athlete, and embrace the uncertainty of entrepreneurship.
                  </p>
                  <p>
                    The common thread? <strong className="text-foreground">Willpower</strong>. The ability to do what needs to be done, 
                    even when you don&apos;t feel like it.
                  </p>
                  <p>
                    After four years of learning and applying these principles, I launched Willpowered—a blog dedicated to sharing 
                    the science of perseverance. I wanted to help others unlock the greatness within their minds.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-ember/10 to-amber-500/5 border border-ember/20 rounded-2xl p-8">
                  <Flame className="w-10 h-10 text-ember mb-4" />
                  <h3 className="font-serif text-xl font-semibold mb-3">My Purpose</h3>
                  <p className="text-muted-foreground italic">
                    &ldquo;To help individuals use the tools of science to unlock the greatness within their mind 
                    and take control of their future.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Book */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="relative">
                  <Image
                    src="/will-of-heroes-paperback.webp"
                    alt="The Will of Heroes"
                    width={350}
                    height={450}
                    className="rounded-lg shadow-2xl mx-auto"
                  />
                </div>
              </div>
              <div>
                <BookOpen className="w-10 h-10 text-ember mb-4" />
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  The Will of Heroes
                </h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p>
                    In 2015, I ran a Kickstarter campaign to publish my first book. With only 10 days left and less than 
                    half my goal raised, I refused to give up. More time at the keyboard. Less sleep. Repeat.
                  </p>
                  <p>
                    <strong className="text-foreground">By some miracle, I raised $13,000.</strong> I moved to Florida, 
                    eliminated all distractions, and wrote 140,000 words in three months.
                  </p>
                  <p>
                    The book shares the stories of twelve extraordinary individuals—from Arnold Schwarzenegger to 
                    Helen Keller—and the science behind how they willed themselves to greatness.
                  </p>
                </div>
                <Link href="/books">
                  <Button className="mt-6 gradient-ember text-white">
                    Get the Book <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Dark Side */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-6">
                The Dark Side of Willpower
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Success came at a terrible cost—one I didn&apos;t see coming until it was too late.
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-8 lg:p-12 mb-12">
              <Quote className="w-12 h-12 text-ember/50 mb-6" />
              <blockquote className="font-serif text-2xl lg:text-3xl italic leading-relaxed mb-6">
                &ldquo;I&apos;m only 31 years young and I can no longer use my hands to navigate my phone, 
                drive a car, or type the words you are reading now.&rdquo;
              </blockquote>
              <p className="text-slate-400">
                This is not due to any medical condition or genetic disability. It&apos;s the result of 
                pushing myself too hard for too long.
              </p>
            </div>

            <div className="prose prose-lg text-muted-foreground max-w-none">
              <p>
                I applied the science of willpower to push through fatigue, pain, and every signal my body 
                sent me to slow down. I told myself that the discomfort was just my brain being conservative—that 
                I could push through like the heroes I studied.
              </p>
              <p>
                I was wrong. <strong className="text-foreground">Willpower without wisdom is dangerous.</strong>
              </p>
              <p>
                The damage accumulated over years of 14-hour days at the keyboard. Writing, editing, promoting, 
                building online courses—all while ignoring the pain creeping through my wrists and hands.
              </p>
              <p>
                When I finally sought medical help, the specialists delivered devastating news: 
                <strong className="text-foreground"> I would likely never be able to type on a keyboard or tap on a phone again.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Voice Revolution */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Mic className="w-12 h-12 text-ember mx-auto mb-4" />
              <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
                Finding Hope in Technology
              </h2>
            </div>

            <div className="prose prose-lg prose-invert max-w-none mb-12">
              <p>
                As I looked at braces on both my hands, a thought occurred to me: 
                <em className="text-ember"> I am truly lucky to be living in this time.</em>
              </p>
              <p>
                The human hand is a marvelous tool. But it is not as marvelous as the human brain. 
                I had the wealth of all human knowledge available on the internet and emerging tools 
                that could help me accomplish work without my hands.
              </p>
              <p>
                I became an early adopter of voice technology. What started as a necessity became a revelation. 
                <strong> In today&apos;s world, you do not need the use of your hands to do meaningful work. 
                All you need is your mind.</strong>
              </p>
              <p>
                Every word on this website was created using voice commands. And as AI technology has evolved, 
                I&apos;ve realized something even more profound...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The AI Vision */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Brain className="w-12 h-12 text-ember mb-6" />
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Why I&apos;m Building an AI Coach
                </h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p>
                    I spent years learning the hard way. I pushed myself to the breaking point, 
                    made countless mistakes, and paid a permanent physical price.
                  </p>
                  <p>
                    <strong className="text-foreground">What if there was a better way?</strong>
                  </p>
                  <p>
                    What if you could learn from all the heroes I studied, apply the proven science of willpower, 
                    and get personalized guidance—without the trial and error that cost me my hands?
                  </p>
                  <p>
                    That&apos;s why I&apos;m building the Willpowered AI Coach. It contains everything I&apos;ve learned 
                    from a decade of research, the stories of twelve extraordinary achievers, and the hard-won 
                    wisdom from my own journey.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-ember/10 to-background border border-ember/30 rounded-2xl p-8">
                <Lightbulb className="w-10 h-10 text-ember mb-4" />
                <h3 className="font-serif text-2xl font-semibold mb-4">The Mission Continues</h3>
                <p className="text-muted-foreground mb-6">
                  My purpose hasn&apos;t changed. I still want to help individuals unlock the greatness within 
                  their minds. But now, I can do it in a way that&apos;s accessible to everyone—without requiring 
                  them to sacrifice their health or spend years learning through painful trial and error.
                </p>
                <Button 
                  className="gradient-ember text-white"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Talk to the AI Coach
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Beliefs */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              What I Believe
            </h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything I create
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Greatness is learnable",
                description: "The heroes I studied weren't born exceptional. They became exceptional through deliberate effort and the right methodology."
              },
              {
                title: "Science beats motivation",
                description: "Motivation fades. Understanding how your brain works and building systems based on science creates lasting change."
              },
              {
                title: "Wisdom prevents suffering",
                description: "You don't have to learn every lesson the hard way. The stories of those who came before can light your path."
              },
              {
                title: "Technology amplifies humanity",
                description: "AI and voice technology don't replace human potential—they remove barriers to achieving it."
              },
              {
                title: "Balance enables endurance",
                description: "Sustainable success requires knowing when to push and when to rest. I learned this the hard way."
              },
              {
                title: "Everyone deserves a coach",
                description: "Personalized guidance shouldn't be a luxury. AI can democratize access to world-class mentorship."
              },
            ].map((belief, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6"
              >
                <Heart className="w-8 h-8 text-ember mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">{belief.title}</h3>
                <p className="text-muted-foreground text-sm">{belief.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl gradient-ember flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Whether you&apos;re looking to build better habits, find your purpose, or push through a challenge, 
              the AI Coach is here to guide you—drawing from the same research and stories that changed my life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="gradient-ember text-white hover:opacity-90"
                onClick={() => setIsChatOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Talk to AI Coach
              </Button>
              <Link href="/journey/finding-your-purpose">
                <Button size="lg" variant="outline">
                  Start the 7-Step Journey <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

