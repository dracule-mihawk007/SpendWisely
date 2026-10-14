import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-privacy-policy',
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
          <h1>Privacy Policy</h1>
          <p class="legal-effective-date">Effective Date: October 14, 2026 | Last Updated: October 14, 2026</p>
        </div>

        <section class="legal-section">
          <h2>1. Overview</h2>
          <p>
            SpendWisely ("we", "our", or "us") provides a personal finance management and expense tracking platform.
            This Privacy Policy explains how we collect, use, store, and protect your information when you use our website,
            application, and services.
          </p>
          <p>
            We adhere to strict data minimization principles. We collect only what is necessary to operate our service
            and do not sell, rent, or monetize your personal or financial data to third-party advertisers.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We collect information in the following categories:</p>
          <ul>
            <li>
              <strong>Account Information:</strong> When you register an account, we collect your full name, email address,
              and a cryptographic hash of your password. We never store plain-text passwords.
            </li>
            <li>
              <strong>Expense &amp; Financial Data:</strong> Information you enter or upload, including merchant names, transaction dates,
              amounts, tax details, itemized line items, and custom category assignments.
            </li>
            <li>
              <strong>Receipt Images:</strong> When you upload receipt images for optical extraction, images are stored in secure,
              authenticated object storage buckets solely for your personal record-keeping.
            </li>
            <li>
              <strong>Technical Logs:</strong> Standard web server logs including IP addresses, browser user-agent strings,
              and request timestamps, retained temporarily for diagnostic and security auditing purposes.
            </li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>Your information is used strictly to provide and improve the service:</p>
          <ul>
            <li>Authenticating your session and securing your account.</li>
            <li>Calculating category spending, budget limits, and monthly financial summaries.</li>
            <li>Processing receipt images to extract transaction line items, merchants, and totals at your request.</li>
            <li>Providing technical notifications regarding account status and security alerts.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            We implement industry-standard administrative, technical, and physical safeguards:
          </p>
          <ul>
            <li>
              <strong>Transport Encryption:</strong> All client-to-server traffic is transmitted over HTTPS utilizing TLS 1.3 encryption.
            </li>
            <li>
              <strong>Database Security:</strong> Relational data is hosted in managed PostgreSQL databases with encryption at rest
              and row-level scoping tied strictly to your authenticated user identifier.
            </li>
            <li>
              <strong>Password Protection:</strong> Passwords are hashed using salted BCrypt with high work factors before persistence.
            </li>
            <li>
              <strong>Token Security:</strong> User sessions are managed via digitally signed JSON Web Tokens (JWT) with restricted lifetimes.
            </li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Third-Party Service Providers</h2>
          <p>
            To provide the platform, we work with specialized infrastructure providers who are bound by data processing agreements:
          </p>
          <ul>
            <li>
              <strong>Database &amp; Object Storage:</strong> Supabase (PostgreSQL and private file storage).
            </li>
            <li>
              <strong>Hosting &amp; Compute:</strong> Vercel (Frontend edge CDN) and Render (Backend API services).
            </li>
            <li>
              <strong>Document Extraction:</strong> Google Cloud Vertex / Vision APIs for structured receipt parsing. Images sent for processing are not used to train public machine learning models.
            </li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>6. Your Rights and Data Deletion</h2>
          <p>
            You retain complete ownership and control over your financial records. You have the right to:
          </p>
          <ul>
            <li>Access and export your expense records in standard CSV format at any time directly from the Expenses page.</li>
            <li>Edit or delete individual transactions, line items, and custom categories.</li>
            <li>
              <strong>Permanent Account Deletion:</strong> You can permanently delete your account directly inside the app
              by clicking the account deletion icon in the header. Upon confirmation, your user record, categories, expenses,
              and associated receipt images are permanently expunged from our database.
            </li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>7. Cookies and Tracking</h2>
          <p>
            SpendWisely uses local storage exclusively for persisting your authentication session and theme preference (dark/light mode).
            We do not use tracking cookies, third-party analytics pixels, or cross-site fingerprinting scripts.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Updates to This Policy</h2>
          <p>
            We may update this policy occasionally to reflect service modifications or legal requirements.
            When updates are made, the revised effective date will be posted at the top of this page.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Contact Us</h2>
          <p>
            If you have questions or concerns regarding this Privacy Policy or data handling practices, please contact our
            security and privacy team at:
          </p>
          <p class="contact-box">
            <strong>SpendWisely Privacy Team</strong><br>
            Email: privacy&#64;spendwisely.app
          </p>
        </section>

        <footer class="legal-footer-nav">
          <a routerLink="/terms">View Terms &amp; Conditions</a>
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
export class PrivacyPolicyComponent {
  readonly authService = inject(AuthService);
}
