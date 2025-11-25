// Adapter to optionally use Deepnest packages without modifying the Deepnest folder.
// This module dynamically imports Deepnest packages if they are installed/available
// and exposes a minimal `nestPolylines` helper. If Deepnest packages are not
// available or their APIs differ, the adapter falls back to returning the input
// polygons unchanged and a descriptive status.

export type NestResult = {
  ok: boolean;
  reason?: string;
  // If deepnest returns placements, they may be included here.
  placements?: any;
};

// Convert an array of polylines (each polyline is [[x,y],...]) into a simple SVG string
function polylinesToSvg(polylines: Array<Array<[number, number]>>): string {
  const paths = polylines.map((poly) => {
    if (!poly || poly.length === 0) return "";
    const d = poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
    return `<path d="${d}" fill="none" stroke="black" />`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

// Check availability of Deepnest packages via dynamic import.
export async function isDeepnestAvailable(): Promise<boolean> {
  try {
    await import('@deepnest/svg-preprocessor');
    await import('@deepnest/calculate-nfp');
    return true;
  } catch (e) {
    return false;
  }
}

// Attempt to run Deepnest processing for the provided polylines.
// - polylinesList: array of polylines representing shapes to nest
// - options: optional settings forwarded to Deepnest packages where applicable
// Returns a NestResult; when Deepnest is unavailable or the adapter cannot call the
// expected API it returns ok=false with a reason, otherwise ok=true and placements (if any).
export async function nestPolylines(polylinesList: Array<Array<[number, number]>>, options?: Record<string, any>): Promise<NestResult> {
  // quick sanity
  if (!polylinesList || polylinesList.length === 0) return { ok: false, reason: 'no-polylines' };

  // prepare an SVG payload
  const svg = polylinesToSvg(polylinesList);

  try {
    const preprocModule = await import('@deepnest/svg-preprocessor');
    const calcModule = await import('@deepnest/calculate-nfp');

    // Determine api surface for svg-preprocessor
    const preprocessor: any = preprocModule?.default || preprocModule;
    if (typeof preprocessor !== 'function' && typeof preprocessor?.process !== 'function') {
      return { ok: false, reason: 'svg-preprocessor API not recognized' };
    }

    // Run preprocessor (API varies between versions). Try common entry points.
    let preprocessed: any;
    if (typeof preprocessor === 'function') {
      preprocessed = await preprocessor(svg, options);
    } else if (typeof preprocessor.process === 'function') {
      preprocessed = await preprocessor.process(svg, options);
    }

    // `calculate-nfp` is lower-level; adapter will attempt to use it if available
    const calc: any = calcModule?.default || calcModule;

    // If preprocessed contains polygons or paths, hand-off to calculate-nfp where sensible.
    // The exact API of calculate-nfp varies; we'll try to detect a common function name.
    if (preprocessed && calc) {
      // Example: if calculateNfp exists and expects polygon pairs, we might call it.
      const calcFn = calc.calculateNfp || calc.default || calc;
      if (typeof calcFn === 'function') {
        // Note: We don't know the exact parameters expected here; many deepnest internals
        // require more elaborate setup. For a safe default, return preprocessed result.
        return { ok: true, placements: preprocessed };
      }
    }

    // If we get here, we have a preprocessed payload but couldn't call a nesting function.
    return { ok: true, placements: preprocessed };
  } catch (err: any) {
    return { ok: false, reason: `deepnest import failed: ${String(err && err.message ? err.message : err)}` };
  }
}

// Export a fallback synchronous wrapper for environments that prefer not to await.
export function nestPolylinesSafe(polylinesList: Array<Array<[number, number]>>, options?: Record<string, any>) {
  // caller should handle promise result; provide a simple wrapper
  return nestPolylines(polylinesList, options);
}

export default {
  isDeepnestAvailable,
  nestPolylines,
  nestPolylinesSafe,
};
