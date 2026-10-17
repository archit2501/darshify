import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { preloadMenus } from "./lazy";
import { useContextMenu, useMenuButton } from "./triggers";

vi.mock("./lazy", () => ({ preloadMenus: vi.fn() }));

function MenuButtonProbe() {
  const menu = useMenuButton();
  return (
    <>
      <button {...menu.buttonProps}>Options</button>
      <output aria-label="Menu state">
        {`${String(menu.open)} ${String(menu.mounted)} ${menu.highlight ?? "none"}`}
      </output>
      <button type="button" onClick={() => menu.setOpen(false)}>
        Close
      </button>
    </>
  );
}

function ContextMenuProbe() {
  const menu = useContextMenu();
  const { x, y } = menu.anchor.getBoundingClientRect();
  return (
    <>
      <div data-testid="row" onContextMenu={menu.onContextMenu}>
        <a href="#song">Song</a>
      </div>
      <output aria-label="Menu state">
        {`${String(menu.open)} ${String(menu.mounted)} ${x} ${y}`}
      </output>
      <button type="button" onClick={() => menu.setOpen(false)}>
        Close
      </button>
    </>
  );
}

const state = () => screen.getByRole("status", { name: "Menu state" });

describe("useMenuButton", () => {
  it("opens on click as a menu button, and a press while open closes it for good", () => {
    render(<MenuButtonProbe />);
    const button = screen.getByRole("button", { name: "Options" });
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(state()).toHaveTextContent("false false none");

    fireEvent.pointerDown(button);
    fireEvent.click(button, { detail: 1 });
    expect(state()).toHaveTextContent("true true none");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("data-popup-open", "");

    // The press lands outside the menu (which closes it); the click that
    // follows must not open it again.
    fireEvent.pointerDown(button);
    fireEvent.click(button, { detail: 1 });
    expect(state()).toHaveTextContent("false true");
    expect(button).not.toHaveAttribute("data-popup-open");

    // Enter and Space reach the button as clicks with no pointer: the menu
    // starts on its first item.
    fireEvent.click(button, { detail: 0 });
    expect(state()).toHaveTextContent("true true first");
  });

  it("opens from ArrowDown and ArrowUp, ignores other keys, and warms the menu code", () => {
    render(<MenuButtonProbe />);
    const button = screen.getByRole("button", { name: "Options" });
    fireEvent.keyDown(button, { key: "Tab" });
    expect(state()).toHaveTextContent("false false none");
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(state()).toHaveTextContent("true true first");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.keyDown(button, { key: "ArrowUp" });
    expect(state()).toHaveTextContent("true true last");

    vi.mocked(preloadMenus).mockClear();
    fireEvent.pointerEnter(button);
    fireEvent.focus(button);
    expect(preloadMenus).toHaveBeenCalledTimes(2);
  });
});

describe("useContextMenu", () => {
  it("opens at the pointer and suppresses the browser's menu", () => {
    render(<ContextMenuProbe />);
    const row = screen.getByTestId("row");
    expect(fireEvent.contextMenu(row, { clientX: 120, clientY: 80 })).toBe(
      false,
    );
    expect(state()).toHaveTextContent("true true 120 80");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(state()).toHaveTextContent("false true 120 80");
  });

  it("opens under the focused element for the Menu key and Shift+F10", () => {
    render(<ContextMenuProbe />);
    const row = screen.getByTestId("row");
    const link = screen.getByRole("link", { name: "Song" });
    vi.spyOn(link, "getBoundingClientRect").mockReturnValue(
      new DOMRect(10, 20, 30, 40),
    );
    link.focus();
    fireEvent.contextMenu(row, { clientX: 0, clientY: 0 });
    expect(state()).toHaveTextContent("true true 10 60");

    // Focus outside the row: the row itself is the anchor.
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue(
      new DOMRect(5, 6, 7, 8),
    );
    screen.getByRole("button", { name: "Close" }).focus();
    fireEvent.contextMenu(row, { clientX: 0, clientY: 0 });
    expect(state()).toHaveTextContent("true true 5 14");
  });
});
