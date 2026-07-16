// Whether a creative should fill its window or sit letterboxed inside it.
//
// The two cases aren't close. A portrait creative in our portrait window is
// within a few percent of the same shape: filling it crops a sliver off one
// edge and nobody could tell. A 16:9 creative in the same window is nearly the
// opposite shape: filling it would throw away about two thirds of what the
// advertiser made. So the rule is per-creative, not per-slide.

// Fraction of a creative that cover() scales out of view.
export const croppedByCover = (creativeAspect, windowAspect) =>
  1 - Math.min(creativeAspect, windowAspect) / Math.max(creativeAspect, windowAspect);

// Above this, letterbox and let the blurred backdrop carry the rest of the
// window. Portrait inventory lands around 0-11%, landscape around 70%.
export const MAX_CROP = 0.15;

export const shouldCover = (creativeAspect, windowAspect) =>
  croppedByCover(creativeAspect, windowAspect) <= MAX_CROP;
