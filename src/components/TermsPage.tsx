'use client';

import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">
          ← Back to Ducati
        </Link>

        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Ducati, you accept and agree to be bound by the terms and
            provision of this agreement.
          </p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily use Ducati for personal, non-commercial transitory
            viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section>
          <h2>3. Disclaimer</h2>
          <p>
            The information provided by Ducati is for general informational purposes only. All
            information is provided in good faith, however we make no representation or warranty of
            any kind regarding the accuracy, adequacy, validity, reliability, availability or
            completeness of any information.
          </p>
        </section>

        <section>
          <h2>4. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
