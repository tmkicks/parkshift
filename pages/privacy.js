import Layout from '../components/Layout';
import { Shield, Calendar } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Privacy Policy
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar size={16} />
            <span>Last updated: [Date to be added]</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
              🔒 Placeholder Content
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              This is placeholder content for the Privacy Policy. The actual privacy terms will be added by the ParkShift team to comply with GDPR and Belgian privacy laws.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We collect information you provide directly to us, such as when you create an account, list a parking space, or contact us for support.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Personal Information
            </h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Name and contact information</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Vehicle information</li>
              <li>Profile pictures and user-generated content</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Usage Data
            </h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Search history and preferences</li>
              <li>Booking and transaction history</li>
              <li>Communications with other users</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We use the information we collect to provide, maintain, and improve our services.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Process bookings and payments</li>
              <li>Facilitate communication between users</li>
              <li>Provide customer support</li>
              <li>Improve our platform and services</li>
              <li>Send important notifications about your account</li>
              <li>Comply with legal requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              3. Information Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>With other users as necessary to facilitate bookings</li>
              <li>With service providers (like Stripe for payments)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your consent for specific purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              4. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure database storage</li>
              <li>Regular security audits</li>
              <li>Limited access to personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              5. Your Rights (GDPR)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Right to access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Right to erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to restrict processing:</strong> Limit how we use your data</li>
              <li><strong>Right to data portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to object:</strong> Object to processing of your personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              6. Cookies and Tracking
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We use cookies and similar technologies to enhance your experience on our platform.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Essential cookies for platform functionality</li>
              <li>Analytics cookies to understand usage patterns</li>
              <li>Preference cookies to remember your settings</li>
              <li>You can control cookies through your browser settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              7. Third-Party Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Our platform integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
              <li><strong>Mapbox:</strong> Map services (see Mapbox's privacy policy)</li>
              <li><strong>Google:</strong> Authentication and maps (see Google's privacy policy)</li>
              <li><strong>Supabase:</strong> Database and authentication services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              8. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> privacy@parkshift.be<br />
                <strong>Data Protection Officer:</strong> [Name to be added]<br />
                <strong>Address:</strong> [Company address to be added]<br />
                <strong>Phone:</strong> [Phone number to be added]
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
