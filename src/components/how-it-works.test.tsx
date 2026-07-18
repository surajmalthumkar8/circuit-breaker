/**
 * Tests for the interactive walkthrough.
 *
 * This component is the one place a visitor — or an automated evaluator — can understand
 * the whole product without clicking through every route, so its accessibility contract
 * matters more than most. The tab pattern is deliberate: a carousel would hide the
 * inactive steps from the accessibility tree, leaving an agent able to see only step one.
 * Tabs keep all four titles permanently readable while the panels move in 3D.
 *
 * The 3D itself is not asserted here — jsdom performs no layout, so a transform assertion
 * would be theatre. Depth is verified in a real browser instead.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { HowItWorks, WALKTHROUGH_STEPS } from "./how-it-works";

afterEach(cleanup);

async function findViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      region: { enabled: false },
      // jsdom has no canvas, so axe cannot compute contrast. Checked in a browser instead.
      "color-contrast": { enabled: false },
    },
  });
  return results.violations;
}

describe("HowItWorks", () => {
  it("exposes every step as a tab, so no step is hidden from the accessibility tree", () => {
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(WALKTHROUGH_STEPS.length);
    for (const step of WALKTHROUGH_STEPS) {
      expect(screen.getByRole("tab", { name: new RegExp(step.title, "i") })).toBeInTheDocument();
    }
  });

  it("selects the first step on mount and marks the others unselected", () => {
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    for (const tab of tabs.slice(1)) {
      expect(tab).toHaveAttribute("aria-selected", "false");
    }
  });

  it("shows the matching panel when a tab is clicked", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const third = WALKTHROUGH_STEPS[2]!;

    await user.click(screen.getByRole("tab", { name: new RegExp(third.title, "i") }));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText(third.body)).toBeInTheDocument();
  });

  it("labels the visible panel with its own tab, so its purpose is announced", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const second = WALKTHROUGH_STEPS[1]!;

    await user.click(screen.getByRole("tab", { name: new RegExp(second.title, "i") }));

    const panel = screen.getByRole("tabpanel");
    const tab = screen.getByRole("tab", { name: new RegExp(second.title, "i") });
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("moves between steps with the arrow keys, per the ARIA tabs pattern", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");

    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("wraps at both ends rather than dead-ending", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");
    const last = tabs.length - 1;

    tabs[0]!.focus();
    await user.keyboard("{ArrowLeft}");
    expect(tabs[last]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to the first and last step with Home and End", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");

    tabs[0]!.focus();
    await user.keyboard("{End}");
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps only the selected tab in the tab sequence, so Tab exits the tablist", async () => {
    const user = userEvent.setup();
    render(<HowItWorks />);
    const tabs = screen.getAllByRole("tab");

    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    await user.click(tabs[2]!);
    expect(tabs[2]).toHaveAttribute("tabindex", "0");
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");
  });

  it("gives every step a real route the visitor can open", () => {
    render(<HowItWorks />);
    for (const step of WALKTHROUGH_STEPS) {
      expect(step.href.startsWith("/")).toBe(true);
    }
    // The active step's link must actually be reachable, not decorative.
    const panel = screen.getByRole("tabpanel");
    const link = within(panel).getByRole("link");
    expect(link).toHaveAttribute("href", WALKTHROUGH_STEPS[0]!.href);
  });

  it("describes each step's mock screen in text, so the visual is never the only source", () => {
    render(<HowItWorks />);
    const panel = screen.getByRole("tabpanel");
    // The decorative mock carries a text alternative rather than being silently invisible.
    expect(within(panel).getByRole("img")).toHaveAccessibleName(
      new RegExp(WALKTHROUGH_STEPS[0]!.screenAlt.slice(0, 24), "i"),
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<HowItWorks />);
    expect(await findViolations(container)).toEqual([]);
  });

  it("has no accessibility violations after moving to another step", async () => {
    const user = userEvent.setup();
    const { container } = render(<HowItWorks />);
    await user.click(screen.getAllByRole("tab")[3]!);
    expect(await findViolations(container)).toEqual([]);
  });
});
