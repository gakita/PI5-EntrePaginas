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

export function getBookPlaceholderCover(book: {
  title?: string | null
  type?: string | null
  genres?: string[]
  categories?: string[]
}): string {
  const type = (book.type || '').toLowerCase()
  const title = normalizeTaxonomyText(book.title || '')
  
  // Combine all genres and categories
  const tags = [
    ...(book.genres || []),
    ...(book.categories || []),
  ].map(t => normalizeTaxonomyText(t))

  // 1. Check type first (since HQ and Manga are very distinct types)
  if (type === 'manga' || type === 'mangá') {
    return '/images/categories/mangaPlaceholder.png'
  }
  if (type === 'hq' || type === 'comics' || tags.includes('comics') || tags.includes('comic') || tags.includes('quadrinhos') || tags.includes('graphic novel')) {
    return '/images/categories/hqPlaceholder.png'
  }

  // 2. Check for Manga/HQ in genres/categories as well
  if (tags.some(t => t.includes('manga') || t.includes('manga'))) {
    return '/images/categories/mangaPlaceholder.png'
  }
  if (tags.some(t => t.includes('hq') || t.includes('comic') || t.includes('quadrinho') || t.includes('graphic novel'))) {
    return '/images/categories/hqPlaceholder.png'
  }

  // 3. Match specific genres/categories
  // Terror/Horror
  if (tags.some(t => t.includes('terror') || t.includes('horror') || t.includes('gotic') || t.includes('gótico') || t.includes('sombrio'))) {
    return '/images/categories/terrorPlaceholder.png'
  }
  
  // Ficção Científica / Sci-Fi
  if (tags.some(t => t.includes('ficcao cientifica') || t.includes('ficção científica') || t.includes('sci-fi') || t.includes('scifi') || t.includes('science fiction'))) {
    return '/images/categories/ficcaoCientificaPlaceholder.png'
  }
  
  // Distopia
  if (tags.some(t => t.includes('distopia') || t.includes('dystopia') || t.includes('apocaliptico') || t.includes('apocalíptico'))) {
    return '/images/categories/distopiaPlaceholder.png'
  }

  // Fantasia
  if (tags.some(t => t.includes('fantasia') || t.includes('fantasy') || t.includes('magia') || t.includes('mitologia'))) {
    return '/images/categories/fantasiaPlaceholder.png'
  }

  // Romance Histórico
  if (tags.some(t => t.includes('romance historico') || t.includes('romance histórico') || tags.some(x => x.includes('historico') || x.includes('histórico')))) {
    // If it also matches romance, let's make sure historic romance goes here
    if (tags.some(t => t.includes('romance'))) {
      return '/images/categories/romanceHistoricoPlaceholder.png'
    }
  }

  // Romance
  if (tags.some(t => t.includes('romance') || t.includes('amor') || t.includes('apaixonado') || t.includes('romantico') || t.includes('romântico'))) {
    return '/images/categories/romancePlaceholder.png'
  }

  // Mistério Policial / Mistério / Policial
  if (tags.some(t => t.includes('misterio') || t.includes('mistério') || t.includes('policial') || t.includes('detetive') || t.includes('crime'))) {
    return '/images/categories/misterioPolicialPlaceholder.png'
  }

  // Suspense / Thriller
  if (tags.some(t => t.includes('suspense') || t.includes('thriller') || t.includes('intriga'))) {
    return '/images/categories/suspensePlaceholder.png'
  }

  // Aventura
  if (tags.some(t => t.includes('aventura') || t.includes('adventure') || t.includes('ação') || t.includes('acao'))) {
    return '/images/categories/aventuraPlaceholder.png'
  }

  // Drama
  if (tags.some(t => t.includes('drama') || t.includes('tragico') || t.includes('trágico') || t.includes('melodrama'))) {
    return '/images/categories/dramaPlaceholder.png'
  }

  // Não Ficção / Biografia / História
  if (tags.some(t => t.includes('nao ficcao') || t.includes('não ficção') || t.includes('biografia') || t.includes('biography') || t.includes('histor') || t.includes('history') || t.includes('ensaio') || t.includes('autoajuda') || t.includes('divulgacao cientifica'))) {
    return '/images/categories/naoFiccaoPlaceholder.png'
  }

  // 4. Try matching title as a fallback if no tag matches
  if (title.includes('manga') || title.includes('manga')) return '/images/categories/mangaPlaceholder.png'
  if (title.includes('hq') || title.includes('comic') || title.includes('quadrinho')) return '/images/categories/hqPlaceholder.png'
  if (title.includes('terror') || title.includes('horror') || title.includes('fantasma') || title.includes('dracula') || title.includes('vampiro')) return '/images/categories/terrorPlaceholder.png'
  if (title.includes('fantasia') || title.includes('elfo') || title.includes('magia') || title.includes('bruxo') || title.includes('hobbit') || title.includes('anel')) return '/images/categories/fantasiaPlaceholder.png'
  if (title.includes('sci-fi') || title.includes('cientifica') || title.includes('científica') || title.includes('espacial') || title.includes('alien') || title.includes('futuro') || title.includes('duna')) return '/images/categories/ficcaoCientificaPlaceholder.png'
  if (title.includes('romance') || title.includes('amor') || title.includes('apaix') || title.includes('namor')) return '/images/categories/romancePlaceholder.png'
  if (title.includes('misterio') || title.includes('mistério') || title.includes('crime') || title.includes('detetive') || title.includes('polic')) return '/images/categories/misterioPolicialPlaceholder.png'
  if (title.includes('suspense') || title.includes('thriller') || title.includes('assassino')) return '/images/categories/suspensePlaceholder.png'
  if (title.includes('aventura') || title.includes('adventure') || title.includes('viagem') || title.includes('busca')) return '/images/categories/aventuraPlaceholder.png'
  if (title.includes('drama') || title.includes('vida') || title.includes('morte') || title.includes('perda')) return '/images/categories/dramaPlaceholder.png'
  if (title.includes('biografia') || title.includes('historia') || title.includes('história')) return '/images/categories/naoFiccaoPlaceholder.png'

  // Ultimate fallback
  return '/images/categories/generic-book.svg'
}
