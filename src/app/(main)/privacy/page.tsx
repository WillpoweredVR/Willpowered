import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Willpowered",
  description: "Privacy Policy for Willpowered - Learn how we protect and handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: December 22, 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground mb-4">
              When you use Willpowered, we collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (name, email address)</li>
              <li>Purpose statements and principles you create</li>
              <li>Scorecard metrics and daily check-in data</li>
              <li>Conversations with Willson, our AI coach</li>
              <li>Subscription and payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your Willson coaching experience</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              3. Data Security
            </h2>
            <p className="text-muted-foreground mb-4">
              We take reasonable measures to help protect your personal information from loss, theft, 
              misuse, unauthorized access, disclosure, alteration, and destruction. Your data is 
              stored securely using industry-standard encryption.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              4. AI and Your Data
            </h2>
            <p className="text-muted-foreground mb-4">
              Willson, our AI coach, uses your data only to provide personalized coaching within the app. 
              Your conversations and personal information are not used to train AI models or shared with 
              third parties for their own purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              5. Your Rights
            </h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              6. Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:colin@willpowered.co" className="text-ember hover:underline">
                colin@willpowered.co
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}



