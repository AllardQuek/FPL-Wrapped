"use client";

import { useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import { Share2, Loader2 } from "lucide-react";

export function ShareButton() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(null);

    // Show/hide button based on mouse movement
    useEffect(() => {
        const handleMouseMove = () => {
            setIsVisible(true);
            
            // Clear existing timer
            if (mouseIdleTimer) {
                clearTimeout(mouseIdleTimer);
            }
            
            // Hide after 3 seconds of no movement
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
            
            setMouseIdleTimer(timer);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        // Show initially
        setIsVisible(true);
        const initialTimer = setTimeout(() => setIsVisible(false), 4000);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            if (mouseIdleTimer) clearTimeout(mouseIdleTimer);
            clearTimeout(initialTimer);
        };
    }, [mouseIdleTimer]);

    const handleShare = useCallback(async (targetId?: string) => {
        setIsGenerating(true);
        try {
            let elementToCapture: HTMLElement | null = null;

            if (targetId) {
                elementToCapture = document.getElementById(targetId);
            }

            if (!elementToCapture) {
                // Find the currently visible section
                const sections = document.querySelectorAll('section');
                let activeSection = null;
                let maxVisibility = 0;

                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                    if (visibleHeight > maxVisibility) {
                        maxVisibility = visibleHeight;
                        activeSection = section;
                    }
                });
                elementToCapture = activeSection as HTMLElement | null;
            }

            // Fallback to body if no section found (shouldn't happen)
            const element = elementToCapture || document.getElementById("wrapped-content") || document.body;

            if (!element) return;

            // Wait for fonts to load properly
            await document.fonts.ready;

            // Convert external images to data URLs to avoid CORS issues on iOS Safari
            const images = element.querySelectorAll('img');
            const imagePromises = Array.from(images).map(async (img) => {
                // Skip if already a data URL
                if (img.src.startsWith('data:')) return;
                
                // Check if it's an external image (not from same origin)
                const isExternal = img.src.startsWith('http') && !img.src.includes(window.location.hostname);
                
                if (isExternal) {
                    try {
                        // Convert to data URL using canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const dataUrl = canvas.toDataURL('image/png');
                            img.src = dataUrl;
                        }
                    } catch (err) {
                        console.warn('Failed to convert image to data URL:', err);
                        // If conversion fails, the image might not appear in screenshot
                    }
                }
            });

            await Promise.all(imagePromises);

            // Small delay to ensure rendering is complete
            await new Promise(resolve => setTimeout(resolve, 150));

            const dataUrl = await toPng(element as HTMLElement, {
                backgroundColor: "#0d0015",
                pixelRatio: 2, // Higher quality
                cacheBust: true, // Prevent caching issues with external images
                filter: (node) => {
                    // Exclude elements with the ignore attribute
                    if (node instanceof HTMLElement && node.hasAttribute("data-html2canvas-ignore")) {
                        return false;
                    }
                    return true;
                },
            });

            // Convert dataUrl to Blob/File for native sharing
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "fpl-wrapped-card.png", { type: "image/png" });

            // Try Native Share API first (Mobile/Desktop support)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My FPL Wrapped',
                    text: 'Check out my FPL Season Summary! See yours at https://fpl-wrapped-season.vercel.app/',
                    files: [file],
                });
            } else {
                // Fallback to download
                const link = document.createElement("a");
                link.download = `FPL-Wrapped-${targetId || (elementToCapture ? (elementToCapture as HTMLElement).id : 'Summary')}.png`;
                link.href = dataUrl;
                link.click();
            }

        } catch (err) {
            console.error("Failed to generate share image:", err);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    // Listen for external share triggers
    useEffect(() => {
        const handleExternalTrigger = (e: Event) => {
            const customEvent = e as CustomEvent;
            handleShare(customEvent.detail?.sectionId);
        };
        window.addEventListener('trigger-share', handleExternalTrigger);
        return () => window.removeEventListener('trigger-share', handleExternalTrigger);
    }, [handleShare]);

    return (
        <div 
            className={`fixed top-20 right-6 md:top-8 md:right-8 z-50 transition-all duration-300 ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'
            }`}
            data-html2canvas-ignore
            onMouseEnter={() => setIsVisible(true)}
        >
            <button
                onClick={() => handleShare()}
                disabled={isGenerating}
                className="group flex items-center gap-2 bg-[#00ff87] hover:bg-[#00e67a] text-[#0d0015] font-black px-4 py-3 md:px-6 md:py-3 rounded-full shadow-lg shadow-[#00ff87]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Share card"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="hidden md:inline">Capturing...</span>
                    </>
                ) : (
                    <>
                        <Share2 className="w-5 h-5" />
                        <span className="hidden md:inline">Share Card</span>
                    </>
                )}
            </button>
        </div>
    );
}
