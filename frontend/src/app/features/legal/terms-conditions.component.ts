import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page-container">
      <header class="legal-header">
        <a routerLink="/" class="legal-brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <span class="brand-title">SpendWisely</span>
        </a>
        <div class="legal-header-actions">
          <a [routerLink]="authService.isAuthenticated() ? '/dashboard' : '/login'" class="btn btn-secondary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>{{ authService.isAuthenticated() ? 'Back to Dashboard' : 'Back to Sign In' }}</span>
          </a>
        </div>
      </header>

      <main class="legal-content glass-card animate-fade-in">
        <div class="legal-title-section">
          <h1>Terms &amp; Conditions</h1>
          <p class="legal-effective-date">Effective Date: October 14, 2026 | Last Updated: October 14, 2026</p>
        </div>

        <section class="legal-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using SpendWisely ("the Service"), you agree to be bound by these Terms &amp; Conditions.
            If you do not agree with any part of these terms, you must not use or access the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            SpendWisely is a software platform designed to assist users with expense tracking, digital receipt storage,
            budget monitoring, and financial organization. The Service includes web interfaces, automated data extraction,
            and reporting features.
          </p>
        </section>

        <section class="legal-section">
          <h2>3. No Financial or Tax Advice</h2>
          <p>
            SpendWisely is a productivity and record-keeping tool. The Service, its calculations, and its data exports
            do not constitute certified accounting, tax, investment, or legal advice.
          </p>
          <p>
            You are solely responsible for verifying the accuracy of transaction amounts, tax computations, and category classifications
            before using records for official tax filings or business accounting.
          </p>
        </section>

        <section class="legal-section">
          <h2>4. User Accounts and Security</h2>
          <p>When you create an account with SpendWisely, you agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete registration information.</li>
            <li>Maintain the confidentiality of your password and access credentials.</li>
            <li>Promptly notify us if you detect unauthorized access or security breaches involving your account.</li>
            <li>Accept responsibility for all activities that occur under your authenticated account.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Acceptable Use Policy</h2>
          <p>You agree not to use SpendWisely to:</p>
          <ul>
            <li>Upload documents containing malware, viruses, malicious code, or illegal content.</li>
            <li>Attempt to probe, scan, or compromise the vulnerability of our API endpoints or servers.</li>
            <li>Circumvent rate limits, authentication barriers, or security access controls.</li>
            <li>Access or scrape data belonging to any other user of the platform.</li>
            <li>Use automated scripts or bots to extract platform data without written authorization.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>6. User Content &amp; Document Ownership</h2>
          <p>
            You retain full intellectual property rights to all receipts, financial notes, and transactions you submit to the Service.
            We claim no ownership over your personal data.
          </p>
          <p>
            You grant us only the limited, non-exclusive license strictly necessary to store, parse, index, and display your documents
            to you in accordance with the features of the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Intellectual Property of the Platform</h2>
          <p>
            The software architecture, source code, visual design, icons, logos, brand elements, and documentation
            of SpendWisely are the proprietary property of SpendWisely and are protected by applicable intellectual property laws.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Termination and Account Deletion</h2>
          <p>
            You may terminate your account at any time using the in-app account deletion tool. Upon confirmation,
            your account and associated data are permanently purged from active databases.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in malicious activity,
            or present operational risks to our infrastructure.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied,
            including but not limited to implied warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.
          </p>
        </section>

        <section class="legal-section">
          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, SpendWisely and its operators shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or loss of profits, data, or business goodwill arising from
            your use or inability to use the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via the platform
            or by updating the effective date at the top of this document. Continued use of the platform after updates indicates
            acceptance of the revised terms.
          </p>
        </section>

        <section class="legal-section">
          <h2>12. Contact Information</h2>
          <p>For questions regarding these Terms &amp; Conditions, please contact:</p>
          <p class="contact-box">
            <strong>SpendWisely Legal Department</strong><br>
            Email: legal&#64;spendwisely.app
          </p>
        </section>

        <footer class="legal-footer-nav">
          <a routerLink="/privacy-policy">View Privacy Policy</a>
          <span class="legal-sep">·</span>
          <a [routerLink]="authService.isAuthenticated() ? '/dashboard' : '/login'">Return to Application</a>
        </footer>
      </main>
    </div>
  `,
  styles: [`
    .legal-page-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem 4rem;
    }
    .legal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .legal-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .legal-content {
      padding: 2.5rem 2.75rem;
      border-radius: var(--radius-lg);
    }
    .legal-title-section {
      margin-bottom: 2rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .legal-title-section h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
    }
    .legal-effective-date {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0;
    }
    .legal-section {
      margin-bottom: 2rem;
    }
    .legal-section h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .legal-section p {
      color: var(--text-secondary);
      font-size: 0.925rem;
      line-height: 1.65;
      margin-bottom: 0.75rem;
    }
    .legal-section ul {
      margin: 0.5rem 0 1rem 1.25rem;
      color: var(--text-secondary);
      font-size: 0.925rem;
      line-height: 1.65;
    }
    .legal-section li {
      margin-bottom: 0.5rem;
    }
    .contact-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      margin-top: 0.5rem;
    }
    .legal-footer-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.85rem;
    }
    .legal-footer-nav a {
      color: var(--primary);
      text-decoration: none;
    }
    .legal-footer-nav a:hover {
      text-decoration: underline;
    }
    .legal-sep {
      color: var(--border-card);
    }
    @media (max-width: 640px) {
      .legal-page-container {
        padding: 1.5rem 1rem 3rem;
      }
      .legal-content {
        padding: 1.75rem 1.25rem;
      }
      .legal-title-section h1 {
        font-size: 1.6rem;
      }
    }
  `]
})
export class TermsConditionsComponent {
  readonly authService = inject(AuthService);
}
