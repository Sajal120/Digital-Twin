import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  // During build without database, return predefined static params
  // This prevents database connections during build time
  return [
    { slug: 'getting-started-with-ai' },
    { slug: 'full-stack-development-tips' },
    { slug: 'machine-learning-basics' },
    { slug: 'web-development-trends' },
  ]
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/posts/' + slug
  const post = await queryPostBySlug({ slug })

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  
  // Return static metadata during build without database queries
  const staticMetadata: Record<string, { title: string; description: string }> = {
    'getting-started-with-ai': {
      title: 'Getting Started with AI - Sajal Basnet',
      description: 'Learn the fundamentals of artificial intelligence and machine learning.',
    },
    'full-stack-development-tips': {
      title: 'Full-Stack Development Tips - Sajal Basnet',
      description: 'Essential tips and best practices for full-stack web development.',
    },
    'machine-learning-basics': {
      title: 'Machine Learning Basics - Sajal Basnet',
      description: 'Introduction to machine learning concepts and applications.',
    },
    'web-development-trends': {
      title: 'Web Development Trends - Sajal Basnet',
      description: 'Current trends and future directions in web development.',
    }
  }
  
  return staticMetadata[slug] || {
    title: 'Blog Post - Sajal Basnet',
    description: 'Insights and articles by Sajal Basnet on development and AI/ML.',
  }
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  // Skip database queries during build time if no DATABASE_URL is available
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
    console.log(`Skipping post query for "${slug}" during build - no database connection available`)
    return null
  }

  try {
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'posts',
      draft,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  } catch (error) {
    console.warn(`Failed to query post by slug "${slug}":`, error)
    return null
  }
})
