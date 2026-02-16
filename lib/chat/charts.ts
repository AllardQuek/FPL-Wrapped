import { type VisualizationSpec } from 'vega-embed';

/**
 * Custom theme for FPL-Wrapped charts
 */
export const FPL_VEGA_THEME = {
  background: 'transparent',
  font: 'inherit',
  padding: 0,
  autosize: { type: 'fit', contains: 'padding' },
  axis: {
    gridColor: 'rgba(255, 255, 255, 0.03)',
    domain: false,
    ticks: false,
    labelColor: 'rgba(255, 255, 255, 0.7)', 
    titleColor: '#00ff87', 
    titleFontWeight: 700,
    titleFontSize: 10,
    titlePadding: 20,
    labelFontSize: 10,
    labelFontWeight: 400,
    labelPadding: 8,
    labelLimit: 200,
    grid: true,
  },
  legend: {
    labelColor: '#ffffff',
    titleColor: '#00ff87',
    padding: 15,
    titleFontSize: 10,
    titleFontWeight: 700,
    labelFontSize: 10,
  },
  range: {
    // Diversified palette: Cyan, Green, Purple, Pink (FPL colors)
    category: ['#00d4ff', '#00ff87', '#37003c', '#ff005a', '#00bacf', '#02ef7e'],
    ordinal: ['#00d4ff', '#00bacf', '#00a1b0', '#008792', '#006d75', '#005359'],
    ramp: ['#00333d', '#00d4ff'],
    heatmap: ['#0d0015', '#006d75', '#00d4ff'],
  },
  mark: { fill: '#00d4ff' },
  rect: { fill: '#00d4ff' },
  bar: { fill: '#00d4ff', cornerRadius: 6 },
  line: { stroke: '#00d4ff', strokeWidth: 3, interpolate: 'monotone' },
  area: { fill: '#00d4ff', fillOpacity: 0.3 },
  point: { filled: true, size: 80, stroke: '#0d0015', strokeWidth: 1.5, fill: '#00d4ff' },
  text: { fill: '#ffffff', fontWeight: 500, fontSize: 10 },
  tooltip: {
    theme: 'dark',
  },
  view: { stroke: 'transparent' },
  scale: {
    bandPaddingInner: 0.15,
    bandPaddingOuter: 0.1,
  },
} as const;

/**
 * Robustly parse a Vega-Lite spec from LLM output
 */
export async function parseVegaSpec(spec: string | object): Promise<any> {
    let parsed: any = spec;
    if (typeof spec === 'string') {
      let s = spec.trim();

      // Remove fenced code block markers if present
      const fenceMatch = s.match(/^```(?:vega-lite|vega)?\n([\s\S]*)\n```$/i);
      if (fenceMatch) s = fenceMatch[1];

      try {
        parsed = JSON.parse(s);
      } catch (errJson) {
        try {
          // Try json5 if available (allows single quotes, trailing commas)
          const json5: any = await import('json5');
          parsed = json5.parse(s);
        } catch {
          // Last-resort: extract first {...} object and try parse
          const objMatch = s.match(/(\{[\s\S]*\})/);
          if (objMatch) {
            try {
              parsed = JSON.parse(objMatch[1]);
            } catch {
              throw errJson;
            }
          } else {
            throw errJson;
          }
        }
      }
    }
    return parsed;
}

/**
 * Sanitize Vega spec by removing external URL references for security
 */
export function sanitizeVegaSpec(spec: any) {
  if (!spec || typeof spec !== 'object') return spec;

  try {
    const clone = JSON.parse(JSON.stringify(spec));

    const strip = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(strip);
        return;
      }
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (k === 'url' && typeof v === 'string') {
          delete obj[k];
          continue;
        }
        if ((k === 'data' || k === 'format') && v && typeof v === 'object' && v.url) {
          delete obj[k].url;
        }
        // Allow signal, expr, and expression as they are required for interactivity
        // stripping them broke tooltips and selections
        
        if (k === 'image' && v && typeof v === 'object' && v.url) {
          delete obj[k].url;
        }
        strip(v);
      }
    };

    strip(clone);
    return clone;
  } catch {
    return spec;
  }
}

/**
 * Prepares a spec for rendering by applying theme and sizing
 */
export function prepareSpec(parsed: any): { safeSpec: VisualizationSpec; title: string | null } {
    let title: string | null = null;
    try {
        if (parsed) {
          const t = parsed.title || (parsed.config && parsed.config.title);
          if (typeof t === 'string') title = t;
          else if (t && typeof t === 'object' && typeof t.text === 'string') title = t.text;
          
          if (parsed.title) delete parsed.title;
          if (parsed.config?.title) delete parsed.config.title;
        }
      } catch {}

      const safeSpec = sanitizeVegaSpec(parsed);
      
      // Deeply clean up the spec to remove hardcoded colors/schemes that override the theme
      const enforceTheme = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach(enforceTheme);
          return;
        }

        for (const k of Object.keys(obj)) {
          const v = obj[k];
          
          // Remove explicit schemes like "reds", "greens", "category10"
          if (k === 'scheme' && typeof v === 'string') {
            // Keep if it's one of ours, otherwise delete so theme takes over
            if (!['ramp', 'category', 'ordinal', 'heatmap'].includes(v)) {
              delete obj[k];
            }
          }

          // Force our ramp for any continuous color scales
          if (k === 'color' && v && typeof v === 'object' && v.type === 'quantitative') {
            if (!v.scale) v.scale = {};
            v.scale.range = FPL_VEGA_THEME.range.ramp;
          }

          // Ensure bar and area marks use theme colors if no encoding overrides
          if (k === 'mark' && (v === 'bar' || v === 'area' || v?.type === 'bar' || v?.type === 'area')) {
            if (typeof v === 'object' && v.color) delete v.color;
            if (typeof v === 'object' && v.fill) delete v.fill;
          }

          enforceTheme(v);
        }
      };

      enforceTheme(safeSpec);

      if (!safeSpec.config) safeSpec.config = {};
      
      // Merge FPL theme
      if (!safeSpec.config) safeSpec.config = {};
      Object.assign(safeSpec.config, FPL_VEGA_THEME);
      safeSpec.background = 'transparent';

      // Ensure we use the theme's sizing and padding
      // We force 'container' width, but only set height if not specified to avoid responsive charts
      safeSpec.width = 'container';
      if (!safeSpec.height) {
        safeSpec.height = 280;
      }
      
      // Force theme's default padding and autosize for consistent UIUX
      safeSpec.padding = safeSpec.padding !== undefined ? safeSpec.padding : FPL_VEGA_THEME.padding;
      safeSpec.autosize = safeSpec.autosize || FPL_VEGA_THEME.autosize;

      return { safeSpec, title };
}

/**
 * Creates a secure Vega loader that prevents external network fetches
 */
export async function createSecureLoader() {
  try {
    const vega: any = await import('vega');
    const loader = (vega && typeof vega.loader === 'function') ? vega.loader() : undefined;
    if (loader && typeof loader.fetch === 'function') {
      loader.fetch = () => Promise.reject(new Error('External loads disabled for embedded charts'));
    }
    return loader;
  } catch {
    return undefined;
  }
}
