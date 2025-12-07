import React, { useEffect, useRef, useState } from 'react';

interface FadeImageProps {
  src: string;
  alt?: string;
  enableEffect: boolean;
  className?: string;
}

export const FadeImage: React.FC<FadeImageProps> = ({ src, alt, enableEffect, className = '' }) => {
  const [isVisible, setIsVisible] = useState(!enableEffect);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableEffect) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Optional: Set to false if you want it to fade out when scrolling away
          // setIsVisible(false); 
        }
      });
    }, { threshold: 0.2 }); // Trigger when 20% visible

    const currentElement = domRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [enableEffect]);

  return (
    <div 
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <img 
        src={src} 
        alt={alt || "Story visual"} 
        className="w-full h-auto rounded-lg shadow-md object-cover max-h-[600px]"
      />
    </div>
  );
};