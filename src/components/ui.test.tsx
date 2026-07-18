/**
 * Accessibility tests for the shared primitives.
 *
 * These assert the properties that make the interface usable by a screen reader — and,
 * for the same reason, legible to any automated agent, since both read the accessibility
 * tree rather than the pixels. A control with no accessible name is invisible to both.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { Badge, Button, EmptyState, Field, Meter, SourceNote, StatTile, inputClass } from "./ui";

afterEach(cleanup);

/** Run axe against a container and return only genuine violations. */
async function findViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // Landmark and page-level rules do not apply to an isolated component fragment.
      region: { enabled: false },
      /*
       * Disabled DELIBERATELY and explicitly. axe needs canvas to compute rendered
       * colours, which jsdom does not implement, so this rule silently no-ops here.
       * Leaving it "enabled" would imply contrast coverage that does not exist —
       * contrast is checked in a real browser instead.
       */
      "color-contrast": { enabled: false },
    },
  });
  return results.violations;
}

describe("Button", () => {
  it("exposes its visible text as the accessible name", () => {
    render(<Button>Log an urge</Button>);
    expect(screen.getByRole("button", { name: "Log an urge" })).toBeInTheDocument();
  });

  it("lets an explicit aria-label override for controls whose text is ambiguous", () => {
    render(<Button ariaLabel="Read the current step aloud">Read aloud</Button>);
    expect(
      screen.getByRole("button", { name: "Read the current step aloud" }),
    ).toBeInTheDocument();
  });

  it("communicates its disabled state to assistive technology", () => {
    render(<Button disabled>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("defaults to type=button so it cannot accidentally submit a form", () => {
    render(<Button>Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button trailing>Open the dashboard</Button>);
    expect(await findViolations(container)).toEqual([]);
  });

  it("keeps the decorative trailing arrow out of the accessible name", async () => {
    render(<Button trailing>Continue</Button>);
    // The arrow is aria-hidden, so the name must be the text alone.
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("associates its label with the control via htmlFor", () => {
    render(
      <Field label="How strong is it?" htmlFor="intensity">
        <input id="intensity" className={inputClass} />
      </Field>,
    );
    expect(screen.getByLabelText("How strong is it?")).toBeInTheDocument();
  });

  it("has no accessibility violations, including with a hint", async () => {
    const { container } = render(
      <Field label="What set it off?" htmlFor="trigger" hint="Pick the closest one.">
        <select id="trigger" className={inputClass}>
          <option>Boredom</option>
        </select>
      </Field>,
    );
    expect(await findViolations(container)).toEqual([]);
  });
});

describe("StatTile", () => {
  it("is a link, so a dashboard statistic never dead-ends", () => {
    render(<StatTile label="Days clear" value={5} detail="Best run: 9 days" href="/journal" />);
    const link = screen.getByRole("link", { name: /Days clear/ });
    expect(link).toHaveAttribute("href", "/journal");
  });

  it("includes the value in its accessible name", () => {
    render(<StatTile label="Urges ridden out" value={18} href="/journal" />);
    expect(screen.getByRole("link", { name: /18/ })).toBeInTheDocument();
  });
});

describe("Meter", () => {
  it("carries a text alternative, since the bar itself conveys nothing to a screen reader", () => {
    render(<Meter value={72} label="Boredom: 12 urges, 4 lapses" />);
    expect(screen.getByRole("img", { name: "Boredom: 12 urges, 4 lapses" })).toBeInTheDocument();
  });

  it("clamps out-of-range values instead of overflowing its track", () => {
    const { container } = render(<Meter value={480} max={100} label="over" />);
    const fill = container.querySelector('[role="img"] > div') as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("clamps negatives to zero", () => {
    const { container } = render(<Meter value={-20} max={100} label="under" />);
    const fill = container.querySelector('[role="img"] > div') as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });
});

describe("SourceNote", () => {
  it("names the engine when content was generated live", () => {
    render(<SourceNote source="groq" live />);
    expect(screen.getByText(/generated just now by groq/i)).toBeInTheDocument();
  });

  it("says plainly when content came from the offline fallback", () => {
    render(<SourceNote source="demo" live={false} />);
    expect(screen.getByText(/deterministic fallback/i)).toBeInTheDocument();
  });
});

describe("Badge and EmptyState", () => {
  it("renders a risk badge with readable text", () => {
    render(<Badge tone="high_risk">Risk 72</Badge>);
    expect(screen.getByText("Risk 72")).toBeInTheDocument();
  });

  it("gives an empty collection a heading and a way forward", async () => {
    const { container } = render(
      <EmptyState title="No plans match" body="Try clearing the search box." />,
    );
    expect(screen.getByRole("heading", { name: "No plans match" })).toBeInTheDocument();
    expect(await findViolations(container)).toEqual([]);
  });
});
