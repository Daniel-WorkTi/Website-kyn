"use client";

import { useEffect, useRef, useState } from "react";
import type { Hero } from "@/lib/types";
import { videoMimeType } from "@/lib/utils";

interface HeroProps {
  hero: Hero;
  brand: string;
  interactive?: boolean;
  showContent?: boolean;
}

export default function Hero({ hero, brand, interactive = true, showContent = true }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const vid1Ref = useRef<HTMLVideoElement>(null);
  const vid2Ref = useRef<HTMLVideoElement>(null);
  const showingSecondRef = useRef(false);
  const textExitingRef = useRef(false);
  const [showingSecond, setShowingSecond] = useState(false);
  const [textExiting, setTextExiting] = useState(false);

  const videos = hero.videos || [];
  const title = (hero.title || brand).toUpperCase();
  const lines = (hero.subtitleLines || []).map((line) => line.toUpperCase());

  useEffect(() => {
    if (!interactive) return;

    const swapVideo = (toSecond: boolean) => {
      const vid1 = vid1Ref.current;
      const vid2 = vid2Ref.current;
      if (!vid1 || !vid2 || showingSecondRef.current === toSecond) return;

      showingSecondRef.current = toSecond;
      setShowingSecond(toSecond);

      const active = toSecond ? vid2 : vid1;
      const inactive = toSecond ? vid1 : vid2;
      active.play().catch(() => {});
      inactive.pause();
    };

    const setTextExit = (shouldExit: boolean) => {
      if (shouldExit === textExitingRef.current) return;
      textExitingRef.current = shouldExit;
      setTextExiting(shouldExit);
    };

    const isHeroInView = () => {
      const heroEl = heroRef.current;
      if (!heroEl) return false;
      const rect = heroEl.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const updateHeroOnScroll = () => {
      const vh = window.innerHeight;
      const scrolled = Math.max(0, window.scrollY);

      swapVideo(scrolled > vh * 0.05);
      setTextExit(scrolled > vh * 0.15);
    };

    const onWheel = (e: WheelEvent) => {
      if (!isHeroInView()) return;

      if (e.deltaY > 2) {
        swapVideo(true);
        setTextExit(true);
      }

      if (e.deltaY < -2 && window.scrollY <= 8) {
        swapVideo(false);
        setTextExit(false);
      }
    };

    window.addEventListener("scroll", updateHeroOnScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    updateHeroOnScroll();
    return () => {
      window.removeEventListener("scroll", updateHeroOnScroll);
      window.removeEventListener("wheel", onWheel);
    };
  }, [interactive]);

  useEffect(() => {
    const vid1 = vid1Ref.current;
    const vid2 = vid2Ref.current;
    [vid1, vid2].forEach((video) => {
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.preload = "auto";
      video.load();
    });
    vid1?.play().catch(() => {});
    vid2?.play().catch(() => {});
    vid2?.pause();
  }, [videos]);

  const contentClass = [
    "hero__content",
    "is-visible",
    textExiting ? "is-exiting" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const hasVideos = videos.length > 0;
  const hasDualVideos = videos.length >= 2;

  return (
    <section className="hero" id="home-hero" ref={heroRef}>
      <div className="hero__sticky">
        <div className="hero__media">
          {hasVideos ? (
            videos.slice(0, 2).map((v, i) => {
              const isActive = hasDualVideos
                ? i === 0
                  ? !showingSecond
                  : showingSecond
                : i === 0;
              return (
                <video
                  key={`${v.src}-${i}`}
                  ref={i === 0 ? vid1Ref : vid2Ref}
                  className={`hero__video hero__video--${i + 1}${isActive ? " is-active" : ""}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                >
                  <source src={v.src} type={videoMimeType(v.src)} />
                </video>
              );
            })
          ) : (
            <div className="hero__fallback" />
          )}
        </div>
        <div className="hero__overlay" />
        {showContent && (
        <div className={contentClass} id="hero-content">
          <h1 className="hero__title hero-animate">{title}</h1>
          {lines.length > 0 && (
            <div className="hero__subtitle">
              {lines.map((line, i) => (
                <p
                  key={i}
                  className={`hero__line hero-animate hero-animate--${i + 1}`}
                >
                  {line
                    .split("|")
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
}
