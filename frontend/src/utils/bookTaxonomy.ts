import type { CatalogBook } from '@/services'

export type TaxonomyOption = {
  key: string
  label: string
  aliases: string[]
}

export const genreOptions: TaxonomyOption[] = [
  {
    key: 'fantasy',
    label: 'Fantasia',
    aliases: ['fantasy', 'fantasia'],
  },
  {
    key: 'science fiction',
    label: 'Ficção científica',
    aliases: ['science fiction', 'sci-fi', 'ficção científica', 'ficcao cientifica'],
  },
  {
    key: 'romance',
    label: 'Romance',
    aliases: ['romance'],
  },
  {
    key: 'horror',
    label: 'Terror',
    aliases: ['horror', 'terror'],
  },
  {
    key: 'mystery',
    label: 'Mistério',
    aliases: ['mystery', 'mistério', 'misterio'],
  },
  {
    key: 'suspense',
    label: 'Suspense',
    aliases: ['suspense', 'thriller'],
  },
  {
    key: 'adventure',
    label: 'Aventura',
    aliases: ['adventure', 'aventura'],
  },
  {
    key: 'drama',
    label: 'Drama',
    aliases: ['drama'],
  },
  {
    key: 'biography',
    label: 'Biografia',
    aliases: ['biography', 'biografia', 'memoir', 'memórias', 'memorias'],
  },
  {
    key: 'comedy',
    label: 'Comédia',
    aliases: ['comedy', 'comédia', 'comedia', 'humor'],
  },
]

export function normalizeTaxonomyText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getBookSearchText(book: CatalogBook) {
  return normalizeTaxonomyText([
    book.title,
    book.author,
    book.type,
    book.synopsis,
    ...(book.categories || []),
    ...(book.genres || []),
  ].filter(Boolean).join(' '))
}

function findOption(options: TaxonomyOption[], keyOrAlias?: string | null) {
  const normalizedValue = normalizeTaxonomyText(keyOrAlias)

  return options.find((option) =>
    normalizeTaxonomyText(option.key) === normalizedValue ||
    normalizeTaxonomyText(option.label) === normalizedValue ||
    option.aliases.some((alias) => normalizeTaxonomyText(alias) === normalizedValue),
  )
}

export function getGenreSearchKey(keyOrAlias?: string | null) {
  return findOption(genreOptions, keyOrAlias)?.key || keyOrAlias || ''
}

export function matchesBookGenre(book: CatalogBook, keyOrAlias?: string | null) {
  if (!keyOrAlias) return true

  const option = findOption(genreOptions, keyOrAlias)
  const aliases = option?.aliases || [keyOrAlias]
  const haystack = getBookSearchText(book)

  return aliases.some((alias) => haystack.includes(normalizeTaxonomyText(alias)))
}
