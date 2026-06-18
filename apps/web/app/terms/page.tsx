import { brand } from '@hivora/shared/brand'

export default function TermsPage() {
  return (
    <div className="prose prose-invert mx-auto max-w-3xl py-16 px-4 text-[var(--color-text)]">
      <h1 className="text-4xl font-bold mb-6">{brand.displayName} Terms of Service</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Last updated: June 2024</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
      <p>
        By accessing and using {brand.displayName}, you accept and agree to be bound by the terms and provision of this agreement.
        If you do not agree to abide by the above, please do not use this service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
      <p>
        Permission is granted to temporarily download one copy of the materials (information or software) on {brand.displayName}
        for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under
        this license you may not:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Modifying or copying the materials</li>
        <li>Using the materials for any commercial purpose or for any public display</li>
        <li>Attempting to decompile or reverse engineer any software contained on {brand.displayName}</li>
        <li>Removing any copyright or other proprietary notations from the materials</li>
        <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
      <p>
        The materials on {brand.displayName} are provided on an 'as is' basis. {brand.displayName} makes no warranties,
        expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied
        warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
        property or other violation of rights.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
      <p>
        In no event shall {brand.displayName} or its suppliers be liable for any damages (including, without limitation, damages
        for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on
        {brand.displayName}, even if {brand.displayName} or an authorized representative has been notified orally or in writing
        of the possibility of such damage.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Accuracy of Materials</h2>
      <p>
        The materials appearing on {brand.displayName} could include technical, typographical, or photographic errors.
        {brand.displayName} does not warrant that any of the materials on its website are accurate, complete, or current.
        {brand.displayName} may make changes to the materials contained on its website at any time without notice.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Links</h2>
      <p>
        {brand.displayName} has not reviewed all of the sites linked to its website and is not responsible for the contents of
        any such linked site. The inclusion of any link does not imply endorsement by {brand.displayName} of the site. Use of any
        such linked website is at the user's own risk.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Modifications</h2>
      <p>
        {brand.displayName} may revise these terms of service for its website at any time without notice. By using this website,
        you are agreeing to be bound by the then current version of these terms of service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
      <p>
        These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which
        {brand.displayName} operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
      <p>
        If you have any questions about these Terms of Service, please contact us at support@{brand.displayName.toLowerCase()}.com
      </p>
    </div>
  )
}
