'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export default function TutorialPage() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('docs.tutorial');
  const [activeSection, setActiveSection] = useState('');

  const chapters = [
    { id: 'introduction', title: t('chapters.introduction') },
    { id: 'getting-started', title: t('chapters.gettingStarted') },
    { id: 'finding-mosques', title: t('chapters.findingMosques') },
    { id: 'making-contributions', title: t('chapters.makingContributions') },
    { id: 'managing-profile', title: t('chapters.managingProfile') },
    { id: 'tips', title: t('chapters.tips') },
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
                  <Link href={`/${locale}/docs`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('backToDocs')}
                    </Button>
                  </Link>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <BookOpen className="h-4 w-4" />
                      {t('chaptersTitle')}
                    </div>
                    <nav className="space-y-1">
                      {chapters.map((chapter) => {
                        const isActive = activeSection === chapter.id;
                        return (
                          <button
                            key={chapter.id}
                            onClick={() => scrollToSection(chapter.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold border-l-4 border-primary'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent text-slate-700 dark:text-slate-300'
                            }`}
                          >
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
                  <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    {t('description')}
                  </p>

                  <div className="space-y-12">
                    {/* Introduction */}
                    <section
                      id="introduction"
                      ref={(el) => (sectionRefs.current['introduction'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.introduction')}</h2>
                      <div className="space-y-4">
                        <p>{t('introduction.content1')}</p>
                        <p>{t('introduction.content2')}</p>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-medium mb-2">{t('introduction.note')}</p>
                          <p className="text-sm">{t('introduction.noteContent')}</p>
                        </div>
                      </div>
                    </section>

                    {/* Getting Started */}
                    <section
                      id="getting-started"
                      ref={(el) => (sectionRefs.current['getting-started'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.gettingStarted')}</h2>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-medium mb-3">{t('gettingStarted.step1.title')}</h3>
                          <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>{t('gettingStarted.step1.item1')}</li>
                            <li>{t('gettingStarted.step1.item2')}</li>
                            <li>{t('gettingStarted.step1.item3')}</li>
                          </ol>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-3">{t('gettingStarted.step2.title')}</h3>
                          <p className="mb-2">{t('gettingStarted.step2.content')}</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>{t('gettingStarted.step2.item1')}</li>
                            <li>{t('gettingStarted.step2.item2')}</li>
                            <li>{t('gettingStarted.step2.item3')}</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Finding Mosques */}
                    <section
                      id="finding-mosques"
                      ref={(el) => (sectionRefs.current['finding-mosques'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.findingMosques')}</h2>
                      <div className="space-y-4">
                        <p>{t('findingMosques.content1')}</p>
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              {t('findingMosques.step1.title')}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('findingMosques.step1.content')}
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              {t('findingMosques.step2.title')}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('findingMosques.step2.content')}
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              {t('findingMosques.step3.title')}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('findingMosques.step3.content')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Making Contributions */}
                    <section
                      id="making-contributions"
                      ref={(el) => (sectionRefs.current['making-contributions'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.makingContributions')}</h2>
                      <div className="space-y-4">
                        <p>{t('makingContributions.content1')}</p>
                        <ol className="list-decimal list-inside space-y-3 ml-4">
                          <li>
                            <strong>{t('makingContributions.step1.title')}</strong>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {t('makingContributions.step1.content')}
                            </p>
                          </li>
                          <li>
                            <strong>{t('makingContributions.step2.title')}</strong>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {t('makingContributions.step2.content')}
                            </p>
                          </li>
                          <li>
                            <strong>{t('makingContributions.step3.title')}</strong>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {t('makingContributions.step3.content')}
                            </p>
                          </li>
                        </ol>
                      </div>
                    </section>

                    {/* Managing Profile */}
                    <section
                      id="managing-profile"
                      ref={(el) => (sectionRefs.current['managing-profile'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.managingProfile')}</h2>
                      <div className="space-y-4">
                        <p>{t('managingProfile.content1')}</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{t('managingProfile.feature1.title')}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('managingProfile.feature1.content')}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{t('managingProfile.feature2.title')}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('managingProfile.feature2.content')}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{t('managingProfile.feature3.title')}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('managingProfile.feature3.content')}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{t('managingProfile.feature4.title')}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('managingProfile.feature4.content')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Tips */}
                    <section
                      id="tips"
                      ref={(el) => (sectionRefs.current['tips'] = el)}
                      className="scroll-mt-6"
                    >
                      <h2 className="text-3xl font-semibold mb-4">{t('chapters.tips')}</h2>
                      <div className="space-y-3">
                        <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                          <h4 className="font-semibold mb-2">{t('tips.tip1.title')}</h4>
                          <p className="text-sm">{t('tips.tip1.content')}</p>
                        </div>
                        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <h4 className="font-semibold mb-2">{t('tips.tip2.title')}</h4>
                          <p className="text-sm">{t('tips.tip2.content')}</p>
                        </div>
                        <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <h4 className="font-semibold mb-2">{t('tips.tip3.title')}</h4>
                          <p className="text-sm">{t('tips.tip3.content')}</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Help Section */}
                  <section className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="font-semibold mb-2 text-lg">{t('needHelp')}</h3>
                    <p className="text-sm mb-4">{t('needHelpContent')}</p>
                    <Link href={`/${locale}/docs`}>
                      <Button variant="outline" size="sm">
                        {t('exploreMoreDocs')}
                      </Button>
                    </Link>
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
