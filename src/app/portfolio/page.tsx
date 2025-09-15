import { redirect } from 'next/navigation'

// Redirect /portfolio to home page since portfolio is now the main page
export default function PortfolioPage() {
  redirect('/')
}
