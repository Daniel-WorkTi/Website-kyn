"use client";

import { useEffect, useRef, useState } from "react";
import type { Hero } from "@/lib/types";
import { videoMimeType } from "@/lib/utils";

interface HeroProps {
  hero: Hero;
  brand: string;
}

export default function Hero({ hero, brand }: HeroProps) {
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
    const swapVideo = (toSecond: boolean) => {
      const vid1 = vid1Ref.current;
      const vid2 = vid2Ref.current;
      if (!vid1 || !vid2 || showingSecondRef.current === toSecond) return;

      showingSecondRef.current = toSecond;
      setShowingSecond(toSecond);

      const active = toSecond ? vid2 : vid1;
      active.currentTime = 0;
      active.play().catch(() => {});
    };

    const updateHeroOnScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      swapVideo(y > vh * 0.08);

      const shouldExit = y > vh * 0.35;
      if (shouldExit !== textExitingRef.current) {
        textExitingRef.current = shouldExit;
        setTextExiting(shouldExit);
      }
    };

    window.addEventListener("scroll", updateHeroOnScroll, { passive: true });
    updateHeroOnScroll();
    return () => window.removeEventListener("scroll", updateHeroOnScroll);
  }, []);

  useEffect(() => {
    [vid1Ref, vid2Ref].forEach((ref) => {
      const video = ref.current;
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.preload = "auto";
      video.play().catch(() => {});
    });
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
    <section className="hero hero--scroll" id="home-hero">
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
      </div>
    </section>
  );
}
