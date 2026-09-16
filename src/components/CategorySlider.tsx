import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategorySliderProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  onSelectCategory,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef<boolean>(false);
  const posRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Drag / Click distinction ref
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    scrollStart: number;
    isDragging: boolean;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    scrollStart: 0,
    isDragging: false,
    hasMoved: false,
  });

  // Duplicate categories 3 times to ensure a completely seamless continuous loop
  const duplicatedCategories = categories.length > 0
    ? [...categories, ...categories, ...categories]
    : [];

  const handlePause = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    isPausedRef.current = true;
  }, []);

  const handleResume = useCallback((delay = 800) => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      if (!isHovered && !dragInfoRef.current.isDragging) {
        if (sliderRef.current) {
          posRef.current = sliderRef.current.scrollLeft;
        }
        lastTimeRef.current = performance.now();
        isPausedRef.current = false;
        setIsInteracting(false);
      }
    }, delay);
  }, [isHovered]);

  // Initialize middle position for seamless two-way wrapping
  useEffect(() => {
    const track = sliderRef.current;
    if (!track || categories.length === 0) return;

    // Small delay to let images and DOM compute layout dimensions
    const initTimer = setTimeout(() => {
      const singleSetWidth = track.scrollWidth / 3;
      if (singleSetWidth > 0 && track.scrollLeft === 0) {
        track.scrollLeft = singleSetWidth;
        posRef.current = singleSetWidth;
      }
    }, 100);

    return () => clearTimeout(initTimer);
  }, [categories]);

  // Continuous animation loop using requestAnimationFrame
  useEffect(() => {
    const track = sliderRef.current;
    if (!track || categories.length === 0) return;

    const SPEED_PX_PER_SEC = 38; // Smooth, luxurious continuous pace (pixels/sec)
    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!isPausedRef.current && track && delta < 0.2) {
        posRef.current += SPEED_PX_PER_SEC * delta;

        const singleSetWidth = track.scrollWidth / 3;
        if (singleSetWidth > 0) {
          // Wrap around seamlessly
          if (posRef.current >= singleSetWidth * 2) {
            posRef.current -= singleSetWidth;
            track.scrollLeft = posRef.current;
          } else if (posRef.current <= 0) {
            posRef.current += singleSetWidth;
            track.scrollLeft = posRef.current;
          } else {
            track.scrollLeft = posRef.current;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [categories]);

  // Handle manual arrow button navigation
  const handleManualScroll = (direction: 'left' | 'right') => {
    const track = sliderRef.current;
    if (!track) return;

    handlePause();
    setIsInteracting(true);

    const scrollAmount = track.clientWidth * 0.7;
    const targetScroll = direction === 'left' ? track.scrollLeft - scrollAmount : track.scrollLeft + scrollAmount;

    track.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });

    // Check wrapping and resume
    setTimeout(() => {
      if (track) {
        const singleSetWidth = track.scrollWidth / 3;
        if (singleSetWidth > 0) {
          if (track.scrollLeft >= singleSetWidth * 2) {
            track.scrollLeft -= singleSetWidth;
          } else if (track.scrollLeft <= 0) {
            track.scrollLeft += singleSetWidth;
          }
        }
        posRef.current = track.scrollLeft;
      }
      handleResume(1600);
    }, 450);
  };

  // Mouse Interaction (Desktop)
  const handleMouseEnter = () => {
    setIsHovered(true);
    handlePause();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    if (sliderRef.current) {
      posRef.current = sliderRef.current.scrollLeft;
    }
    lastTimeRef.current = performance.now();
    isPausedRef.current = false;
    setIsInteracting(false);
  };

  // Touch Interactions (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    handlePause();
    setIsInteracting(true);
    const touch = e.touches[0];
    dragInfoRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      scrollStart: sliderRef.current?.scrollLeft || 0,
      isDragging: true,
      hasMoved: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragInfoRef.current.isDragging || !sliderRef.current) return;
    const touch = e.touches[0];
    const diffX = dragInfoRef.current.startX - touch.clientX;
    const diffY = dragInfoRef.current.startY - touch.clientY;

    if (Math.abs(diffX) > 6) {
      dragInfoRef.current.hasMoved = true;
    }

    // Only prevent page scroll if it's clearly a horizontal gesture
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
      sliderRef.current.scrollLeft = dragInfoRef.current.scrollStart + diffX;
      posRef.current = sliderRef.current.scrollLeft;
    }
  };

  const handleTouchEnd = () => {
    dragInfoRef.current.isDragging = false;
    if (sliderRef.current) {
      const track = sliderRef.current;
      const singleSetWidth = track.scrollWidth / 3;
      if (singleSetWidth > 0) {
        if (track.scrollLeft >= singleSetWidth * 2) {
          track.scrollLeft -= singleSetWidth;
        } else if (track.scrollLeft <= 0) {
          track.scrollLeft += singleSetWidth;
        }
      }
      posRef.current = track.scrollLeft;
    }
    handleResume(1200);
  };

  // Safe click handler that doesn't trigger if the user was swiping/dragging
  const handleCardClick = (catId: string) => {
    if (dragInfoRef.current.hasMoved) {
      return;
    }
    onSelectCategory(catId);
  };

  return (
    <section id="categories-section" className="py-14 sm:py-20 bg-[#FAF7F2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block">
                Explore Collections
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C4A882] animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal font-serif-luxury text-[#231B15] tracking-tight">
              Furniture by Category
            </h2>
          </div>

          {/* Manual Arrow Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleManualScroll('left')}
              className="w-9 h-9 rounded-full border border-[#E8E1D7] bg-white text-[#4A3E36] hover:text-[#231B15] hover:border-[#C4B29E] transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManualScroll('right')}
              className="w-9 h-9 rounded-full border border-[#E8E1D7] bg-white text-[#4A3E36] hover:text-[#231B15] hover:border-[#C4B29E] transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
              aria-label="Next categories"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Continuous Automatic Categories Track */}
        <div
          ref={sliderRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 scrollbar-none select-none cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {duplicatedCategories.map((cat, index) => (
            <div
              key={`${cat.id}-${index}`}
              id={`cat-card-${cat.id}-${index}`}
              onClick={() => handleCardClick(cat.id)}
              className="group relative flex-none w-[64vw] sm:w-[36vw] md:w-[26vw] lg:w-[21vw] rounded-2xl overflow-hidden bg-[#F5EFE6] border border-[#E8E1D7] hover:border-[#C4B29E] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="aspect-4/5 w-full overflow-hidden relative pointer-events-none">
                <img
                  src={cat.image}
                  alt={`${cat.name} - Handcrafted Furniture Collection Lahore | GR Furniture`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-700 ease-out select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F1813]/85 via-[#1F1813]/25 to-transparent" />

                {/* Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-serif-luxury font-medium text-white">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-[#E8E1D7] font-light mt-0.5 block group-hover:text-white transition-colors">
                      View Collection
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#6E4D2E] group-hover:text-white transition-all shadow-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
