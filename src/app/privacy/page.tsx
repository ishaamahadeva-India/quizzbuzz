'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, FileText, Database, Globe, Users, Ban, Mail, AlertCircle, Cookie } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground">
          QuizzBuzz
        </p>
        <p className="text-sm text-muted-foreground">
          Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-sm text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Short Disclosure */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground font-medium">
            We respect your privacy. No payment data collected. No cash gaming. Data handled as per India's DPDP Act, 2023.
          </p>
        </CardContent>
      </Card>

      {/* Section 1: Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            1. Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            QuizzBuzz ("Platform", "we", "us", "our") respects your privacy and is committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (India) ("DPDP Act").
          </p>
          <p className="mt-3">
            This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use our website, mobile application, or services.
          </p>
          <p className="mt-3">
            By accessing or using the Platform, you agree to this Privacy Policy.
          </p>
        </CardContent>
      </Card>

      {/* Section 2: Scope */}
      <Card>
        <CardHeader>
          <CardTitle>2. Scope</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>This Privacy Policy applies to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>All users of the QuizzBuzz platform</li>
            <li>All contests, quizzes, fantasy challenges, and promotional activities</li>
            <li>All data collected online through the Platform</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 3: Data We Collect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            3. Data We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>We collect only the minimum data required to operate the Platform.</p>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">3.1 Personal Data You Provide</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Mobile number</li>
              <li>Age / date of birth (for eligibility verification)</li>
              <li>Profile details (optional)</li>
              <li>Responses to quizzes or contests</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-2">3.2 Automatically Collected Data</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Device type, browser, operating system</li>
              <li>IP address (for security and analytics)</li>
              <li>Usage data (pages visited, time spent)</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Ban className="w-4 h-4 text-destructive" />
              We do NOT collect:
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Bank details</li>
              <li>Credit/debit card information</li>
              <li>Wallet details</li>
              <li>Aadhaar, PAN, or government IDs</li>
              <li>Biometric data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Purpose of Data Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            4. Purpose of Data Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Your data is used only for lawful purposes, including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>User registration and account management</li>
            <li>Contest participation and leaderboard generation</li>
            <li>Prize distribution and winner communication</li>
            <li>Fraud prevention and fair play enforcement</li>
            <li>Platform analytics and performance improvement</li>
            <li>Customer support and grievance handling</li>
            <li>Legal and regulatory compliance</li>
          </ul>
          <p className="mt-3">
            We do not use your data for gambling, betting, or financial profiling.
          </p>
        </CardContent>
      </Card>

      {/* Section 5: Consent */}
      <Card>
        <CardHeader>
          <CardTitle>5. Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>By registering or using the Platform, you provide explicit consent for data processing.</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Consent is collected at the time of signup.</li>
            <li>You may withdraw consent at any time by contacting us (see Section 12).</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 6: Data Sharing & Disclosure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            6. Data Sharing & Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>We do not sell or rent your personal data.</p>
          <p>Your data may be shared only with:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Trusted service providers (hosting, analytics, notifications)</li>
            <li>Sponsors only if required for prize fulfillment</li>
            <li>Government or legal authorities, if required by law</li>
          </ul>
          <p className="mt-3">
            All third parties are bound by confidentiality and data protection obligations.
          </p>
        </CardContent>
      </Card>

      {/* Section 7: Data Storage & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            7. Data Storage & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Data is stored on secure servers located in India or jurisdictions with adequate protection.</li>
            <li>We use reasonable technical and organizational safeguards to protect data.</li>
            <li>Access is restricted to authorized personnel only.</li>
          </ul>
          <p className="mt-3">
            However, no system is completely secure, and we cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      {/* Section 8: Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>8. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Personal data is retained only as long as necessary to fulfill its purpose.</li>
            <li>Inactive accounts may be deleted after a reasonable period.</li>
            <li>Data required for legal or audit purposes may be retained as per law.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 9: User Rights (DPDP Act) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            9. User Rights (DPDP Act)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Under the DPDP Act, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>✅ Access your personal data</li>
            <li>✅ Correct or update inaccurate data</li>
            <li>✅ Request deletion of personal data</li>
            <li>✅ Withdraw consent</li>
            <li>✅ Nominate another person to exercise your rights</li>
            <li>✅ File a grievance with us</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at the details provided below.
          </p>
        </CardContent>
      </Card>

      {/* Section 10: Children's Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>10. Children's Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>The Platform is intended for users 18 years and above.</li>
            <li>We do not knowingly collect data from minors.</li>
            <li>If we discover data of a minor, it will be deleted promptly.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 11: Cookies Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            11. Cookies Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>We use cookies to improve user experience and analytics.</li>
            <li>You may control cookie preferences through your browser settings.</li>
            <li>Disabling cookies may affect some features of the Platform.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 12: Grievance Redressal & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            12. Grievance Redressal & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>In compliance with the DPDP Act, we have appointed a Grievance Officer.</p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Grievance Officer:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-foreground">Name:</strong> [Insert Name]</li>
              <li><strong className="text-foreground">Email:</strong> privacy@quizzbuzz.in</li>
              <li><strong className="text-foreground">Response Time:</strong> Within 7 working days</li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <p>For general queries, contact:</p>
            <p className="mt-2">
              <Mail className="w-4 h-4 inline mr-2" />
              <strong className="text-foreground">Email:</strong> support@quizzbuzz.in
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 13: Updates to This Policy */}
      <Card>
        <CardHeader>
          <CardTitle>13. Updates to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>We may update this Privacy Policy from time to time.</li>
            <li>Changes will be posted on the Platform.</li>
            <li>Continued use after updates constitutes acceptance.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 14: Governing Law */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            14. Governing Law
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>This Privacy Policy shall be governed by the laws of India.</p>
        </CardContent>
      </Card>

      {/* Section 15: Acceptance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>15. Acceptance</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="font-semibold text-foreground">
            By using QuizzBuzz, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
          </p>
        </CardContent>
      </Card>

      {/* Final Note */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            This Privacy Policy is DPDP Act-aligned, safe for all Indian states, and matches our FREE + NON-CASH model.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
