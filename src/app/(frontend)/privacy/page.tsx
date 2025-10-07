export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <p className="text-gray-600 mb-4">
          <strong>Last updated:</strong> October 8, 2025
        </p>

        <h2>Information We Collect</h2>
        <p>When you sign in with Google, we collect:</p>
        <ul>
          <li>Your name</li>
          <li>Your email address</li>
          <li>Your profile picture</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide you with a personalized chat experience</li>
          <li>Save your conversation history</li>
          <li>Display your profile information in the chat interface</li>
        </ul>

        <h2>Data Storage</h2>
        <p>Your conversation data is stored securely using:</p>
        <ul>
          <li>Vercel Postgres for conversation history</li>
          <li>Upstash Redis for caching</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li>
            <strong>Google OAuth:</strong> For authentication
          </li>
          <li>
            <strong>Groq:</strong> For AI chat responses
          </li>
          <li>
            <strong>Deepgram:</strong> For voice transcription
          </li>
          <li>
            <strong>ElevenLabs:</strong> For voice synthesis
          </li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of data collection by not signing in</li>
        </ul>

        <h2>Cookies</h2>
        <p>We use cookies for:</p>
        <ul>
          <li>Authentication session management</li>
          <li>Remembering your preferences</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your data. However, no method
          of transmission over the internet is 100% secure.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          This service is not intended for children under 13 years of age. We do not knowingly
          collect personal information from children.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes by
          posting the new policy on this page.
        </p>

        <h2>Contact Us</h2>
        <p>If you have questions about this privacy policy, please contact:</p>
        <p>
          <strong>Email:</strong> basnetsajal120@gmail.com
          <br />
          <strong>Website:</strong> https://www.sajal-app.online
        </p>
      </div>
    </div>
  )
}
