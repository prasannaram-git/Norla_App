'use client';

/**
 * Safe motion wrapper — renders plain HTML elements that work everywhere.
 * Framer-motion is loaded lazily and enhances components only when available.
 * Content is ALWAYS visible even if framer-motion fails to load.
 */

import React, { forwardRef, useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fm: any = null;

if (typeof window !== 'undefined') {
  import('framer-motion')
    .then((mod) => { fm = mod; })
    .catch(() => { /* framer-motion not available, fallback is fine */ });
}

// Motion-specific props to strip when falling back to plain HTML
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
  'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
  'onDragStart', 'onDragEnd', 'onDrag',
  'layout', 'layoutId', 'viewport', 'custom',
]);

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_PROPS.has(key)) {
      clean[key] = props[key];
    }
  }
  return clean;
}

type Tag = keyof React.JSX.IntrinsicElements;

function createMotion(tag: Tag) {
  const Comp = forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
    const [, tick] = useState(0);

    useEffect(() => {
      // Re-render once framer-motion becomes available
      if (!fm) {
        const id = setInterval(() => {
          if (fm) { tick((t) => t + 1); clearInterval(id); }
        }, 100);
        const timeout = setTimeout(() => clearInterval(id), 3000);
        return () => { clearInterval(id); clearTimeout(timeout); };
      }
    }, []);

    // If framer-motion is loaded, use it
    if (fm?.motion?.[tag]) {
      const M = fm.motion[tag];
      return <M ref={ref} {...props} />;
    }

    // Fallback: render plain HTML with motion props stripped
    return React.createElement(tag, { ...stripMotionProps(props), ref });
  });
  Comp.displayName = `motion.${String(tag)}`;
  return Comp;
}

// Pre-build all commonly used motion elements (HTML + SVG)
export const motion = {
  // HTML elements
  div: createMotion('div'),
  span: createMotion('span'),
  p: createMotion('p'),
  h1: createMotion('h1'),
  h2: createMotion('h2'),
  h3: createMotion('h3'),
  h4: createMotion('h4'),
  section: createMotion('section'),
  article: createMotion('article'),
  nav: createMotion('nav'),
  button: createMotion('button'),
  a: createMotion('a'),
  ul: createMotion('ul'),
  li: createMotion('li'),
  img: createMotion('img'),
  // SVG elements
  svg: createMotion('svg'),
  path: createMotion('path'),
  circle: createMotion('circle'),
  rect: createMotion('rect'),
  line: createMotion('line'),
  polyline: createMotion('polyline'),
  polygon: createMotion('polygon'),
  ellipse: createMotion('ellipse'),
  g: createMotion('g'),
  text: createMotion('text'),
};

// AnimatePresence — just passes through children if framer-motion isn't loaded
export function AnimatePresence({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode?: string;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!fm) {
      const id = setInterval(() => {
        if (fm) { tick((t) => t + 1); clearInterval(id); }
      }, 100);
      const timeout = setTimeout(() => clearInterval(id), 3000);
      return () => { clearInterval(id); clearTimeout(timeout); };
    }
  }, []);

  if (fm?.AnimatePresence) {
    const AP = fm.AnimatePresence;
    return <AP mode={mode}>{children}</AP>;
  }

  return <>{children}</>;
}
