'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  method: 'cash' | 'bank' | 'online';
  reference?: string;
  collectedBy?: string;
}

function FinancePageContent() {
  const { t } = useLanguage();
  const { user: authUser } = useAuthState();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentView, setCurrentView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    string | undefined
  >();

  // Sample data - in real app this would come from API
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-07-15',
      type: 'income',
      category: 'Derma Mingguan',
      description: 'Kutipan Jumaat 15 Jul 2025',
      amount: 2850,
      method: 'cash',
      collectedBy: 'Ahmad Abdullah',
    },
    {
      id: '2',
      date: '2025-07-14',
      type: 'expense',
      category: 'Utiliti',
      description: 'Bil Elektrik Julai',
      amount: 450,
      method: 'bank',
      reference: 'TNB001234',
    },
    {
      id: '3',
      date: '2025-07-12',
      type: 'income',
      category: 'Zakat Fitrah',
      description: 'Kutipan Zakat Fitrah',
      amount: 5200,
      method: 'online',
      reference: 'ZF2025001',
    },
    {
      id: '4',
      date: '2025-07-10',
      type: 'expense',
      category: 'Penyelenggaraan',
      description: 'Servis Aircond Dewan',
      amount: 850,
      method: 'cash',
      collectedBy: 'Ustaz Rahman',
    },
    {
      id: '5',
      date: '2025-07-08',
      type: 'income',
      category: 'Infaq',
      description: 'Infaq Pembinaan Masjid',
      amount: 15000,
      method: 'bank',
      reference: 'INF2025010',
    },
  ]);

  // Handler functions
  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setShowForm(true);
  };

  const handleEditTransaction = (transactionId: string) => {
    setEditingTransaction(transactionId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  const handleSaveTransaction = (formData: any) => {
    console.log('Saving transaction:', formData);
    // In real app, this would save to API
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  // If form is open, show only the form
  if (showForm) {
    return (
      <TransactionForm
        transactionId={editingTransaction}
        onClose={handleCloseForm}
        onSave={handleSaveTransaction}
      />
    );
  }

  const getTypeBadge = (type: Transaction['type']) => {
    const typeConfig = {
      income: {
        label: t('finance.income'),
        variant: 'default' as const,
        icon: TrendingUp,
      },
      expense: {
        label: t('finance.expense'),
        variant: 'destructive' as const,
        icon: TrendingDown,
      },
    };
    return typeConfig[type];
  };

  const getMethodBadge = (method: Transaction['method']) => {
    const methodConfig = {
      cash: {
        label: t('finance.cash'),
        color: 'bg-green-100 text-green-800',
      },
      bank: {
        label: t('finance.bank'),
        color: 'bg-blue-100 text-blue-800',
      },
      online: {
        label: t('finance.online'),
        color: 'bg-purple-100 text-purple-800',
      },
    };
    return methodConfig[method];
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory =
      categoryFilter === 'all' || transaction.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const statsData = {
    totalIncome: transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    totalTransactions: transactions.length,
    netBalance: transactions.reduce(
      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
      0
    ),
  };

  const canManageFinance =
    authUser?.role === 'super_admin' ||
    authUser?.role === 'mosque_admin' ||
    authUser?.role === 'ajk';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('finance.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('finance.subtitle')}</p>
        </div>
        {canManageFinance && (
          <Button onClick={handleAddTransaction}>
            <Plus className="h-4 w-4 mr-2" />
            {t('finance.addTransaction')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.totalIncome')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  RM {statsData.totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.totalExpenses')}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  RM {statsData.totalExpenses.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.netBalance')}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    statsData.netBalance >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  RM {statsData.netBalance.toLocaleString()}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.totalTransactions')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.totalTransactions}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('finance.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('finance.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="income">{t('finance.income')}</SelectItem>
                <SelectItem value="expense">{t('finance.expense')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('finance.filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="Derma Mingguan">
                  {t('finance.categories.weeklyDonation')}
                </SelectItem>
                <SelectItem value="Zakat Fitrah">
                  {t('finance.categories.zakatFitrah')}
                </SelectItem>
                <SelectItem value="Infaq">
                  {t('finance.categories.infaq')}
                </SelectItem>
                <SelectItem value="Utiliti">
                  {t('finance.categories.utility')}
                </SelectItem>
                <SelectItem value="Penyelenggaraan">
                  {t('finance.categories.maintenance')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.recentTransactions')}</CardTitle>
          <CardDescription>
            {filteredTransactions.length} {t('common.total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('finance.noTransactions')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('finance.noTransactionsDescription')}
              </p>
              {canManageFinance && (
                <Button onClick={handleAddTransaction}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('finance.addFirstTransaction')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.type')}</TableHead>
                    <TableHead>{t('finance.category')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('finance.method')}</TableHead>
                    <TableHead>{t('common.amount')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const typeBadge = getTypeBadge(transaction.type);
                    const methodBadge = getMethodBadge(transaction.method);
                    const TypeIcon = typeBadge.icon;

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={typeBadge.variant}
                            className="flex items-center gap-1"
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {transaction.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.description}
                            </div>
                            {transaction.reference && (
                              <div className="text-sm text-gray-500">
                                Ref: {transaction.reference}
                              </div>
                            )}
                            {transaction.collectedBy && (
                              <div className="text-sm text-gray-500">
                                By: {transaction.collectedBy}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={methodBadge.color}>
                            {methodBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`font-bold ${
                              transaction.type === 'income'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}RM{' '}
                            {transaction.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('finance.viewDetails')}
                              </DropdownMenuItem>
                              {canManageFinance && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditTransaction(transaction.id)
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinancePage() {
  return (
    <AuthLayout>
      <FinancePageContent />
    </AuthLayout>
  );
}
