import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { Message } from '../utils';

interface UseAutoScrollProps {
  messages: Message[];
  isStreaming: boolean;
}

export function useAutoScroll({ messages, isStreaming }: UseAutoScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isInternalScroll = false;
    let lastUserScrollTime = 0;
    let rafId: number;
    let animation: { stop: () => void } | null = null;

    const handleUserScroll = () => {
      if (!isInternalScroll) {
        lastUserScrollTime = Date.now();
        if (animation) animation.stop();
      }
    };

    container.addEventListener('scroll', handleUserScroll, { passive: true });

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (!container) return;
      
      const targetScrollTop = container.scrollHeight - container.clientHeight;
      if (Math.abs(container.scrollTop - targetScrollTop) < 2) return; 

      if (animation) animation.stop();

      isInternalScroll = true;
      if (behavior === 'smooth') {
        animation = animate(container.scrollTop, targetScrollTop, {
          type: "spring",
          stiffness: 150,
          damping: 25,
          onUpdate: (latest) => {
            container.scrollTop = latest;
          },
          onComplete: () => {
            isInternalScroll = false;
            animation = null;
          }
        });
      } else {
        container.scrollTop = targetScrollTop;
        setTimeout(() => { isInternalScroll = false; }, 100);
      }
    };

    let lastScrollHeight = container.scrollHeight;

    const resizeObserver = new ResizeObserver(() => {
      const currentScrollHeight = container.scrollHeight;
      const isShrinking = currentScrollHeight < lastScrollHeight;
      lastScrollHeight = currentScrollHeight;

      // If user is actively scrolling, don't hijack unless it's streaming and they're near the bottom
      if (isShrinking && !isStreaming) return;
      if (Date.now() - lastUserScrollTime < 2000) return;

      const threshold = 150;
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isAtBottom = distanceFromBottom < threshold;
      
      if (isAtBottom || (isStreaming && distanceFromBottom < 500)) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          scrollToBottom(isStreaming ? 'smooth' : 'auto');
        });
      }
    });

    resizeObserver.observe(container);

    // Also trigger on messages change
    if (messages.length > 0) {
      scrollToBottom(isStreaming ? 'smooth' : 'auto');
    }

    return () => {
      container.removeEventListener('scroll', handleUserScroll);
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      if (animation) animation.stop();
    };
  }, [messages.length, isStreaming]);

  return { scrollContainerRef };
}
