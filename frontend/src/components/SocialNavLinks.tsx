import { useTranslation } from 'react-i18next'
import type { SiteHeaderData, SiteHeaderSocialSlug } from '../types'

const ORDER: SiteHeaderSocialSlug[] = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'snapchat',
  'whatsapp',
]

function Icon({ platform }: { platform: SiteHeaderSocialSlug }) {
  const common = { className: 'w-5 h-5', fill: 'currentColor' as const, viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (platform) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881.001 1.44 1.44 0 012.881-.001z" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.69V2h-3.45v13.67a2.89 2.89 0 11-2.88-2.89c.01.16.02.33.05.49V9.4a7.33 7.33 0 00-1-.05A7.36 7.36 0 002 16.64a7.36 7.36 0 007.36 7.36 7.36 7.36 0 007.36-7.35v-7.5a9.24 9.24 0 005.87 2.09V6.69h-2.6z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common}>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'snapchat':
      return (
        <svg {...common}>
          <path d="M12.206.793c.99 0 4.347.276 5.524 4.051.29.978.623 2.182.84 3.484.348-.067.754-.104 1.213-.104 1.042 0 1.977.303 2.63.84.59.48.93 1.14.93 1.84 0 .72-.35 1.38-.94 1.86-.65.53-1.58.84-2.62.84-.46 0-.9-.04-1.3-.11-.22 1.29-.55 2.49-.84 3.47-1.17 3.78-4.53 4.05-5.52 4.05-.23 0-.45-.01-.66-.03-.21.02-.43.03-.66.03-.99 0-4.35-.27-5.52-4.05-.29-.98-.62-2.18-.84-3.47-.4.07-.84.11-1.3.11-1.04 0-1.97-.31-2.62-.84-.59-.48-.94-1.14-.94-1.86 0-.7.34-1.36.93-1.84.65-.54 1.59-.84 2.63-.84.46 0 .87.04 1.21.1.22-1.3.55-2.51.84-3.49C7.86 1.07 11.22.79 12.21.79z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    default:
      return null
  }
}

type Props = {
  data: SiteHeaderData | null
  variant?: 'desktop' | 'mobile'
}

export default function SocialNavLinks({ data, variant = 'desktop' }: Props) {
  const { t } = useTranslation()
  if (!data) return null

  const { contact_url, social } = data
  const hasSocial = ORDER.some((k) => social[k])
  if (!contact_url && !hasSocial) return null

  const wrap =
    variant === 'desktop'
      ? 'hidden md:flex items-center gap-1 me-2 border-e border-tobacco-700 pe-3'
      : 'flex flex-wrap items-center justify-center gap-3 py-3'

  return (
    <div className={wrap}>
      {ORDER.map((platform) => {
        const href = social[platform]
        if (!href) return null
        const label =
          platform === 'x'
            ? 'X'
            : platform.charAt(0).toUpperCase() + platform.slice(1)
        return (
          <a
            key={platform}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gold-400 hover:text-gold-300 hover:bg-tobacco-800 transition-colors"
            aria-label={label}
            title={label}
          >
            <Icon platform={platform} />
          </a>
        )
      })}
      {contact_url ? (
        <a
          href={contact_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium text-gold-400 hover:text-gold-300 whitespace-nowrap ${variant === 'mobile' ? 'w-full text-center' : ''}`}
        >
          {t('nav.contact_us')}
        </a>
      ) : null}
    </div>
  )
}
