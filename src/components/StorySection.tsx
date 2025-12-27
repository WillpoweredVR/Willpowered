"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mic, Keyboard, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StorySection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-ember font-medium mb-4 uppercase tracking-wider text-sm">
              My Story
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-8">
              From Setback to<br />
              <span className="text-ember">Breakthrough</span>
            </h2>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                <span className="font-serif text-2xl text-foreground font-medium leading-none">
                  Six years ago, I started to lose the ability to use my hands
                </span>
                {" "}to navigate a phone, drive a car, or type the words you are reading right now.
              </p>
              
              <p>
                Since then, I have learned how to use voice technology to write a book, 
                create web applications, and even build this website without ever 
                touching a keyboard.
              </p>

              <p className="font-semibold text-foreground">
                Now, I want to teach you as well.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="gradient-ember text-white hover:opacity-90 gap-2"
                asChild
              >
                <Link href="/about">
                  Read My Full Story <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Visual representation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-br from-ember/5 to-transparent rounded-3xl" />
            
            <div className="relative space-y-6">
              {/* Challenge card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Keyboard className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">The Challenge</h4>
                  <p className="text-muted-foreground text-sm">
                    Lost the ability to type, drive, and use technology the traditional way
                  </p>
                </div>
              </motion.div>

              {/* Adaptation card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border shadow-sm ml-8"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">The Adaptation</h4>
                  <p className="text-muted-foreground text-sm">
                    Mastered voice technology to write, code, and create without a keyboard
                  </p>
                </div>
              </motion.div>

              {/* Breakthrough card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4 p-6 bg-card rounded-xl border border-ember/30 shadow-lg shadow-ember/5"
              >
                <div className="w-12 h-12 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">The Breakthrough</h4>
                  <p className="text-muted-foreground text-sm">
                    Published a book, built apps, and now helping others strengthen their willpower
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

