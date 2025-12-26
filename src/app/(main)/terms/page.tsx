import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Willpowered",
  description: "Terms of Service for Willpowered - Read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: December 22, 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using Willpowered, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground mb-4">
              Willpowered is a personal development platform that provides:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>AI-powered coaching through Willson</li>
              <li>Purpose discovery and principle development tools</li>
              <li>Personal scorecard tracking</li>
              <li>Daily check-in features</li>
              <li>Access to The Will of Heroes methodology</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <p className="text-muted-foreground mb-4">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You must immediately notify us 
              of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              4. Subscription and Payments
            </h2>
            <p className="text-muted-foreground mb-4">
              Willpowered offers both free and paid subscription tiers. Paid subscriptions are 
              billed on a recurring basis. You can cancel your subscription at any time through 
              your account settings or by contacting us.
            </p>
            <p className="text-muted-foreground mb-4">
              Free trial periods, if offered, will automatically convert to a paid subscription 
              unless cancelled before the trial ends. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              5. User Content
            </h2>
            <p className="text-muted-foreground mb-4">
              You retain ownership of the content you create using Willpowered, including your 
              purpose statements, principles, and scorecard data. By using our service, you grant 
              us a license to use this content solely to provide and improve our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              6. AI Coaching Disclaimer
            </h2>
            <p className="text-muted-foreground mb-4">
              Willson is an AI assistant designed to provide personal development coaching and 
              guidance. It is not a substitute for professional medical, psychological, legal, 
              or financial advice. If you are experiencing a crisis or need professional help, 
              please consult with appropriate professionals.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              7. Acceptable Use
            </h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share your account credentials with others</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground mb-4">
              Willpowered is provided &quot;as is&quot; without warranties of any kind. We are not 
              liable for any indirect, incidental, special, or consequential damages arising 
              from your use of the service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-muted-foreground mb-4">
              We may modify these terms at any time. We will notify you of significant changes 
              through the service or via email. Continued use of the service after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us at{" "}
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



