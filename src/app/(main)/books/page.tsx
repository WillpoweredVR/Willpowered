"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/ChatModal";

// Metadata handled in layout or via generateMetadata for client components

const bookFormats = [
  {
    name: "Ebook",
    price: "$9.99",
    link: "https://www.amazon.com/Will-Heroes-Proven-Greatness-Anyone-ebook/dp/B01C91RAS2",
    image: "/will-of-heroes-ebook.webp",
  },
  {
    name: "Paperback",
    price: "$19.99",
    link: "https://www.amazon.com/Will-Heroes-Proven-Greatness-Anyone/dp/0997363118",
    image: "/will-of-heroes-paperback.webp",
  },
  {
    name: "Audiobook",
    price: "$19.99",
    link: "https://www.amazon.com/Will-Heroes-Proven-Greatness-Anyone/dp/B01FDPBCQC",
    image: "/will-of-heroes-audiobook.webp",
  },
];

const recommendedBooks = [
  {
    title: "The Willpower Instinct",
    author: "Kelly McGonigal",
    subtitle: "How Self-Control Works, Why It Matters, and What You Can Do To Get More of It",
    description: "Based on Stanford University psychologist Kelly McGonigal's wildly popular course \"The Science of Willpower,\" The Willpower Instinct is the first book to explain the new science of self-control and how it can be harnessed to improve our health, happiness, and productivity.",
    image: "https://covers.openlibrary.org/b/isbn/1583335080-L.jpg",
    link: "https://www.amazon.com/Willpower-Instinct-Self-Control-Works-Matters/dp/1583335080",
  },
  {
    title: "Willpower",
    author: "Roy Baumeister & John Tierney",
    subtitle: "Rediscovering the Greatest Human Strength",
    description: "Pioneering research psychologist Roy F. Baumeister collaborates with New York Times science writer John Tierney to revolutionize our understanding of the most coveted human virtue: self-control. Drawing on cutting-edge research and the wisdom of real-life experts.",
    image: "https://covers.openlibrary.org/b/isbn/0143122231-L.jpg",
    link: "https://www.amazon.com/Willpower-Rediscovering-Greatest-Human-Strength/dp/0143122231",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    subtitle: "",
    description: "Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical. This book will change the way you think about thinking.",
    image: "https://covers.openlibrary.org/b/isbn/0374533555-L.jpg",
    link: "https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555",
  },
  {
    title: "The Power of Habit",
    author: "Charles Duhigg",
    subtitle: "Why We Do What We Do In Life and Business",
    description: "In The Power of Habit, Pulitzer Prize–winning business reporter Charles Duhigg takes us to the thrilling edge of scientific discoveries that explain why habits exist and how they can be changed. Distilling vast amounts of information into engrossing narratives.",
    image: "https://covers.openlibrary.org/b/isbn/081298160X-L.jpg",
    link: "https://www.amazon.com/Power-Habit-What-Life-Business/dp/081298160X",
  },
];

export default function BooksPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section - The Will of Heroes */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Book Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/will-of-heroes-paperback.webp"
                  alt="The Will of Heroes Book"
                  width={300}
                  height={450}
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>

            {/* Book Info */}
            <div className="text-center lg:text-left">
              <h1 className="font-serif text-5xl lg:text-6xl font-bold mb-4">
                The Will of Heroes
              </h1>
              <p className="text-2xl text-slate-300 mb-6 font-serif italic">
                The Proven Path to Greatness That Anyone Can Follow
              </p>
              <p className="text-lg text-slate-400 mb-4 leading-relaxed">
                The product of 5 years of research on how 12 of the world's greatest successes in business, athletics, writing, and many more fields willed themselves to greatness.
              </p>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Their stories will teach you the science behind success and how you can strengthen your willpower to achieve whatever greatness you seek.
              </p>

              {/* Email Signup Form */}
              <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Get a free sample of The Will of Heroes!</h3>
                <form className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ember"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ember"
                    />
                  </div>
                  <Button className="gradient-ember text-white w-full sm:w-auto px-6 py-3 rounded-lg font-semibold">
                    SEND ME A SAMPLE
                  </Button>
                </form>
              </div>

              <Link href="https://www.amazon.com/Will-Heroes-Proven-Greatness-Anyone/dp/0997363118" target="_blank">
                <Button size="lg" className="gradient-ember text-white text-lg px-8 py-6 rounded-xl">
                  Get My Copy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Book Formats */}
      <section className="bg-slate-100 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {bookFormats.map((format) => (
              <Link
                key={format.name}
                href={format.link}
                target="_blank"
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-64 bg-gradient-to-b from-slate-200 to-slate-100 flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={format.image}
                    alt={format.name}
                    width={150}
                    height={200}
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold mb-1">{format.name}</h3>
                  <p className="text-ember font-bold text-lg">{format.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Books Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-center mb-4">
            Recommended Willpower Books
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            These books have shaped my understanding of willpower and will help you on your journey.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendedBooks.map((book) => (
              <div
                key={book.title}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="sm:w-1/3 bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.image}
                    alt={book.title}
                    width={120}
                    height={180}
                    className="rounded shadow-md"
                  />
                </div>
                <div className="sm:w-2/3 p-6 flex flex-col">
                  <h3 className="font-serif text-2xl font-bold mb-1">{book.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">By: {book.author}</p>
                  {book.subtitle && (
                    <p className="text-sm italic text-muted-foreground mb-3">{book.subtitle}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-4">
                    {book.description}
                  </p>
                  <Link
                    href={book.link}
                    target="_blank"
                    className="inline-flex items-center text-ember hover:text-ember/80 font-semibold transition-colors"
                  >
                    Find the Book <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-ember/10 to-background border-t border-ember/20 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
            Ready to Strengthen Your Willpower?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized guidance from our AI coach based on the principles from The Will of Heroes.
          </p>
          <Button 
            size="lg" 
            className="gradient-ember text-white"
            onClick={() => setIsChatOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Talk to AI Coach
          </Button>
        </div>
      </section>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
}
