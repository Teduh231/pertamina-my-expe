
'use client';

import { useState, useEffect } from 'react';

export function TypingAnimation({ text, speed = 150, deleteSpeed = 75, delay = 2000 }: { text: string, speed?: number, deleteSpeed?: number, delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isDeleting) {
      if (index > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(text.substring(0, index - 1));
          setIndex(index - 1);
        }, deleteSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
      }
    } else {
      if (index < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(text.substring(0, index + 1));
          setIndex(index + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), delay);
        return () => clearTimeout(timeout);
      }
    }
  }, [index, isDeleting, text, speed, deleteSpeed, delay]);

  return (
    <span>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
