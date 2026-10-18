// App-wide background image behind every page.
export const BACKGROUND_IMAGE_URL =
  'https://www.worldbank.org/content/dam/photos/780x439/2019/may-2/Zambia-climate-smart-ag-1.jpg';

// Opacity of the background photo itself (0 = invisible, 1 = fully opaque).
// Set to 0.6 as requested.
export const BACKGROUND_IMAGE_OPACITY = 0.6;

// A light sage scrim layered on top of the photo, purely so page titles and
// text sitting directly on the background (outside white cards) stay
// comfortably readable no matter which part of the photo ends up behind
// them. Cards (bg-surface, solid white) are unaffected by this — they're
// already fully readable regardless. Raise this if text ever feels hard to
// read; lower it to let more of the photo show through.
export const BACKGROUND_READABILITY_SCRIM = 0.3;
