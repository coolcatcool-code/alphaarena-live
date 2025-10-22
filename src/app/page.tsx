import { StructuredData } from '@/components/seo/StructuredData'
import { websiteSchema, leaderboardSchema } from './homepage-schema'
import { HomePageClient } from './HomePageClient'

export default function HomePage() {
  return (
    <>
      <StructuredData data={websiteSchema} />
      <StructuredData data={leaderboardSchema} />
      <HomePageClient />
    </>
  )
}
