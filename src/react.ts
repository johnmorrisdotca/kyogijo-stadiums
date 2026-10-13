import { drawKyogijo, isPortrait } from "./draw.ts";
import { containerAspect } from "./mount.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** The drawing as the object React's `dangerouslySetInnerHTML` takes. */
export function kyogijoHtml(options: SurfaceOptions | ScoreOptions): { __html: string } {
  return { __html: drawKyogijo(options) };
}

/**
 * Props for a `div` (or any element) that holds a drawing, to spread onto it: no component, no dependency on React.
 * With `orientation: "auto"` and no `aspect`, the drawing is wide; use `createKyogijo` for a container that is measured.
 * @example
 * ```ts
 * import { kyogijoProps } from "@johnmorrisdotca/kyogijo/react";
 * const props = kyogijoProps({ sport: "nba", away: { name: "Harbour City Gulls", score: 108 }, home: { name: "Prairie Ridge Bison", score: 112 }, status: "final" });
 * console.log(props["data-kyogijo"], props.dangerouslySetInnerHTML.__html.startsWith("<svg"));
 * // nba true
 * ```
 */
export function kyogijoProps(options: SurfaceOptions | ScoreOptions): { dangerouslySetInnerHTML: { __html: string }; "data-kyogijo": string; "data-orientation": "landscape" | "portrait" } {
  return { dangerouslySetInnerHTML: kyogijoHtml(options), "data-kyogijo": options.sport, "data-orientation": isPortrait(options) ? "portrait" : "landscape" };
}

/** The part of React the component uses; pass the `React` you have, and nothing here imports it. */
export interface ReactLike {
  createElement(type: string, props: Record<string, unknown> | null, ...children: unknown[]): unknown;
  useRef<T>(initial: T): { current: T };
  useState<S>(initial: S): [S, (next: S) => void];
  useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
}

/** The props of the component `createKyogijo` makes: the options, and the usual `className` and `style` of its `div`. */
export type KyogijoProps = (SurfaceOptions | ScoreOptions) & { containerClassName?: string; containerStyle?: Record<string, unknown>; breakpoint?: number };

/**
 * A React component made from the `React` you give it. It draws the options, and with `orientation: "auto"` measures its
 * own box and lays the drawing out tall or wide as the box changes.
 * @example
 * ```ts
 * import { createKyogijo } from "@johnmorrisdotca/kyogijo/react";
 * // With React: `const Kyogijo = createKyogijo(React);` and then `<Kyogijo sport="nhl" orientation="auto" />`.
 * // Here a stand-in for React, to show what comes out:
 * const Kyogijo = createKyogijo({ createElement: (type, props) => ({ type, props }), useRef: (initial) => ({ current: initial }), useState: (initial) => [initial, () => {}], useEffect: () => {} });
 * const element = Kyogijo({ sport: "nhl" }) as { type: string };
 * console.log(element.type);
 * // div
 * ```
 */
export function createKyogijo(React: ReactLike): (props: KyogijoProps) => unknown {
  return function Kyogijo(props: KyogijoProps): unknown {
    const { containerClassName, containerStyle, breakpoint, ...options } = props;
    const ref = React.useRef<HTMLElement | null>(null);
    const [aspect, setAspect] = React.useState<number | undefined>(undefined);
    const auto = options.orientation === "auto" && options.aspect === undefined;
    React.useEffect(() => {
      if (!auto || ref.current === null || typeof ResizeObserver === "undefined") return undefined;
      const host = ref.current;
      const measure = (): void => {
        const next = containerAspect(host, breakpoint);
        if (next !== undefined) setAspect(next < 1 ? 0.75 : 1.5);
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      return () => observer.disconnect();
    }, [auto, breakpoint]);
    const drawn = { ...options, aspect: options.aspect ?? aspect } as SurfaceOptions | ScoreOptions;
    return React.createElement("div", { ref, className: containerClassName, style: containerStyle, ...kyogijoProps(drawn) });
  };
}
