'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthState, useAuthActions } from '@/hooks/useAuth.v2';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Phone,
  MapPin,
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

// Form schema for onboarding
const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select your gender',
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    required_error: 'Please select your marital status',
  }),
  occupation: z.string().optional(),
  education: z.enum(
    ['primary', 'secondary', 'diploma', 'bachelor', 'master', 'phd', 'other'],
    {
      required_error: 'Please select your education level',
    }
  ),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  interests: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const STEPS = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Tell us about yourself',
    icon: User,
    fields: ['fullName', 'username', 'phone', 'dateOfBirth', 'gender'],
  },
  {
    id: 2,
    title: 'Contact & Address',
    description: 'Where can we reach you?',
    icon: MapPin,
    fields: ['address', 'emergencyContact', 'emergencyPhone'],
  },
  {
    id: 3,
    title: 'Background Information',
    description: 'Help us serve you better',
    icon: Building2,
    fields: ['maritalStatus', 'occupation', 'education', 'interests'],
  },
];

export default function OnboardingPage() {
  const { t } = useLanguage();
  const { user, profile, isLoading } = useAuthState();
  const { updateProfileExtended } = useAuthActions();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      username: profile?.username || '',
      phone: profile?.phone || '',
      address: '',
      dateOfBirth: '',
      gender: undefined,
      maritalStatus: undefined,
      occupation: '',
      education: undefined,
      emergencyContact: '',
      emergencyPhone: '',
      interests: '',
    },
  });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Check if profile is already complete
  useEffect(() => {
    if (profile && profile.full_name && profile.phone) {
      // Profile seems complete, redirect to dashboard
      router.push('/dashboard');
    }
  }, [profile, router]);

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS.find((step) => step.id === currentStep);

  const validateCurrentStep = () => {
    if (!currentStepData) return false;

    const fieldsToValidate = currentStepData.fields;
    const values = form.getValues();
    let hasErrors = false;

    for (const field of fieldsToValidate) {
      const value = values[field as keyof OnboardingFormValues];

      // Check if field is empty
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        // Allow optional fields in later steps
        if (
          currentStep > 1 &&
          [
            'address',
            'emergencyContact',
            'emergencyPhone',
            'occupation',
            'interests',
            'dateOfBirth',
          ].includes(field)
        ) {
          continue;
        }

        form.setError(field as keyof OnboardingFormValues, {
          message: 'This field is required',
        });
        hasErrors = true;
      }
    }

    if (hasErrors) {
      // Scroll to first error
      const firstError = document.querySelector('[data-invalid]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return !hasErrors;
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteSetup = async () => {
    // Clear any previous errors
    setError(null);

    // Validate the current step first
    if (!validateCurrentStep()) {
      setError('Please fill in all required fields before completing setup.');
      return;
    }

    // Then trigger the form submission
    const formData = form.getValues();
    await onSubmit(formData);
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Only update fields that exist in the profiles table
      await updateProfileExtended({
        full_name: data.fullName,
        username: data.username,
        phone: data.phone,
        // Note: Other fields like address, dateOfBirth, etc. are not in the current profiles schema
        // They would need to be added to the database schema if required
      });

      // Redirect to dashboard after successful onboarding
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(
        err.message || 'An error occurred during onboarding. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipOnboarding = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to the Mosque Management System!
            </h1>
            <p className="text-muted-foreground">
              Let's set up your profile to get started
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      isActive
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : isCompleted
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStepData && (
                  <currentStepData.icon className="w-5 h-5" />
                )}
                {currentStepData?.title}
              </CardTitle>
              <CardDescription>{currentStepData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Choose a unique username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+60123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 2: Contact & Address */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your full address"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Full name of emergency contact"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+60123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Background Information */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marital Status *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your marital status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">
                                  Divorced
                                </SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your job title or profession"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="education"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Education Level *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your highest education" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="primary">
                                  Primary School
                                </SelectItem>
                                <SelectItem value="secondary">
                                  Secondary School
                                </SelectItem>
                                <SelectItem value="diploma">Diploma</SelectItem>
                                <SelectItem value="bachelor">
                                  Bachelor's Degree
                                </SelectItem>
                                <SelectItem value="master">
                                  Master's Degree
                                </SelectItem>
                                <SelectItem value="phd">PhD</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interests & Skills</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your interests, skills, or how you'd like to contribute to the mosque community"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={skipOnboarding}
                        className="text-muted-foreground"
                      >
                        Skip for now
                      </Button>

                      {currentStep < STEPS.length ? (
                        <Button type="button" onClick={nextStep}>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleCompleteSetup}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Completing...
                            </>
                          ) : (
                            'Complete Setup'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
