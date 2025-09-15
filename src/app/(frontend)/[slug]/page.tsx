import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  // Skip database queries during build time if no DATABASE_URL is available
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
    console.log('Skipping generateStaticParams during build - no database connection available')
    return []
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const pages = await payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    const params = pages.docs
      ?.filter((doc) => {
        return doc.slug !== 'home'
      })
      .map(({ slug }) => {
        return { slug }
      })

    return params || []
  } catch (error) {
    console.warn('generateStaticParams failed, returning empty array:', error)
    // Return empty array during build time if database is not available
    return []
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const url = '/' + slug

  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  // Skip database queries during build time if no DATABASE_URL is available
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
    console.log('Skipping generateMetadata during build - no database connection available')
    return {
      title: 'CMS Twin Portfolio',
      description: 'Full-stack Developer & AI/ML Engineer Portfolio',
    }
  }

  try {
    const { slug = 'home' } = await paramsPromise
    const page = await queryPageBySlug({
      slug,
    })

    return generateMeta({ doc: page })
  } catch (error) {
    console.warn('generateMetadata failed, returning default metadata:', error)
    return {
      title: 'CMS Twin Portfolio',
      description: 'Full-stack Developer & AI/ML Engineer Portfolio',
    }
  }
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  // Skip database queries during build time if no DATABASE_URL is available
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
    console.log(`Skipping page query for "${slug}" during build - no database connection available`)
    return null
  }

  try {
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  } catch (error) {
    console.warn(`Failed to query page by slug "${slug}":`, error)
    return null
  }
})
