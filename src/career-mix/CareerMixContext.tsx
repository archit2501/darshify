import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { portfolio } from "../content/portfolio";
import { trackOutcome } from "../analytics/outcomes";
import { caseStudyById, proofById } from "../content/selectors";
import type { CareerMixChapter } from "../content/types";
import {
  CAREER_MIX_TOTAL_MS,
  careerMixReducer,
  chapterDurationMs,
  initialCareerMixState,
  type CareerMixState,
} from "./reducer";

interface CareerMixEvidence {
  label: string;
  href: string;
  caseStudyTitle: string;
}

export interface ActiveCareerMixChapter {
  id: CareerMixChapter["id"];
  title: CareerMixChapter["title"];
  takeaway: CareerMixChapter["summary"];
  durationMs: number;
  evidence: CareerMixEvidence;
}

interface CareerMixValue {
  open: (trigger?: HTMLElement | null) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  close: () => void;
  state: CareerMixState;
  activeChapter: ActiveCareerMixChapter;
  progressRatio: number;
}

const resolveEvidence = (chapter: CareerMixChapter) => {
  const caseStudy = chapter.caseStudyIds
    .map((caseStudyId) => caseStudyById(caseStudyId)!)
    .find((item) => item.proofIds.length > 0)!;
  const proof = proofById(caseStudy.proofIds[0])!;
  return { caseStudy, proof };
};

const chapters: ActiveCareerMixChapter[] = portfolio.careerMixChapters.map(
  (chapter, chapterIndex) => {
    const { caseStudy, proof } = resolveEvidence(chapter);
    return {
      id: chapter.id,
      title: chapter.title,
      takeaway: chapter.summary,
      durationMs: chapterDurationMs(chapterIndex),
      evidence: {
        label: proof.label,
        href: `/case-studies/${caseStudy.slug}`,
        caseStudyTitle: caseStudy.title,
      },
    };
  },
);

const CareerMixContext = createContext<CareerMixValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCareerMix(): CareerMixValue {
  const value = useContext(CareerMixContext);
  if (!value) {
    throw new Error("useCareerMix must be used within CareerMixProvider");
  }
  return value;
}

export function CareerMixProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(careerMixReducer, initialCareerMixState);
  const triggerRef = useRef<HTMLElement | null>(null);
  const completionTrackedRef = useRef(false);

  useEffect(() => {
    if (state.status !== "playing") return;
    const interval = window.setInterval(
      () => dispatch({ type: "TICK", deltaMs: 250 }),
      250,
    );
    return () => window.clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "complete") {
      completionTrackedRef.current = false;
      return;
    }
    if (completionTrackedRef.current) return;
    completionTrackedRef.current = true;
    trackOutcome("career_mix_complete", { placement: "career-mix" });
  }, [state.status]);

  const open = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    dispatch({ type: "OPEN" });
  }, []);
  const toggle = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const previous = useCallback(() => dispatch({ type: "PREVIOUS" }), []);
  const close = useCallback(() => {
    dispatch({ type: "CLOSE" });
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger?.isConnected) trigger.focus();
  }, []);

  const value = useMemo<CareerMixValue>(
    () => ({
      open,
      toggle,
      next,
      previous,
      close,
      state,
      activeChapter: chapters[state.chapterIndex],
      progressRatio: state.elapsedMs / CAREER_MIX_TOTAL_MS,
    }),
    [close, next, open, previous, state, toggle],
  );

  return (
    <CareerMixContext.Provider value={value}>
      {children}
    </CareerMixContext.Provider>
  );
}
