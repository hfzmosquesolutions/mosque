'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Calendar, DollarSign, User, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Contribution, ContributionProgram, Mosque } from '@/types/database';
import { useTranslations } from 'next-intl';

interface ContributionWithDetails extends Contribution {
  program?: ContributionProgram & {
    mosque?: Mosque;
  };
}



export default function ContributionLookupPage() {
  const t = useTranslations('lookup');
  const tc = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [contributions, setContributions] = useState<ContributionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error(t('pleaseEnterSearchTerm'));
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          program:contribution_programs(
            *,
            mosque:mosques(
              id,
              name,
              address
            )
          )
        `)
        .or(`payment_reference.ilike.%${searchTerm}%,contributor_name.ilike.%${searchTerm}%`);
      
      if (error) throw error;
      
      setContributions(data || []);
      
      if (!data || data.length === 0) {
        toast.info(t('noneFoundGeneric'));
      } else {
        toast.success(t('foundCount', { count: data.length }));
      }
    } catch (error) {
      console.error('Error searching contributions:', error);
      toast.error(t('errorSearching'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {t('title')}
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('searchDescription')}
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('transactionLookup')}
            </CardTitle>
            <CardDescription>
              {t('searchDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading || !searchTerm.trim()}>
                {loading ? t('searching') : tc('search')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('transactionHistory')}
              </CardTitle>
              <CardDescription>
                {contributions.length > 0 
                  ? t('foundCount', { count: contributions.length })
                  : searched ? t('noneFoundGeneric') : t('searchPrompt')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contributions.length > 0 ? (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <Card key={contribution.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('reference')}</p>
                            <p className="font-mono font-medium">{contribution.payment_reference}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('contributor')}</p>
                            <p className="font-medium">{contribution.contributor_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{tc('amount')}</p>
                            <p className="font-semibold text-emerald-600">
                              {formatCurrency(contribution.amount)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{tc('date')}</p>
                            <p className="font-medium">
                               {new Date(contribution.contributed_at).toLocaleDateString('en-MY')}
                             </p>
                          </div>
                        </div>
                      </div>
                      
                      {contribution.program && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">{t('program')}</p>
                              <p className="font-medium">{contribution.program.name}</p>
                            </div>
                            {contribution.program.mosque && (
                              <div>
                                <p className="text-sm text-muted-foreground">{t('mosque')}</p>
                                <p className="font-medium">{contribution.program.mosque.name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-between items-center">
                        <Badge className={getStatusBadge(contribution.status)}>
                           {contribution.status}
                         </Badge>
                         {contribution.notes && (
                           <div className="text-sm text-muted-foreground">
                             {t('notes')}: {contribution.notes}
                           </div>
                         )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div>
                  {contributions.length === 0 && searchTerm && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('noContributionsFound', { searchTerm })}
                      </p>
                    </div>
                  )}
                  
                  {!searched && (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {t('searchPrompt')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>{t('footerHelp')}</p>
        </div>
      </div>
    </div>
  );
}