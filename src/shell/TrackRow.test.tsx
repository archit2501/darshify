import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TrackRow } from "./TrackRow";
import { tracks } from "../data/library";

const t = tracks[0];

vi.mock("../player/PlayerContext", () => ({
  usePlayer: () => ({ current: undefined, isPlaying: false, play: mockPlay, isLiked: () => false, toggleLike: () => {} }),
}));
const mockPlay = vi.fn();

describe("TrackRow", () => {
  it("renders title + formatted duration and plays on click", () => {
    render(<MemoryRouter><TrackRow track={t} index={0} context={[t.id]} /></MemoryRouter>);
    expect(screen.getByText(t.title)).toBeInTheDocument();
    expect(screen.getByText("3:52")).toBeInTheDocument(); // 232s
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    expect(mockPlay).toHaveBeenCalled();
  });
});
