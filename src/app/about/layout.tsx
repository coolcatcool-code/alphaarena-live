import { StructuredData } from '@/components/seo/StructuredData'
import { faqSchema, organizationSchema, metadata } from './metadata'

export { metadata }

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={organizationSchema} />
      {children}
    </>
  )
}
