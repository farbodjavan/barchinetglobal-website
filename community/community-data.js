// The Community page's projects come from the public list the Worker serves: Research Labs projects by default and
// the projects the owner added, and only their public fields. The texts are empty until the owner writes them. Every value is checked and treated as plain text; the page never builds HTML from it.
import { plots } from './campus-data.js';

export const apiPath = '/community/api/projects';
// The Barchinet Campus page lives on its own host; sign-in, joining and the rest of the site stay on the main host.
export const mainSite = 'https://barchinetglobal.com';
export const campusSite = 'https://campus.barchinetglobal.com';
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
// A project's Research Labs page: only a same-site path under /education/research-labs/ is ever used as a link.
const labPattern = /^\/education\/research-labs\/[a-z0-9][a-z0-9/-]*$/;
export const labPage = (value) => (typeof value === 'string' && value.length <= 300 && labPattern.test(value) ? value : '');

export async function loadProjects() {
  const response = await fetch(apiPath, {
    headers: { Accept: 'application/json' }, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('The project list did not load (' + response.status + ').');
  const data = await response.json();
  if (!data || !Array.isArray(data.projects)) throw new Error('The project list was not in the expected form.');
  const seen = new Set();
  const projects = [];
  for (const entry of data.projects) {
    if (!entry || !idPattern.test(entry.id) || typeof entry.slug !== 'string' || !slugPattern.test(entry.slug)
      || entry.slug.length > 60 || seen.has(entry.slug) || !text(entry.title, 120)) continue;
    seen.add(entry.slug);
    const plot = Number.isInteger(entry.plot) && plots[entry.plot] ? entry.plot : null;
    projects.push({
      id: entry.id, slug: entry.slug, title: text(entry.title, 120), question: text(entry.question, 200),
      task: text(entry.first_task, 400), level: text(entry.level, 120), time: text(entry.time, 160),
      summary: text(entry.summary, 400), plot, building: plot === null ? '' : plots[plot].building, lead: plot === null ? undefined : plots[plot].lead,
      lab: labPage(entry.lab_page), joinable: entry.joinable !== false,
    });
  }
  return projects.map((project, index) => ({ ...project, n: index + 1 }));
}

// Share links: https://campus.barchinetglobal.com/#project-<slug>. Stable because the slug is kept by the server once
// made. (Old links to barchinetglobal.com/community/#project-<slug> are redirected there, and keep the #project-<slug>.)
export const anchorFor = (project) => 'project-' + project.slug;
export const shareUrl = (project) => campusSite + '/#' + anchorFor(project);
export function slugFromHash(hash) {
  const match = /^#project-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(hash);
  return match && match[1].length <= 60 ? match[1] : null;
}

// Where "Join this project" lands after sign-in: that project's join panel in the workspace. The sign-in page and
// the Worker only accept this one allow-listed form (membership/ui/return-path.mjs).
export function joinDestination(project) {
  return '/workspace/projects/?tab=access' + (project && idPattern.test(project.id) ? '&project=' + project.id : '');
}
export function membershipHref(project, mode) {
  const query = new URLSearchParams({ ...(mode === 'signup' ? { mode: 'signup' } : {}), next: joinDestination(project) });
  return mainSite + '/membership?' + query;
}

// Signed-in, approved members skip the sign-in step. Any failure simply means "show the sign-in choices".
export async function signedIn() {
  try {
    const response = await fetch('/membership/status', { credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    return Boolean((await response.json()).signedIn);
  } catch { return false; }
}
