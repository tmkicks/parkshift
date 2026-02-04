import { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const faqData = [
    {
      category: 'Getting Started',
      questions: [
        {
          id: 1,
          question: 'How do I create an account on ParkShift?',
          answer: 'You can create an account by clicking the "Sign Up" button on our homepage. You can register using your email address or Google account. After registration, you\'ll need to verify your email address to complete the setup.'
        },
        {
          id: 2,
          question: 'Is ParkShift free to use?',
          answer: 'Creating an account and browsing parking spaces is completely free. We only charge a small service fee when you make a booking. This fee helps us maintain the platform and provide customer support.'
        },
        {
          id: 3,
          question: 'What areas does ParkShift cover?',
          answer: 'Currently, ParkShift is focused on the Belgian market, with coverage in major cities like Brussels, Antwerp, Ghent, and Liège. We\'re continuously expanding to new areas based on demand.'
        }
      ]
    },
    {
      category: 'Booking & Parking',
      questions: [
        {
          id: 4,
          question: 'How do I book a parking space?',
          answer: 'To book a parking space: 1) Search for your desired location, 2) Select your vehicle and dates/times, 3) Browse available spaces, 4) Click "Book Now" on your chosen space, 5) Complete payment. You\'ll receive instant confirmation.'
        },
        {
          id: 5,
          question: 'Can I cancel my booking?',
          answer: 'Yes, you can cancel bookings through your profile. Cancellation policies vary by space owner, but we generally allow free cancellation up to 24 hours before your booking starts. Check the specific terms when booking.'
        },
        {
          id: 6,
          question: 'What if I can\'t find the parking space?',
          answer: 'Each booking includes detailed access instructions from the space owner. You can also message the owner directly through our chat feature. If you still have issues, contact our support team immediately.'
        },
        {
          id: 7,
          question: 'What happens if my car doesn\'t fit?',
          answer: 'All parking spaces list exact dimensions, and our system checks vehicle compatibility before allowing bookings. If there\'s an issue, you can report it through our dispute system for a potential refund.'
        }
      ]
    },
    {
      category: 'Listing Your Space',
      questions: [
        {
          id: 8,
          question: 'How do I list my parking space?',
          answer: 'Go to the "Listings" section in your profile and click "Add Listing". You\'ll need to provide space details, dimensions, photos, and availability. Our team may review new listings before they go live.'
        },
        {
          id: 9,
          question: 'How much can I earn from my parking space?',
          answer: 'Earnings depend on location, demand, and amenities. Our platform suggests competitive pricing based on local rates. Popular locations during peak times can earn €5-15 per day or more.'
        },
        {
          id: 10,
          question: 'When do I get paid?',
          answer: 'Payments are processed automatically after each completed booking. Funds are typically transferred to your bank account within 2-3 business days via Stripe Connect.'
        }
      ]
    },
    {
      category: 'Payment & Billing',
      questions: [
        {
          id: 11,
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit and debit cards (Visa, Mastercard, Maestro, American Express) through Stripe. You can also use Apple Pay and Google Pay for faster checkout.'
        },
        {
          id: 12,
          question: 'When am I charged for a booking?',
          answer: 'Payment is processed immediately when you confirm a booking. You\'ll see the full amount including any service fees before completing your purchase.'
        },
        {
          id: 13,
          question: 'How do refunds work?',
          answer: 'Refunds are processed according to the cancellation policy of each space. Approved refunds are returned to your original payment method within 5-10 business days.'
        }
      ]
    },
    {
      category: 'Safety & Support',
      questions: [
        {
          id: 14,
          question: 'Is my car safe in these parking spaces?',
          answer: 'While we verify space owners, parking is at your own risk. We recommend choosing spaces with security features and reading reviews from other users. Consider your vehicle insurance coverage.'
        },
        {
          id: 15,
          question: 'What if there\'s a dispute?',
          answer: 'Our dispute resolution system helps resolve issues between users and space owners. Report problems through your booking, and our support team will mediate. We aim to resolve disputes within 48 hours.'
        },
        {
          id: 16,
          question: 'How do I contact customer support?',
          answer: 'You can reach our support team at support@parkshift.be or through the in-app chat feature. We typically respond within 24 hours during business days.'
        }
      ]
    }
  ];

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => searchQuery === '' || 
           q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find answers to common questions about ParkShift
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {filteredFAQ.map((category) => (
            <div key={category.category}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 pr-4">
                        {item.question}
                      </h3>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedItems.has(item.id) && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Still need help?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@parkshift.be"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <HelpCircle size={20} />
            Contact Support
          </a>
        </div>
      </div>
    </Layout>
  );
}
