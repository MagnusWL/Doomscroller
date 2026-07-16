// Real, verified-embeddable lectures on famously dry subjects, shown when the
// viewer refills their braincells. Verified live via YouTube's oEmbed API
// before being added here — don't add an ID without checking it resolves.
export const BORING_LECTURES = [
  'wWnfJ0-xXRE', // MIT 8.01x Physics intro — Walter Lewin
  'IJquEYhiq_U', // MIT cryptocurrency engineering — signatures & hashing
  'kBdfcR-8hEY', // Harvard Justice — Michael Sandel, episode 1
  'ZK3O402wf1c', // MIT 18.06 Linear Algebra — Gilbert Strang, lecture 1
];

export function randomLecture() {
  return BORING_LECTURES[Math.floor(Math.random() * BORING_LECTURES.length)];
}
