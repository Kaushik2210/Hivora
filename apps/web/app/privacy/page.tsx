import { brand } from '@hivora/shared/brand'

export default function PrivacyPage() {
  return (
    <div className="prose prose-invert mx-auto max-w-3xl py-16 px-4 text-[var(--color-text)]">
      <h1 className="text-4xl font-bold mb-6">{brand.displayName} Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Last updated: June 2024</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
      <p>
        {brand.displayName} ("Company," "we," "us," or "our") operates the {brand.displayName} application.
        This page informs you of our policies regarding the collection, use, and disclosure of personal data
        when you use our Service and the choices you have associated with that data.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information Collection and Use</h2>
      <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Personal Data:</strong> Email address, authentication credentials, profile information, and organizational details</li>
        <li><strong>Usage Data:</strong> Device information, browser type, IP address, pages visited, and access timestamps</li>
        <li><strong>Project Data:</strong> Files, code changes, workflow configurations, and communication logs within the platform</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Use of Data</h2>
      <p>{brand.displayName} uses the collected data for various purposes:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>To provide and maintain our Service</li>
        <li>To notify you about changes to our Service</li>
        <li>To allow you to participate in interactive features of our Service</li>
        <li>To provide customer support</li>
        <li>To gather analysis or valuable information to improve our Service</li>
        <li>To monitor the usage of our Service</li>
        <li>To detect, prevent, and address technical or security issues</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
      <p>
        The security of your data is important to us but remember that no method of transmission over the Internet
        or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
        protect your Personal Data, we cannot guarantee its absolute security.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Changes to This Privacy Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
        Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at privacy@{brand.displayName.toLowerCase()}.com
      </p>
    </div>
  )
}
