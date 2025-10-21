'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-dark-border bg-dark-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {t('footer.about')}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {t('footer.description')}
            </p>
            <p className="text-xs text-text-muted">
              {t('footer.disclaimer')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              {t('footer.resources')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/analysis" className="text-sm text-text-secondary hover:text-text-primary">
                  {t('nav.analysis')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <a
                  href="https://nof1.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  nof1.ai ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              {t('footer.connect')}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/alphaarena_live"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  Twitter ↗
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yourusername/alphaarena-live"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-dark-border">
          <p className="text-xs text-text-muted text-center">
            © {currentYear} {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
