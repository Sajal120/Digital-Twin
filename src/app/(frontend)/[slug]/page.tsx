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
  // During build without database, return predefined static params
  // This prevents database connections during build time
  return [{ slug: 'about' }, { slug: 'contact' }, { slug: 'portfolio' }, { slug: 'blog' }]
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
  const { slug = 'home' } = await paramsPromise

  // Return static metadata during build without database queries
  const staticMetadata: Record<string, { title: string; description: string }> = {
    home: {
      title: 'Sajal Basnet - Full-stack Developer & AI/ML Engineer',
      description:
        'Portfolio of Sajal Basnet - Full-stack Developer & AI/ML Engineer passionate about creating innovative solutions.',
    },
    about: {
      title: 'About - Sajal Basnet',
      description: 'Learn more about Sajal Basnet, Full-stack Developer & AI/ML Engineer.',
    },
    contact: {
      title: 'Contact - Sajal Basnet',
      description: 'Get in touch with Sajal Basnet for collaboration opportunities.',
    },
    portfolio: {
      title: 'Portfolio - Sajal Basnet',
      description: 'Explore projects and work by Sajal Basnet.',
    },
    blog: {
      title: 'Blog - Sajal Basnet',
      description: 'Insights and articles by Sajal Basnet on development and AI/ML.',
    },
  }

  return staticMetadata[slug] || staticMetadata.home
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
