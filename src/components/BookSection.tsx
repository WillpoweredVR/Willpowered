"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, BookOpen, Headphones, Tablet, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    text: "A scientifically-backed, game-changing, life-improving success!",
    author: "Chris Paredes",
    rating: 5,
  },
  {
    text: "If you liked Robert Greene's Mastery or Malcolm Gladwell's Blink, you're going to LOVE The Will Of Heroes!",
    author: "Ben Austin",
    rating: 5,
  },
  {
    text: "A must-read if you're looking to make massive change and/or become a master of your craft!",
    author: "Katrina Ravazzi",
    rating: 5,
  },
];

const formats = [
  {
    name: "eBook",
    price: "$6.99",
    originalPrice: "$9.99",
    icon: Tablet,
  },
  {
    name: "Paperback",
    price: "$15.99",
    originalPrice: "$19.99",
    icon: BookOpen,
  },
  {
    name: "Audiobook",
    price: "$14.99",
    originalPrice: "$17.95",
    icon: Headphones,
  },
];

export function BookSection() {
  return (
    <section className="py-24 bg-slate-warm text-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Book visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Book mockup */}
            <div className="relative mx-auto w-64 sm:w-80">
              {/* Book shadow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/30 blur-2xl rounded-full" />
              
              {/* Book cover */}
              <div className="relative aspect-[3/4] rounded-lg bg-gradient-to-br from-ember via-ember-dark to-amber-900 shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20" />
                
                {/* Cover content */}
                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
                    <span className="font-serif text-3xl font-bold text-white">W</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                    The Will of Heroes
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    The Science of Willpower Through Stories of Triumph
                  </p>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Colin Robertson
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-ember-light font-medium mb-4 uppercase tracking-wider text-sm">
              The Book
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
              The Will of Heroes
            </h2>
            <p className="text-cream/80 text-lg leading-relaxed mb-8">
              Discover the science behind extraordinary willpower through the inspiring 
              stories of individuals who overcame impossible odds. Learn their strategies, 
              apply their methods, and transform your own capacity for perseverance.
            </p>

            {/* Formats */}
            <div className="flex flex-wrap gap-4 mb-10">
              {formats.map((format) => (
                <div
                  key={format.name}
                  className="flex items-center gap-3 px-5 py-3 bg-cream/10 rounded-xl border border-cream/20"
                >
                  <format.icon className="w-5 h-5 text-ember-light" />
                  <div>
                    <p className="text-sm font-medium text-cream">{format.name}</p>
                    <p className="text-xs">
                      <span className="text-ember-light font-semibold">{format.price}</span>
                      <span className="text-cream/50 line-through ml-2">{format.originalPrice}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="gradient-ember text-white hover:opacity-90 gap-2"
                asChild
              >
                <Link href="/books/the-will-of-heroes">
                  Get Your Copy <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-cream/30 text-cream hover:bg-cream/10"
                asChild
              >
                <Link href="/books/the-will-of-heroes#preview">
                  Read Preview
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 bg-cream/5 rounded-xl border border-cream/10"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-ember/30" />
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-ember-light text-ember-light" />
                ))}
              </div>
              
              <p className="text-cream/90 italic mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <p className="text-sm text-cream/60">
                - {testimonial.author}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

