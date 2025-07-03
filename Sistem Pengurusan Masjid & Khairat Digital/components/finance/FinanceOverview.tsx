import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
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
  Calendar
} from 'lucide-react';
import { User } from '../../App';

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

export function FinanceOverview({ user }: FinanceOverviewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Mock data
  const summary = {
    totalIncome: 18750,
    totalExpenses: 12300,
    netIncome: 6450,
    monthlyTargetIncome: 20000,
    monthlyTargetExpense: 15000,
    bankBalance: 125400,
    cashInHand: 2850
  };

  const recentTransactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2025-06-13',
      type: 'income',
      category: 'Kutipan Jumaat',
      description: 'Kutipan selepas solat Jumaat',
      amount: 850,
      method: 'cash',
      collectedBy: 'En. Ahmad (Bendahari)'
    },
    {
      id: 'TXN002',
      date: '2025-06-12',
      type: 'expense',
      category: 'Utiliti',
      description: 'Bayaran bil elektrik TNB',
      amount: 450,
      method: 'bank',
      reference: 'TXN123456789'
    },
    {
      id: 'TXN003',
      date: '2025-06-11',
      type: 'income',
      category: 'Derma',
      description: 'Derma daripada Syarikat ABC Sdn Bhd',
      amount: 5000,
      method: 'bank',
      reference: 'DERMA202506001'
    },
    {
      id: 'TXN004',
      date: '2025-06-10',
      type: 'expense',
      category: 'Program',
      description: 'Elaun penceramah ceramah Maghrib',
      amount: 200,
      method: 'cash'
    },
    {
      id: 'TXN005',
      date: '2025-06-09',
      type: 'income',
      category: 'Yuran Khairat',
      description: 'Kutipan yuran khairat bulanan',
      amount: 1250,
      method: 'online',
      reference: 'FPX20250609001'
    }
  ];

  const incomeCategories = [
    { name: 'Kutipan Jumaat', amount: 3400, percentage: 18.1 },
    { name: 'Derma', amount: 8500, percentage: 45.3 },
    { name: 'Yuran Khairat', amount: 3750, percentage: 20.0 },
    { name: 'Sewa Dewan', amount: 2100, percentage: 11.2 },
    { name: 'Lain-lain', amount: 1000, percentage: 5.3 }
  ];

  const expenseCategories = [
    { name: 'Utiliti', amount: 2800, percentage: 22.8 },
    { name: 'Penyelenggaraan', amount: 4200, percentage: 34.1 },
    { name: 'Program', amount: 2500, percentage: 20.3 },
    { name: 'Elaun AJK', amount: 1800, percentage: 14.6 },
    { name: 'Lain-lain', amount: 1000, percentage: 8.1 }
  ];

  const getTransactionIcon = (type: string, method: string) => {
    if (type === 'income') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline">Tunai</Badge>;
      case 'bank':
        return <Badge className="bg-blue-500">Bank</Badge>;
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const incomeProgress = (summary.totalIncome / summary.monthlyTargetIncome) * 100;
  const expenseProgress = (summary.totalExpenses / summary.monthlyTargetExpense) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Pengurusan Kewangan</h1>
          <p className="text-muted-foreground">
            Pantau pendapatan, perbelanjaan dan baki kewangan masjid
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksport Laporan
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Rekod Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">RM {summary.totalIncome.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {incomeProgress.toFixed(1)}% daripada sasaran RM {summary.monthlyTargetIncome.toLocaleString()}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(incomeProgress, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Perbelanjaan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">RM {summary.totalExpenses.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {expenseProgress.toFixed(1)}% daripada had RM {summary.monthlyTargetExpense.toLocaleString()}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${expenseProgress > 90 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(expenseProgress, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pendapatan Bersih</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              RM {summary.netIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Baki Bank</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {summary.bankBalance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tunai: RM {summary.cashInHand.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaksi Terkini</TabsTrigger>
          <TabsTrigger value="income">Analisis Pendapatan</TabsTrigger>
          <TabsTrigger value="expenses">Analisis Perbelanjaan</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaksi Terkini</CardTitle>
                  <CardDescription>
                    Senarai transaksi kewangan terbaru
                  </CardDescription>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-06">Jun 2025</SelectItem>
                    <SelectItem value="2025-05">Mei 2025</SelectItem>
                    <SelectItem value="2025-04">April 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Kaedah</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>PIC/Rujukan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type, transaction.method)}
                          {new Date(transaction.date).toLocaleDateString('ms-MY')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(transaction.method)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}RM {transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.collectedBy && (
                            <div>{transaction.collectedBy}</div>
                          )}
                          {transaction.reference && (
                            <div className="text-muted-foreground text-xs">
                              {transaction.reference}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Pendapatan Mengikut Kategori</CardTitle>
              <CardDescription>
                Pecahan sumber pendapatan masjid bulan ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomeCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          RM {category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Perbelanjaan Mengikut Kategori</CardTitle>
              <CardDescription>
                Pecahan perbelanjaan masjid bulan ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          RM {category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}