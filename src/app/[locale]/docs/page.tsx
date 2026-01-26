'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Shield, Settings, Users, CreditCard, FileText, Building, DollarSign, Database } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('');

  const chapters = [
    { id: 'introduction', title: 'Introduction', icon: BookOpen },
    { id: 'getting-started', title: 'Getting Started', icon: Shield },
    { id: 'dashboard', title: 'Dashboard Overview', icon: Building },
    { id: 'mosque-profile', title: 'Mosque Profile', icon: Settings },
    { id: 'khairat-members', title: 'Khairat Members', icon: Users },
    { id: 'payments', title: 'Payments & Settings', icon: CreditCard },
    { id: 'claims', title: 'Claims Management', icon: FileText },
    { id: 'billing', title: 'Billing & Subscription', icon: DollarSign },
  ];

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    chapters.forEach((chapter) => {
      const element = sectionRefs.current[chapter.id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DocsLayout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <BookOpen className="h-4 w-4" />
                      Chapters
                    </div>
                    <nav className="space-y-1">
                      {chapters.map((chapter) => {
                        const isActive = activeSection === chapter.id;
                        const Icon = chapter.icon;
                        return (
                          <button
                            key={chapter.id}
                            onClick={() => scrollToSection(chapter.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                              isActive
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold border-l-4 border-primary'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {chapter.title}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h1 className="text-4xl font-bold mb-4">Mosque Administrator Guide</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    A comprehensive guide to help you manage your mosque using the khairatkita platform
                  </p>

                  <div className="space-y-12">
                    {/* Introduction */}
                    <section
                      id="introduction"
                      ref={(el) => (sectionRefs.current['introduction'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Introduction</h2>
                      <div className="space-y-4">
                        <p>
                          Welcome to the khairatkita mosque administrator guide! This tutorial will walk you through all the essential features you need to manage your mosque community effectively.
                        </p>
                        <p>
                          As a mosque administrator, you have access to powerful tools for managing khairat members, processing contributions, handling claims, and maintaining accurate records. This guide covers everything from initial setup to daily operations.
                        </p>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-medium mb-2">Quick Note</p>
                          <p className="text-sm">
                            Make sure you have your admin verification code ready when setting up your account. This code is required to create an administrator account.
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Getting Started */}
                    <section
                      id="getting-started"
                      ref={(el) => (sectionRefs.current['getting-started'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Getting Started</h2>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-medium mb-3">Step 1: Create Your Admin Account</h3>
                          <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Visit the homepage and click on "Sign Up"</li>
                            <li>Enter your email address and create a secure password, or sign up with Google</li>
                            <li>Complete the onboarding process and select "Mosque Administrator" as your account type</li>
                            <li>Enter the admin verification code when prompted</li>
                            <li>Select your mosque role (Imam, Board Member, Treasurer, Secretary, etc.)</li>
                          </ol>
                          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-sm font-medium mb-2">Admin Verification Code</p>
                            <p className="text-sm">
                              You'll need an admin verification code to create an administrator account. Contact your system administrator or the platform support team to obtain this code.
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Step 2: Complete Initial Setup</h3>
                          <p className="mb-4">After creating your account, follow these essential setup steps:</p>
                          <div className="space-y-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">1</span>
                                Complete Mosque Profile
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Add your mosque's basic information, contact details, and location. Upload your logo and banner image. This information will appear on your public mosque page.
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Go to: Mosque Page → Profile tab
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">2</span>
                                Configure Payment Settings
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Set up payment methods (online payment, bank transfer, or cash). Configure your payment gateway if using online payments. Set fixed prices for each payment method if needed.
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Go to: Payment Settings
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">3</span>
                                Review Dashboard
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Familiarize yourself with the admin dashboard. You'll see statistics, quick actions, and a getting started checklist that tracks your setup progress.
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Go to: Dashboard (main page after login)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Dashboard Overview */}
                    <section
                      id="dashboard"
                      ref={(el) => (sectionRefs.current['dashboard'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Dashboard Overview</h2>
                      <div className="space-y-4">
                        <p>
                          Your dashboard is the central hub for managing your mosque. It provides an overview of key metrics and quick access to important actions.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Statistics Cards</h3>
                          <p className="mb-3">The dashboard displays four key statistics:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Total Contributed:</strong> Total amount of khairat contributions received</li>
                            <li><strong>New Registrations:</strong> Number of pending khairat applications</li>
                            <li><strong>Total Members:</strong> Total number of active khairat members</li>
                            <li><strong>Successful Claims:</strong> Number of approved and processed claims</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Getting Started Checklist</h3>
                          <p className="mb-3">The dashboard includes a checklist that tracks your setup progress:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Setup Mosque Profile</li>
                            <li>Setup Payments</li>
                            <li>First Application (when you receive your first khairat application)</li>
                            <li>First Payment (when you receive your first contribution)</li>
                            <li>First Claim (when you process your first claim)</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Quick Actions</h3>
                          <p className="mb-3">Quick access buttons for common tasks:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Review pending claims</li>
                            <li>Review pending registrations</li>
                            <li>View recent contributions</li>
                            <li>Access key management pages</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Mosque Profile */}
                    <section
                      id="mosque-profile"
                      ref={(el) => (sectionRefs.current['mosque-profile'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Mosque Profile Management</h2>
                      <div className="space-y-4">
                        <p>
                          Your mosque profile is your public-facing page where community members can discover your mosque and learn about your services. The profile page has three main tabs.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Profile Tab</h3>
                          <p className="mb-3">Manage your mosque's basic information:</p>
                          <div className="space-y-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Basic Information
                              </h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Mosque Name (required)</li>
                                <li>Institution Type (Mosque or Surau)</li>
                                <li>Established Year</li>
                                <li>Description</li>
                                <li>Capacity</li>
                                <li>Imam Name</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                Mosque Branding
                              </h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Upload Mosque Logo (square format, recommended 512x512 pixels)</li>
                                <li>Upload Banner Image (wide format, recommended 1920x400 pixels)</li>
                                <li>Images should be under 5MB for best results</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                Contact Information
                              </h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Complete address (address line 1, address line 2, city, state, postcode, country)</li>
                                <li>Phone number</li>
                                <li>Email address</li>
                                <li>Website URL (optional)</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-orange-600" />
                                Profile Visibility
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Toggle between public and private. Public profiles are visible to all users, while private profiles are only visible to members.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Organization People Tab</h3>
                          <p className="mb-2">Manage organization members and staff:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Enable or disable the Organization People service</li>
                            <li>Add and manage organization members</li>
                            <li>Assign roles and responsibilities</li>
                            <li>View organization structure</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Khairat Settings Tab</h3>
                          <p className="mb-2">Configure khairat registration information:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Custom Message:</strong> Add a custom message shown to users when they register for khairat</li>
                            <li><strong>Registration Requirements:</strong> List the requirements for khairat membership</li>
                            <li><strong>Membership Benefits:</strong> Describe the benefits of joining khairat</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Khairat Members */}
                    <section
                      id="khairat-members"
                      ref={(el) => (sectionRefs.current['khairat-members'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Khairat Members Management</h2>
                      <div className="space-y-4">
                        <p>
                          Manage your mosque's khairat members. Khairat is a welfare program where community members contribute to support families in need.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Members Page</h3>
                          <p className="mb-3">The Members page allows you to:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>View All Members:</strong> See all registered khairat members with their status</li>
                            <li><strong>Register New Member:</strong> Manually add a new khairat member</li>
                            <li><strong>Review Applications:</strong> View and process khairat membership applications from community members</li>
                            <li><strong>Update Member Information:</strong> Edit member details, IC number, and status</li>
                            <li><strong>Manage Member Status:</strong> Approve, reject, suspend, or withdraw memberships</li>
                            <li><strong>View Member Details:</strong> See full member profile including dependents and contribution history</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Applications Page</h3>
                          <p className="mb-2">The Applications page shows pending khairat membership applications:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Review application details</li>
                            <li>Approve or reject applications</li>
                            <li>View applicant information</li>
                            <li>See application history</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Payments */}
                    <section
                      id="payments"
                      ref={(el) => (sectionRefs.current['payments'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Payments & Settings</h2>
                      <div className="space-y-4">
                        <p>
                          Manage khairat contributions and configure payment methods for your mosque.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Payments Page</h3>
                          <p className="mb-3">View and manage all khairat contributions:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>See all contributions from community members</li>
                            <li>Track payment status (pending, completed, failed)</li>
                            <li>Filter by date range, status, or member</li>
                            <li>View payment details and transaction history</li>
                            <li>Export payment data</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Payment Settings Page</h3>
                          <p className="mb-3">Configure how members can pay contributions:</p>
                          <div className="space-y-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2">Online Payment</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Enable or disable online payments (requires Standard or Pro plan)</li>
                                <li>Configure payment gateway (Billplz or Stripe)</li>
                                <li>Set fixed price for online payments (optional)</li>
                                <li>View payment page preview</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2">Bank Transfer</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Enable or disable bank transfer payments</li>
                                <li>Enter bank account details (bank name, account number, account holder name)</li>
                                <li>Add reference/notes instructions for members</li>
                                <li>Set fixed price for bank transfer payments (optional)</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <h4 className="font-semibold mb-2">Cash Payment</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Enable or disable cash payments</li>
                                <li>Enter payment location and office hours</li>
                                <li>Add contact person and phone number</li>
                                <li>Provide payment instructions</li>
                                <li>Set fixed price for cash payments (optional)</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                            <p className="text-sm font-medium mb-2">Plan Restrictions</p>
                            <p className="text-sm">
                              Free plan only supports bank transfer and cash payments. Online payments require Standard or Pro plan. You can upgrade from the Billing page.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Claims */}
                    <section
                      id="claims"
                      ref={(el) => (sectionRefs.current['claims'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Claims Management</h2>
                      <div className="space-y-4">
                        <p>
                          When khairat members need financial assistance, they can submit claims. As an administrator, you review and process these claims.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Managing Claims</h3>
                          <p className="mb-3">The Claims page allows you to:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>View All Claims:</strong> See all claims with their status (pending, approved, rejected, settled)</li>
                            <li><strong>Review Claim Details:</strong> View full claim information including amount, reason, and supporting documents</li>
                            <li><strong>Process Claims:</strong> Approve or reject claims based on eligibility and available funds</li>
                            <li><strong>Update Claim Status:</strong> Mark claims as settled after payment is made</li>
                            <li><strong>Filter and Search:</strong> Find specific claims by status, date, or member</li>
                            <li><strong>View Claim History:</strong> See all past claims and their outcomes</li>
                          </ul>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-medium mb-2">Important</p>
                          <p className="text-sm">
                            Always review claim details carefully, including any uploaded documents, before approving or rejecting. Ensure you have sufficient funds before approving claims.
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Billing */}
                    <section
                      id="billing"
                      ref={(el) => (sectionRefs.current['billing'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">Billing & Subscription</h2>
                      <div className="space-y-4">
                        <p>
                          Manage your mosque's subscription plan and billing information.
                        </p>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Subscription Plans</h3>
                          <p className="mb-3">The platform offers three subscription plans:</p>
                          <div className="space-y-3">
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-semibold mb-2">Free Plan</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>Basic features</li>
                                <li>Bank transfer and cash payments only</li>
                                <li>Limited features</li>
                              </ul>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-semibold mb-2">Standard Plan</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>All Free plan features</li>
                                <li>Online payment support</li>
                                <li>Additional features</li>
                              </ul>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-semibold mb-2">Pro Plan</h4>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                                <li>All Standard plan features</li>
                                <li>Advanced features</li>
                                <li>Priority support</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">Billing Management</h3>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>View your current subscription plan</li>
                            <li>Upgrade or downgrade your plan</li>
                            <li>View billing history and invoices</li>
                            <li>Manage payment methods</li>
                            <li>Cancel subscription if needed</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Help Section */}
                  <section className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="font-semibold mb-2 text-lg">Need More Help?</h3>
                    <p className="text-sm mb-4">
                      If you have questions or need assistance, please contact support or refer to the detailed documentation for specific features.
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
