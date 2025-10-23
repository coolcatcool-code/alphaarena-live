import { StructuredData } from '@/components/seo/StructuredData'
import { websiteSchema, leaderboardSchema } from './homepage-schema'
import { faqSchema, organizationSchema, breadcrumbSchema } from './faq-schema'
import { HomePageClient } from './HomePageClient'

export default function HomePage() {
  return (
    <>
      <StructuredData data={websiteSchema} />
      <StructuredData data={leaderboardSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={organizationSchema} />
      <StructuredData data={breadcrumbSchema} />
      <HomePageClient />
    </>
  )
}
