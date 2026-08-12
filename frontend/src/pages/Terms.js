import { useNavigate } from 'react-router-dom';

const BG   = '#0A0A0B';
const BG2  = '#141416';
const BG3  = '#1C1C1F';
const AS   = '#C8FF00';
const AP   = '#FF3D00';
const TP   = '#FAFAF9';
const TS   = '#9A9A9D';
const TT   = '#5A5A5E';
const BS   = 'rgba(255,255,255,0.07)';

const display = { fontFamily: '"Clash Display", sans-serif' };
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const serif   = { fontFamily: '"Bodoni Moda", serif' };

const SECTIONS = [
  {
    id: '1',
    title: 'About Caesura',
    content: `Caesura ("we", "us", "our") is an online print-on-demand marketplace that connects independent artists and creators with buyers. We operate at caesura.in. By accessing or using our platform, you agree to be bound by these Terms and Conditions.`,
  },
  {
    id: '2',
    title: 'Eligibility',
    content: `You must be at least 18 years of age to use this platform. By creating an account, you confirm that you are 18 or older and that all information you provide is accurate and complete.`,
  },
  {
    id: '3',
    title: 'Accounts',
    bullets: [
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You are responsible for all activity that occurs under your account.',
      'We reserve the right to suspend or terminate accounts that violate these Terms.',
    ],
  },
  {
    id: '4',
    title: 'Creator Terms',
    subsections: [
      {
        title: '4.1 Submitting Designs',
        bullets: [
          'By submitting a design, you confirm that you are the original creator or have full rights to use and sell the design commercially.',
          'All submitted designs are subject to admin review and approval before going live on the marketplace.',
          'We reserve the right to reject any design without providing a reason.',
        ],
      },
      {
        title: '4.2 Intellectual Property',
        bullets: [
          'You retain full ownership of your original designs.',
          'By submitting a design, you grant Caesura a non-exclusive, royalty-free licence to reproduce, display, and sell your design on physical products for the purposes of operating the marketplace.',
          'You must not submit designs that infringe on the intellectual property, trademarks, copyrights, or publicity rights of any third party.',
        ],
      },
      {
        title: '4.3 Prohibited Content',
        content: 'You may not submit designs that contain:',
        bullets: [
          'Hate speech, discrimination, or content targeting individuals or groups based on race, religion, gender, sexual orientation, disability, or nationality',
          'Explicit sexual or pornographic content',
          'Depictions of violence, self-harm, or illegal activity',
          'Content that impersonates brands, public figures, or other creators',
          'Copyrighted material (logos, artwork, lyrics, imagery) you do not own or have explicit permission to use',
        ],
        footer: 'Violation of these rules will result in immediate removal and may result in account suspension.',
      },
      {
        title: '4.4 Revenue & Payouts',
        bullets: [
          'Creators earn 60% of the net margin on each sale (retail price minus landed production cost minus payment gateway fee, times 60%).',
          'Caesura retains 40% as a platform fee, with a guaranteed minimum of ₹100 per item sold.',
          'Earnings are tracked in your dashboard. Payout timelines and methods will be communicated separately.',
          'We reserve the right to withhold payouts if a design is found to infringe on third-party rights or violate these Terms.',
        ],
      },
    ],
  },
  {
    id: '5',
    title: 'Buyer Terms',
    subsections: [
      {
        title: '5.1 Orders',
        bullets: [
          'All orders are subject to availability and confirmation.',
          'Once an order is placed and payment is confirmed, it is sent to our print partner (Qikink) for production and dispatch.',
          'Estimated delivery times are 7–14 business days within India. Delays due to courier or production issues are outside our control.',
        ],
      },
      {
        title: '5.2 Payments',
        bullets: [
          'All prices are listed in Indian Rupees (₹) and include applicable taxes.',
          'Payments are processed securely via Razorpay. We do not store your card or UPI details.',
          'Orders are confirmed only after successful payment verification.',
        ],
      },
      {
        title: '5.3 Cancellations & Refunds',
        bullets: [
          'Orders cannot be cancelled once sent to print production (typically within 24 hours of placement).',
          'Refunds or replacements are issued only if: the product arrives damaged or defective; the wrong item or size was delivered; or the product was not delivered within 21 business days.',
          'To raise a refund or replacement request, contact us at support@caesura.in within 7 days of receiving the order, with photos of the issue.',
          'Refunds are processed to the original payment method within 5–7 business days.',
        ],
      },
      {
        title: '5.4 Size & Product Accuracy',
        bullets: [
          'Please refer to the size guide before purchasing. We do not accept returns for incorrect size selection.',
          'Colours displayed on screen may vary slightly from the printed product due to monitor calibration and fabric dye differences.',
        ],
      },
    ],
  },
  {
    id: '6',
    title: 'Print & Fulfilment',
    content: `Products are printed and fulfilled by Qikink, our third-party print-on-demand partner. Caesura acts as the storefront and marketplace layer. By placing an order, you acknowledge that production and shipping is handled by Qikink and that their production standards apply.`,
  },
  {
    id: '7',
    title: 'Intellectual Property — Platform',
    content: `The Caesura name, logo, website design, and all platform content created by us are our intellectual property. You may not copy, reproduce, or use them without written permission.`,
  },
  {
    id: '8',
    title: 'Limitation of Liability',
    bullets: [
      'Caesura is not liable for any indirect, incidental, or consequential damages arising from the use of this platform.',
      'Our total liability to any user for any claim shall not exceed the amount paid by that user in the preceding 3 months.',
      'We are not responsible for delays, losses, or damages caused by third-party services including payment processors, courier companies, or print partners.',
    ],
  },
  {
    id: '9',
    title: 'Disclaimer of Warranties',
    content: `The platform is provided "as is" without warranties of any kind. We do not guarantee that the platform will be uninterrupted, error-free, or free from viruses or other harmful components.`,
  },
  {
    id: '10',
    title: 'Termination',
    content: `We reserve the right to suspend or terminate your access to Caesura at any time, with or without notice, if you violate these Terms or engage in conduct we deem harmful to the platform, its users, or third parties.`,
  },
  {
    id: '11',
    title: 'Governing Law',
    content: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.`,
  },
  {
    id: '12',
    title: 'Changes to These Terms',
    content: `We may update these Terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms. We will notify users of material changes via email or an in-app notice.`,
  },
  {
    id: '13',
    title: 'Contact',
    content: `For questions, disputes, or support, reach us at support@caesura.in or through our website at caesura.in.`,
  },
];

function SectionBlock({ section }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px' }}>
        <span style={{ ...display, fontSize: '11px', color: AS, letterSpacing: '0.15em', fontWeight: 600, flexShrink: 0 }}>{section.id.padStart(2, '0')}</span>
        <h2 style={{ ...display, fontSize: '22px', fontWeight: 700, color: TP, margin: 0, letterSpacing: '-0.02em' }}>{section.title}</h2>
      </div>

      {section.content && (
        <p style={{ ...body, fontSize: '15px', color: TS, lineHeight: 1.75, margin: '0 0 12px' }}>{section.content}</p>
      )}

      {section.bullets && (
        <ul style={{ margin: '0 0 12px', padding: '0 0 0 0', listStyle: 'none' }}>
          {section.bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', ...body, fontSize: '15px', color: TS, lineHeight: 1.75, marginBottom: '8px' }}>
              <span style={{ color: AS, flexShrink: 0, marginTop: '2px' }}>—</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {section.subsections && section.subsections.map((sub, i) => (
        <div key={i} style={{ marginBottom: '24px', paddingLeft: '24px', borderLeft: `1px solid ${BS}` }}>
          <h3 style={{ ...body, fontSize: '13px', fontWeight: 700, color: TP, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px' }}>{sub.title}</h3>
          {sub.content && <p style={{ ...body, fontSize: '15px', color: TS, lineHeight: 1.75, margin: '0 0 8px' }}>{sub.content}</p>}
          {sub.bullets && (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {sub.bullets.map((b, j) => (
                <li key={j} style={{ display: 'flex', gap: '12px', ...body, fontSize: '15px', color: TS, lineHeight: 1.75, marginBottom: '8px' }}>
                  <span style={{ color: TT, flexShrink: 0, marginTop: '2px' }}>–</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {sub.footer && <p style={{ ...body, fontSize: '14px', color: AP, lineHeight: 1.6, margin: '12px 0 0', fontWeight: 600 }}>{sub.footer}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TP }}>
      {/* Minimal nav */}
      <div style={{ borderBottom: `1px solid ${BS}`, padding: '0 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ ...display, fontSize: '18px', fontWeight: 700, color: TP, letterSpacing: '-0.02em' }}>CAESURA</span>
          </button>
          <button onClick={() => navigate(-1)} style={{ ...body, background: 'none', border: `1px solid ${BS}`, borderRadius: '999px', color: TS, fontSize: '13px', padding: '8px 18px', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 40px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: '72px' }}>
          <p style={{ ...body, fontSize: '11px', color: AS, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 600 }}>Legal</p>
          <h1 style={{ ...serif, fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 400, color: TP, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Terms &<br />Conditions
          </h1>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ ...body, fontSize: '13px', color: TT }}>Effective: April 1, 2026</span>
            <span style={{ ...body, fontSize: '13px', color: TT }}>Last updated: April 1, 2026</span>
          </div>
        </div>

        {/* Intro callout */}
        <div style={{ background: BG2, border: `1px solid ${BS}`, borderRadius: '12px', padding: '24px 28px', marginBottom: '64px' }}>
          <p style={{ ...body, fontSize: '14px', color: TS, lineHeight: 1.75, margin: 0 }}>
            Please read these Terms carefully before using Caesura. By creating an account or placing an order, you agree to be bound by everything below. If you have questions, email us at{' '}
            <a href="mailto:support@caesura.in" style={{ color: AS, textDecoration: 'none' }}>support@caesura.in</a>.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: BS, marginBottom: '64px' }} />

        {/* Sections */}
        {SECTIONS.map(section => (
          <SectionBlock key={section.id} section={section} />
        ))}

        {/* Footer rule */}
        <div style={{ height: '1px', background: BS, margin: '64px 0 40px' }} />
        <p style={{ ...body, fontSize: '13px', color: TT, textAlign: 'center' }}>
          © 2026 Caesura. All rights reserved. · <a href="mailto:support@caesura.in" style={{ color: TS, textDecoration: 'none' }}>support@caesura.in</a>
        </p>
      </div>
    </div>
  );
}
