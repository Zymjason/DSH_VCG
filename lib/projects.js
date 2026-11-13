/**
 * VCG project (workspace) helpers: name sanitation, directory slugs, and the
 * default project root.
 *
 * Pure except for `homedir()`, importable by scripts/self-test.mjs.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

/** Maximum project display-name length. */
export const MAX_PROJECT_NAME = 60

/**
 * Sanitize a user-typed project name.
 * Allows letters, digits, `.`, `_`, `-`, spaces and CJK; other characters are dropped.
 * Returns '' when nothing usable remains.
 */
export function sanitizeProjectName(raw) {
  const value = String(raw ?? '').trim()
  if (value === '') return ''
  const cleaned = value
    .replace(/[^\p{L}\p{N}._\-\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PROJECT_NAME)
  return cleaned
}

/**
 * Build one filesystem-safe project slug from a display name.
 * CJK names keep their characters (valid on modern filesystems); spaces and
 * unsafe characters become `-`. Falls back to `vcg-project-<timestamp>`.
 */
export function projectSlug(name) {
  const base = String(name ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 48)
  return base === '' ? `vcg-project-${Date.now().toString(36)}` : base
}

/** Default root for projects created without an explicit path. */
export function defaultProjectsRoot(env = process.env) {
  return join(homedir(), 'dsh-vcg-projects')
}

/** Suggest the project directory path. */
export function suggestProjectPath({ name, path, root }) {
  const explicit = typeof path === 'string' ? path.trim() : ''
  if (explicit !== '') return explicit
  return join(root && String(root).trim() !== '' ? String(root) : defaultProjectsRoot(), projectSlug(name))
}

/**
 * Validate a project display name for creation; throws a readable error.
 */
export function requireProjectName(raw) {
  const name = sanitizeProjectName(raw)
  if (name === '') throw new Error('项目名称不能为空（仅支持中英文、数字、空格及 . _ -）')
  return name
}
