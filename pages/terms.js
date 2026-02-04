import Layout from '../components/Layout';
import { FileText, Calendar } from 'lucide-react';

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Terms of Service
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
              📝 Placeholder Content
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              This is placeholder content for the Terms of Service. The actual legal terms will be added by the ParkShift team.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] By accessing and using ParkShift, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              2. Service Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] ParkShift is a platform that connects parking space owners with users seeking parking. We facilitate transactions but are not party to the actual parking agreements between users and space owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for all activities under your account</li>
              <li>You must notify us immediately of any unauthorized use</li>
              <li>You must be at least 18 years old to use this service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              4. Booking and Payment Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Payment processing is handled securely through Stripe. All bookings are subject to availability and confirmation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              5. Listing Requirements
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] Space owners must provide accurate information about their parking spaces, including dimensions, amenities, and access instructions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              6. Prohibited Uses
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] The following uses are prohibited:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Fraudulent or misleading listings</li>
              <li>Harassment of other users</li>
              <li>Violation of local parking laws</li>
              <li>Use for illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] ParkShift acts as a platform facilitator and is not liable for disputes between users and space owners, vehicle damage, or other issues arising from parking arrangements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              8. Dispute Resolution
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We provide a dispute resolution system to help resolve conflicts between users. Disputes will be handled according to our dispute resolution process.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We reserve the right to terminate accounts that violate these terms. Users may delete their accounts by contacting support@parkshift.be.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              [Placeholder] We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> support@parkshift.be<br />
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
