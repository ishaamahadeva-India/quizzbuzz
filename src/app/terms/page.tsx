'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Shield, Users, Ban, Trophy, Scale } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold font-headline">Terms and Conditions</h1>
        </div>
        <p className="text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Mandatory Compliance Disclosures */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Mandatory Contest Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Free Participation</h4>
            <p className="text-muted-foreground">
              This is a FREE skill-based contest. No entry fee or payment is required to participate.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">2. Non-Cash Rewards</h4>
            <p className="text-muted-foreground">
              All prizes are non-cash promotional rewards. Prizes are not redeemable for cash, wallet balance, or bank transfer.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">3. Sponsor-Funded Rewards</h4>
            <p className="text-muted-foreground">
              All prizes are fully funded by sponsors and partners. No user payments are used to fund rewards.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">4. Skill-Based Outcome</h4>
            <p className="text-muted-foreground">
              Winners are determined based on skill, knowledge, and performance. No element of chance or luck determines the outcome.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">5. No Gambling or Betting</h4>
            <p className="text-muted-foreground">
              This platform does not offer gambling, betting, or wagering of any kind.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">6. Eligibility</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Open to residents of India</li>
              <li>Participants must be 18 years or older</li>
              <li>Employees of sponsors and their immediate family members are not eligible</li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">7. Prize Nature & Limitations</h4>
            <p className="text-muted-foreground">
              Prizes are non-transferable, non-exchangeable, and subject to availability. The platform reserves the right to substitute a prize of equal or greater value.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">8. Prize Distribution Timeline</h4>
            <p className="text-muted-foreground">
              Prizes will be distributed within 30 days of contest completion. Winners will be notified via in-app notification and/or email.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">9. Tax Disclaimer</h4>
            <p className="text-muted-foreground">
              Any personal tax liability arising from receiving a prize, if applicable, is the sole responsibility of the winner.
            </p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">10. Fair Play & Disqualification</h4>
            <p className="text-muted-foreground">
              The platform reserves the right to disqualify participants for fraud, misuse, or violation of rules. All decisions of the platform shall be final and binding.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Acceptance of Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            By accessing and using this Fantasy Gaming Platform ("Platform," "Service," "we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            <p className="mb-3">You must meet the following criteria to use our platform:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You must be at least <strong className="text-foreground">18 years of age</strong></li>
              <li>You must have the legal capacity to enter into binding agreements</li>
              <li>You must comply with all applicable laws and regulations in your jurisdiction</li>
              <li>You must provide accurate and truthful information during registration</li>
              <li>You must not be prohibited from using the service under applicable laws</li>
            </ul>
            <p className="mt-4">
              By creating an account, you represent and warrant that you meet all eligibility requirements.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Registration and Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Account Creation</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current, and complete information</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Account Restrictions</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>One account per user - multiple accounts are prohibited</li>
              <li>Sharing accounts with others is not allowed</li>
              <li>You must not use another person's account</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Platform Rules and Conduct
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            <h3 className="font-semibold text-foreground mb-2">Permitted Use</h3>
            <p>You agree to use the platform only for lawful purposes and in accordance with these Terms. You agree:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>To make predictions based on your knowledge and analysis</li>
              <li>To respect other users and maintain a positive community environment</li>
              <li>To comply with all applicable laws and regulations</li>
              <li>To provide accurate information when making predictions</li>
            </ul>
          </div>

          <div className="text-muted-foreground">
            <h3 className="font-semibold text-foreground mb-2">Prohibited Activities</h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Use automated systems, bots, or scripts to make predictions</li>
              <li>Attempt to manipulate scores, rankings, or leaderboards</li>
              <li>Engage in fraud, cheating, or any form of dishonest behavior</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post offensive, defamatory, or illegal content</li>
              <li>Violate any intellectual property rights</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Use the platform for any commercial purpose without authorization</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Violations and Enforcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We reserve the right to investigate violations of these Terms and take appropriate action, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Issuing warnings</li>
            <li>Suspending or terminating your account</li>
            <li>Removing your predictions and scores</li>
            <li>Banning you from the platform</li>
            <li>Reporting violations to law enforcement authorities</li>
            <li>Pursuing legal action for damages</li>
          </ul>
          <p className="mt-4">
            We use automated fraud detection systems and manual review to identify suspicious activity. If your account is flagged for suspicious behavior, it may be temporarily or permanently suspended pending review.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            The platform and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our platform without our prior written consent.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,</strong> either express or implied, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>We do not guarantee uninterrupted or error-free service</li>
            <li>We do not guarantee the accuracy of predictions or outcomes</li>
            <li>We are not responsible for any losses or damages resulting from your use of the platform</li>
            <li>We reserve the right to modify, suspend, or discontinue any part of the platform at any time</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indemnification</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            You agree to defend, indemnify, and hold harmless us and our officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with your access to or use of the platform or your violation of these Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governing Law</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of [Your Jurisdiction].
          </p>
          <p className="mt-4">
            <strong className="text-foreground">Note:</strong> Please replace [Your Jurisdiction] with your actual legal jurisdiction.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our platform after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Severability</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our platform and supersede and replace any prior agreements.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you have any questions about these Terms and Conditions, please contact us:
          </p>
          <div className="space-y-2">
            <p><strong className="text-foreground">Email:</strong> legal@fantasy.com</p>
            <p><strong className="text-foreground">Support:</strong> support@fantasy.com</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
          <p className="text-sm text-center text-muted-foreground mt-2">
            Please also review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

