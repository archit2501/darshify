import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TooltipLayer from "./TooltipLayer";

// jsdom's :focus-visible doesn't follow browsers (it turns false after a
// key press), so it's modelled here: keyboard focus is visible, pointer
// focus isn't.
let keyboardFocus = true;
beforeEach(() => {
  keyboardFocus = true;
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    if (selector === ":focus-visible") {
      return keyboardFocus && this === document.activeElement;
    }
    return matches.call(this, selector);
  });
});
afterEach(() => vi.restoreAllMocks());

function setup({ withNext = true } = {}) {
  const view = render(
    <>
      {withNext ? (
        <button type="button" aria-label="Next" data-tooltip="Next">
          <span data-testid="icon">›</span>
        </button>
      ) : null}
      <button type="button" aria-label="Previous" data-tooltip="Previous" />
      <p>Elsewhere</p>
      <TooltipLayer />
    </>,
  );
  return {
    view,
    previous: screen.getByRole("button", { name: "Previous" }),
    elsewhere: screen.getByText("Elsewhere"),
  };
}

const next = () => screen.getByRole("button", { name: "Next" });
const mouse = { pointerType: "mouse" } as const;
// The buttons carry their names in aria-label only, so visible text with
// the name is the tooltip.
const tip = (label: string) => screen.queryByText(label);
const gone = (label: string) =>
  waitFor(() => expect(tip(label)).not.toBeInTheDocument());
// Shown without the hover delay: well inside the 400ms a hover waits.
const shownAtOnce = async (label: string) => {
  expect(await screen.findByText(label, {}, { timeout: 250 })).toBeVisible();
};
const focus = (element: HTMLElement) => act(() => element.focus());

describe("TooltipLayer", () => {
  it("names a control after a short hover and hides it when the pointer leaves", async () => {
    const { elsewhere } = setup();
    fireEvent.pointerOver(next(), mouse);
    expect(tip("Next")).not.toBeInTheDocument();
    expect(await screen.findByText("Next")).toBeVisible();

    fireEvent.pointerOut(next(), { ...mouse, relatedTarget: elsewhere });
    await gone("Next");
  });

  it("shows the next name at once while warm, and ignores touch", async () => {
    const { previous, elsewhere } = setup();
    fireEvent.pointerOver(previous, { pointerType: "touch" });
    fireEvent.pointerOver(next(), { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(tip("Next")).not.toBeInTheDocument();

    fireEvent.pointerOver(next(), mouse);
    await screen.findByText("Next");
    fireEvent.pointerOut(next(), { ...mouse, relatedTarget: elsewhere });
    await gone("Next");
    fireEvent.pointerOver(previous, mouse);
    await shownAtOnce("Previous");
    // Touch leaving is ignored too.
    fireEvent.pointerOut(previous, { pointerType: "touch" });
    expect(tip("Previous")).toBeVisible();
  });

  it("stays open while the pointer moves within the control or onto the tooltip (WCAG 1.4.13)", async () => {
    const { elsewhere } = setup();
    fireEvent.pointerOver(next(), mouse);
    const popup = await screen.findByText("Next");

    fireEvent.pointerOut(next(), {
      ...mouse,
      relatedTarget: screen.getByTestId("icon"),
    });
    fireEvent.pointerOut(next(), { ...mouse, relatedTarget: popup });
    fireEvent.pointerOver(popup, mouse);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(tip("Next")).toBeVisible();

    // Leaving and coming back within the grace period keeps it too.
    fireEvent.pointerOut(popup, { ...mouse, relatedTarget: elsewhere });
    fireEvent.pointerOver(next(), mouse);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(tip("Next")).toBeVisible();

    fireEvent.pointerOut(next(), { ...mouse, relatedTarget: elsewhere });
    await gone("Next");
    // Pointer movement elsewhere on the page changes nothing.
    fireEvent.pointerOver(elsewhere, mouse);
    fireEvent.pointerOut(elsewhere, mouse);
    expect(tip("Next")).not.toBeInTheDocument();
  });

  it("appears at once on keyboard focus; Escape, a press, a scroll or blur hides it", async () => {
    const { previous } = setup();
    focus(next());
    await shownAtOnce("Next");
    fireEvent.keyDown(document, { key: "Enter" });
    expect(tip("Next")).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    await gone("Next");

    focus(previous);
    await shownAtOnce("Previous");
    fireEvent.pointerDown(document.body);
    await gone("Previous");

    focus(next());
    await shownAtOnce("Next");
    fireEvent.scroll(document);
    await gone("Next");

    focus(previous);
    await shownAtOnce("Previous");
    act(() => previous.blur());
    await gone("Previous");
  });

  it("stays hidden when a click (not the keyboard) focuses a control", async () => {
    setup();
    keyboardFocus = false;
    focus(next());
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(tip("Next")).not.toBeInTheDocument();
  });

  it("drops a tooltip whose control leaves the page, and stops listening when unmounted", async () => {
    const { view } = setup();
    focus(next());
    await shownAtOnce("Next");
    view.rerender(
      <>
        <button type="button" aria-label="Previous" data-tooltip="Previous" />
        <p>Elsewhere</p>
        <TooltipLayer />
      </>,
    );
    await gone("Next");

    // A second layer works on its own after the first is gone.
    view.unmount();
    const { previous } = setup();
    focus(previous);
    await shownAtOnce("Previous");
  });
});
