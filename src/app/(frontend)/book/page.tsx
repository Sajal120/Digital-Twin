'use client'

import { useEffect } from 'react'

export default function BookingPage() {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Schedule a Meeting</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Book a time that works for you. I'm available for consultations, project discussions,
            and collaborations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-card border rounded-xl p-8 shadow-lg">
          {/* Cal.com Inline Embed */}
          <div
            data-cal-link="sajal-basnet-9820tk/30min"
            data-cal-config='{"layout":"month_view"}'
            style={{ width: '100%', height: '100%', overflow: 'scroll' }}
          />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="font-semibold mb-2">Project Discussion</h3>
            <p className="text-sm text-muted-foreground">
              Discuss your project requirements and technical challenges
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="font-semibold mb-2">Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Explore partnership and collaboration opportunities
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="font-semibold mb-2">Consultation</h3>
            <p className="text-sm text-muted-foreground">
              Get technical advice and strategic guidance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
