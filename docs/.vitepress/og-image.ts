import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatePromise = fs.readFile(join(__dirname, 'og-template.svg'), 'utf-8')

const BADGE_COLORS: Record<string, string> = {
  beginner: '#42b883',
  intermediate: '#e2a63b',
  advanced: '#e25555'
}

const BADGE_WIDTHS: Record<string, number> = {
  beginner: 130,
  intermediate: 170,
  advanced: 140
}

const DIFFICULTY_ES: Record<string, string> = {
  beginner: 'PRINCIPIANTE',
  intermediate: 'INTERMEDIO',
  advanced: 'AVANZADO'
}

const BADGE_WIDTHS_ES: Record<string, number> = {
  beginner: 180,
  intermediate: 160,
  advanced: 150
}

const TAG_ES: Record<string, string> = {
  accessibility: 'accesibilidad',
  animation: 'animación',
  architecture: 'arquitectura',
  components: 'componentes',
  core: 'fundamentos',
  'data-fetching': 'obtención de datos',
  debugging: 'depuración',
  directives: 'directivas',
  'error-handling': 'manejo de errores',
  errors: 'errores',
  forms: 'formularios',
  lifecycle: 'ciclo de vida',
  migration: 'migración',
  performance: 'rendimiento',
  reactivity: 'reactividad',
  security: 'seguridad',
  'state-management': 'gestión de estado',
  styling: 'estilos',
  tooling: 'herramientas'
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wordWrap(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (current && (current + ' ' + word).length > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  if (current) lines.push(current)

  return lines.slice(0, 3)
}

export async function generateOgImage(
  slug: string,
  title: string,
  difficulty: string,
  tags: string[],
  outDir: string,
  lang = 'en'
): Promise<string> {
  const filename = `og-${slug}.png`
  const outPath = join(outDir, filename)

  try {
    await fs.access(outPath)
    return filename
  } catch {
    // File doesn't exist, generate it
  }

  const isEs = lang === 'es'
  const lines = wordWrap(title, 38)
  const badgeColor = BADGE_COLORS[difficulty] || BADGE_COLORS.beginner
  const badgeWidth = isEs
    ? BADGE_WIDTHS_ES[difficulty] || 180
    : BADGE_WIDTHS[difficulty] || 130
  const diffLabel = isEs
    ? DIFFICULTY_ES[difficulty] || difficulty.toUpperCase()
    : difficulty.toUpperCase()
  const translatedTags = isEs ? tags.map((t) => TAG_ES[t] || t) : tags
  const tagsText = translatedTags.join('  ·  ')

  const data: Record<string, string> = {
    title_line1: escapeXml(lines[0] || ''),
    title_line2: escapeXml(lines[1] || ''),
    title_line3: escapeXml(lines[2] || ''),
    difficulty: diffLabel,
    badge_color: badgeColor,
    badge_width: String(badgeWidth),
    tags: escapeXml(tagsText)
  }

  const template = await templatePromise
  const svg = template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '')

  await sharp(Buffer.from(svg)).resize(1200, 630).png().toFile(outPath)

  return filename
}
