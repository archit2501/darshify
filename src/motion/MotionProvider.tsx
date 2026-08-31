import type { ReactNode } from "react";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" skipAnimations={reducedMotion}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
