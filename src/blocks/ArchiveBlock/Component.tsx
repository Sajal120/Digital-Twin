import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []

  if (populateBy === 'collection') {
    // Skip database queries during build time if no DATABASE_URL is available
    if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
      console.log('Skipping ArchiveBlock database query during build - no database connection available')
      posts = []
    } else {
      try {
        const payload = await getPayload({ config: configPromise })

        const flattenedCategories = categories?.map((category) => {
          if (typeof category === 'object') return category.id
          else return category
        })

        const fetchedPosts = await payload.find({
          collection: 'posts',
          depth: 1,
          limit,
          ...(flattenedCategories && flattenedCategories.length > 0
            ? {
                where: {
                  categories: {
                    in: flattenedCategories,
                  },
                },
              }
            : {}),
        })

        posts = fetchedPosts.docs
      } catch (error) {
        console.warn('Failed to fetch posts for ArchiveBlock:', error)
        posts = []
      }
    }
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs.map((post) => {
        if (typeof post.value === 'object') return post.value
      }) as Post[]

      posts = filteredSelectedPosts
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
