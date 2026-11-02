import { COMPANY } from '../data.js';

// TODO: have both policies reviewed (ideally by a legal professional) before launch and
// update them if analytics, cookies or new data collection are added to the site.
const UPDATED = 'November 2026';

function LegalPage({ title, children }) {
  return (
    <section className="page page--legal">
      <div className="container legal">
        <a className="legal__back" href="#contact">
          ← Back to Contact
        </a>
        <h1 className="page-head__title">{title}</h1>
        <p className="legal__updated">Last updated: {UPDATED}</p>
        {children}
      </div>
    </section>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains how {COMPANY.name} (“we”, “us”) handles information you share through this website.
      </p>
      <h2>Information we collect</h2>
      <p>
        We only collect the details you choose to send through the project inquiry form: your name, business email,
        company name, project type, target platform, budget range and project description. This website does not use advertising or
        tracking cookies.
      </p>
      <h2>How we use it</h2>
      <p>
        We use your details only to respond to your enquiry and to discuss a possible project with you. We do not sell
        or rent your information to anyone.
      </p>
      <h2>Storage and sharing</h2>
      <p>
        Form submissions may be processed by a trusted form or email provider on our behalf, solely to deliver your
        message to us. We keep enquiries only as long as needed to respond and for reasonable business records.
      </p>
      <h2>Your choices</h2>
      <p>You can ask us to access, correct or delete the information you have sent us at any time by contacting us.</p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By using this website you agree to these terms.</p>
      <h2>Website content</h2>
      <p>
        The content on this website is provided for general information about our services. Client projects in our
        portfolio are shown with our clients’ agreement. App mockups on the Mobile Apps page are illustrative examples
        and do not represent published apps.
      </p>
      <h2>Mobile app releases</h2>
      <p>
        We can help prepare and submit apps to Google Play and the Apple App Store, but approval and listing decisions
        are made by those stores and cannot be guaranteed.
      </p>
      <h2>No contract by enquiry</h2>
      <p>
        Sending an enquiry does not create a contract. Any project work is agreed separately in a written proposal or
        agreement that sets out scope, timelines and fees.
      </p>
      <h2>Intellectual property</h2>
      <p>
        The QORVYNT name, logo and website design belong to {COMPANY.name} and may not be copied or reused without
        permission.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. The latest version will always be available on this page.</p>
    </LegalPage>
  );
}
