/**
 * Redirects configuration for Next.js
 * Used to handle URL redirects and rewrites
 */

/** @type {() => Promise<import('next').NextConfig['redirects']>} */
export default async function redirects() {
  return [
    // Add your redirects here
    // Example:
    // {
    //   source: '/old-path',
    //   destination: '/new-path',
    //   permanent: true,
    // },
  ]
}
