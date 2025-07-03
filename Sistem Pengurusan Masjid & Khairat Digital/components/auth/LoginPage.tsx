import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Building2, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Email atau kata laluan tidak sah');
      }
    } catch (err) {
      setError('Ralat semasa log masuk. Sila cuba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'superadmin@masjid.gov.my',
      password: 'admin123',
      description: 'Akses semua masjid dan fungsi pentadbiran'
    },
    {
      role: 'Admin Masjid',
      email: 'admin@masjidalnur.my',
      password: 'admin123',
      description: 'Pengurusan penuh untuk Masjid Al-Nur'
    },
    {
      role: 'AJK (Imam)',
      email: 'imam@masjidalnur.my',
      password: 'imam123',
      description: 'Akses program dan aktiviti'
    },
    {
      role: 'Ahli',
      email: 'ahli@example.com',
      password: 'ahli123',
      description: 'Portal jemaah dan pembayaran'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Sistem Pengurusan Masjid</CardTitle>
            <CardDescription>
              Log masuk ke akaun anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Laluan</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata laluan"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang log masuk...
                  </>
                ) : (
                  'Log Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Akaun Demo</CardTitle>
            <CardDescription>
              Gunakan akaun demo ini untuk menguji sistem dengan peranan yang berbeza
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoAccounts.map((account, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{account.role}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                      }}
                    >
                      Guna Akaun Ini
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {account.description}
                  </p>
                  <div className="text-xs space-y-1">
                    <div><strong>Email:</strong> {account.email}</div>
                    <div><strong>Password:</strong> {account.password}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Nota:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ini adalah sistem demo dengan data sampel</li>
                <li>• Setiap peranan mempunyai akses yang berbeza</li>
                <li>• Data akan reset selepas log keluar</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}