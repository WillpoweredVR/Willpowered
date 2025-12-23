"use client";

import { useState } from "react";
import { AICoach, AICoachButton } from "./AICoach";
import { AnimatePresence } from "framer-motion";

export function AICoachWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <AICoach 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>
      
      {!isOpen && (
        <AICoachButton onClick={() => setIsOpen(true)} />
      )}
    </>
  );
}

