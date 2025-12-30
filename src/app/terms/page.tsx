'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Shield, Users, Ban, Trophy, Scale, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold font-headline">Terms & Conditions</h1>
        </div>
        <p className="text-muted-foreground">
          QuizzBuzz – Free Skill-Based Contests
        </p>
        <p className="text-sm text-muted-foreground">
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
            These Terms & Conditions ("Terms") govern participation in all contests, quizzes, fantasy challenges, and promotional activities ("Contests") hosted on QuizzBuzz ("Platform", "We", "Us", "Our").
          </p>
          <p className="mt-3">
            By accessing or participating in any Contest on the Platform, you agree to be bound by these Terms.
          </p>
        </CardContent>
      </Card>

      {/* Section 2: Nature of the Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            2. Nature of the Platform
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>QuizzBuzz hosts free-to-play, skill-based contests.</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>No entry fee or payment is required to participate.</li>
            <li>The Platform does not offer gambling, betting, wagering, or real-money gaming.</li>
            <li>All Contests are conducted purely for skill assessment, entertainment, and promotion.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 3: Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            3. Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>To participate, you must:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Be <strong className="text-foreground">18 years of age or older</strong></li>
            <li>Be a <strong className="text-foreground">resident of India</strong></li>
            <li>Have valid contact details (email / phone)</li>
            <li>Not be an employee, contractor, or immediate family member of QuizzBuzz or its sponsors (where applicable)</li>
          </ul>
          <p className="mt-3">
            QuizzBuzz reserves the right to verify eligibility at any time.
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Free Participation */}
      <Card>
        <CardHeader>
          <CardTitle>4. Free Participation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Participation in all Contests is completely free.</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>No entry fees, subscriptions, deposits, or payments are collected from participants.</li>
            <li>Users do not risk any money by participating.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 5: Skill-Based Contests */}
      <Card>
        <CardHeader>
          <CardTitle>5. Skill-Based Contests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Contest outcomes are determined solely by skill, knowledge, judgment, and performance.</li>
            <li>No element of chance, luck, or randomness determines winners.</li>
            <li>Leaderboards and rankings are based on predefined performance criteria.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 6: Prizes & Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>6. Prizes & Rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">6.1 Nature of Prizes</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All prizes are non-cash promotional rewards.</li>
              <li>Prizes may include merchandise, tickets, subscriptions, experiences, certificates, or sponsor-provided items.</li>
              <li>Prizes are not redeemable for cash, wallet balance, or bank transfer.</li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-2">6.2 Funding</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All prizes are fully funded by sponsors or partners.</li>
              <li>No user payments are used to fund rewards.</li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-2">6.3 Limitations</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Prizes are non-transferable and non-exchangeable.</li>
              <li>QuizzBuzz reserves the right to substitute a prize with another of equal or greater value.</li>
              <li>Visual representations of prizes are illustrative only.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Winner Selection & Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>7. Winner Selection & Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Winners are selected based on final rankings as per Contest rules.</li>
            <li>Winners will be notified via in-app notification and/or email.</li>
            <li>Prizes will be distributed within 30 days of Contest completion.</li>
            <li>Failure to respond or claim a prize within the stipulated period may result in forfeiture.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 8: Taxes */}
      <Card>
        <CardHeader>
          <CardTitle>8. Taxes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Any personal tax liability arising from receiving a prize, if applicable, is solely the responsibility of the winner.</li>
            <li>QuizzBuzz does not provide tax advice or assistance.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 9: Fair Play & Disqualification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5" />
            9. Fair Play & Disqualification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Participants must not:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use unfair means, bots, automation, or multiple accounts</li>
              <li>Manipulate rankings or misuse the Platform</li>
              <li>Provide false information</li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-2">QuizzBuzz reserves the right to:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Disqualify any participant</li>
              <li>Cancel or modify Contests</li>
              <li>Withhold prizes in case of violations</li>
            </ul>
            <p className="mt-3">
              All decisions of QuizzBuzz shall be final and binding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 10: Platform Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            10. Platform Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>QuizzBuzz reserves the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Modify, suspend, or terminate any Contest</li>
            <li>Update these Terms at any time</li>
            <li>Remove content or users violating policies</li>
            <li>Change Contest rules with prior notice where feasible</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 11: Intellectual Property */}
      <Card>
        <CardHeader>
          <CardTitle>11. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>All content, branding, logos, and software on the Platform are owned by or licensed to QuizzBuzz.</li>
            <li>Users may not copy, reproduce, or exploit Platform content without permission.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 12: Limitation of Liability */}
      <Card>
        <CardHeader>
          <CardTitle>12. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="mb-3">Participation is at the user's own risk.</p>
          <p>QuizzBuzz shall not be liable for:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Technical issues</li>
            <li>Network failures</li>
            <li>Delayed prize delivery due to third parties</li>
            <li>Losses not directly caused by the Platform</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 13: Indemnity */}
      <Card>
        <CardHeader>
          <CardTitle>13. Indemnity</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>You agree to indemnify and hold harmless QuizzBuzz from any claims, losses, or damages arising from:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Violation of these Terms</li>
            <li>Misuse of the Platform</li>
            <li>Breach of applicable laws</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 14: Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>14. Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>User data is handled in accordance with the{' '}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>.
          </p>
          <p className="mt-2">
            By using the Platform, you consent to data collection and usage as described therein.
          </p>
        </CardContent>
      </Card>

      {/* Section 15: Governing Law & Jurisdiction */}
      <Card>
        <CardHeader>
          <CardTitle>15. Governing Law & Jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>These Terms shall be governed by the laws of India.</li>
            <li>Courts of Hyderabad, Telangana shall have exclusive jurisdiction.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 16: Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            16. Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>For queries or grievances, contact:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span><strong className="text-foreground">Email:</strong> support@quizzbuzz.in</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span><strong className="text-foreground">Address:</strong> [Your Registered Address]</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 17: Acceptance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>17. Acceptance</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="font-semibold text-foreground">
            Participation in any Contest constitutes full acceptance of these Terms & Conditions.
          </p>
        </CardContent>
      </Card>

      {/* Final Note */}
      <Card className="border-green-500/20 bg-green-500/5">
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
