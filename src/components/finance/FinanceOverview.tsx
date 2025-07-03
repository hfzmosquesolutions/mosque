'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  CreditCard,
  Plus,
  Download,
  Eye,
  Calendar,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useTranslation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
}

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

interface FinanceOverviewProps {
  user: User;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'income',
    category: 'Derma Mingguan',
    description: 'Kutipan Jumaat 15 Jan 2024',
    amount: 2850,
    method: 'cash',
    collectedBy: 'Ahmad Abdullah',
  },
  {
    id: '2',
    date: '2024-01-14',
    type: 'expense',
    category: 'Utiliti',
    description: 'Bil Elektrik Januari',
    amount: 450,
    method: 'bank',
    reference: 'TNB001234',
  },
  {
    id: '3',
    date: '2024-01-12',
    type: 'income',
    category: 'Zakat Fitrah',
    description: 'Kutipan Zakat Fitrah',
    amount: 1200,
    method: 'online',
    reference: 'ZKT240112',
  },
  {
    id: '4',
    date: '2024-01-10',
    type: 'expense',
    category: 'Penyelenggaraan',
    description: 'Baiki kipas siling',
    amount: 150,
    method: 'cash',
  },
];

export default function FinanceOverview({ user }: FinanceOverviewProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);

  // Memoize heavy calculations
  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      monthlyTargetIncome: 20000,
      monthlyTargetExpense: 15000,
      bankBalance: 125400,
      cashInHand: 2850,
    };
  }, [transactions]);

  // Memoize utility functions
  const getTransactionTypeColor = useCallback((type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  }, []);

  const getMethodBadgeColor = (method: string) => {
    const colors = {
      cash: 'bg-yellow-100 text-yellow-800',
      bank: 'bg-blue-100 text-blue-800',
      online: 'bg-green-100 text-green-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('finance.title')}</h1>
          <p className="text-gray-600">{t('finance.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('finance.exportReport')}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.addTransaction')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.totalIncome')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.totalExpenses')}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.netIncome')}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('finance.bankBalance')}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.bankBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Selector and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('finance.periodSelection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder={t('finance.selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">
                  {t('finance.months.january2024')}
                </SelectItem>
                <SelectItem value="2023-12">
                  {t('finance.months.december2023')}
                </SelectItem>
                <SelectItem value="2023-11">
                  {t('finance.months.november2023')}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              {t('finance.cashInHand')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.cashInHand)}
            </p>
            <p className="text-sm text-gray-600">
              {t('finance.availableImmediate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t('finance.transactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-sm text-gray-600">{t('finance.thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.recentTransactions')}</CardTitle>
          <CardDescription>{t('finance.latestActivities')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                {t('finance.allTransactions')}
              </TabsTrigger>
              <TabsTrigger value="income">{t('finance.income')}</TabsTrigger>
              <TabsTrigger value="expense">{t('finance.expenses')}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.type')}</TableHead>
                    <TableHead>{t('finance.category')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('finance.method')}</TableHead>
                    <TableHead className="text-right">
                      {t('common.amount')}
                    </TableHead>
                    <TableHead>{t('common.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {t(`finance.types.${transaction.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge
                          className={getMethodBadgeColor(transaction.method)}
                        >
                          {t(`finance.methods.${transaction.method}`)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${getTransactionTypeColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="income" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.category')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('finance.method')}</TableHead>
                    <TableHead className="text-right">
                      {t('common.amount')}
                    </TableHead>
                    <TableHead>{t('common.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter((t) => t.type === 'income')
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge
                            className={getMethodBadgeColor(transaction.method)}
                          >
                            {t(`finance.methods.${transaction.method}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          +{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expense" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.category')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('finance.method')}</TableHead>
                    <TableHead className="text-right">
                      {t('common.amount')}
                    </TableHead>
                    <TableHead>{t('common.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter((t) => t.type === 'expense')
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge
                            className={getMethodBadgeColor(transaction.method)}
                          >
                            {t(`finance.methods.${transaction.method}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          -{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export { FinanceOverview };
