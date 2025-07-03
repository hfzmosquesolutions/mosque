import React from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText, 
  Heart, 
  HandCoins,
  Calculator,
  MessageSquare,
  Settings,
  LogOut,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from './ui/sidebar';
import { User } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      title: "Utama",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
          isActive: location.pathname === '/dashboard'
        }
      ]
    },
    {
      title: "Pengurusan",
      items: [
        ...(user.role !== 'member' ? [{
          title: "Ahli",
          url: "/ahli",
          icon: Users,
          isActive: location.pathname.startsWith('/ahli')
        }] : []),
        {
          title: "Program & Aktiviti",
          url: "/program",
          icon: Calendar,
          isActive: location.pathname.startsWith('/program')
        },
        ...(user.role !== 'member' ? [{
          title: "Kewangan",
          url: "/kewangan",
          icon: DollarSign,
          isActive: location.pathname.startsWith('/kewangan')
        }] : []),
        ...(user.role !== 'member' ? [{
          title: "Tempahan Kemudahan",
          url: "/tempahan",
          icon: MapPin,
          isActive: location.pathname.startsWith('/tempahan')
        }] : []),
        ...(user.role !== 'member' ? [{
          title: "Jawatankuasa",
          url: "/ajk",
          icon: Users,
          isActive: location.pathname.startsWith('/ajk')
        }] : [])
      ].filter(Boolean)
    },
    {
      title: "Khairat & Zakat",
      items: [
        ...(user.role !== 'member' ? [{
          title: "Khairat Kematian",
          url: "/khairat",
          icon: Heart,
          isActive: location.pathname.startsWith('/khairat')
        }] : []),
        {
          title: "Zakat",
          url: "/zakat",
          icon: HandCoins,
          isActive: location.pathname.startsWith('/zakat')
        },
        {
          title: "Kalkulator Zakat",
          url: "/zakat/kalkulator",
          icon: Calculator,
          isActive: location.pathname === '/zakat/kalkulator'
        },
        ...(user.role !== 'member' ? [{
          title: "Permohonan Zakat",
          url: "/zakat/permohonan",
          icon: FileText,
          isActive: location.pathname === '/zakat/permohonan'
        }] : [])
      ].filter(Boolean)
    },
    {
      title: "Komunikasi & Laporan",
      items: [
        {
          title: "Pusat Komunikasi",
          url: "/komunikasi",
          icon: MessageSquare,
          isActive: location.pathname.startsWith('/komunikasi')
        },
        {
          title: "Laporan",
          url: "/laporan",
          icon: FileText,
          isActive: location.pathname.startsWith('/laporan')
        },
        ...(user.role === 'member' ? [{
          title: "Portal Ahli",
          url: "/portal",
          icon: Users,
          isActive: location.pathname.startsWith('/portal')
        }] : [])
      ].filter(Boolean)
    },
    ...(user.role === 'super_admin' ? [{
      title: "Pentadbiran",
      items: [
        {
          title: "Panel Admin",
          url: "/admin",
          icon: Settings,
          isActive: location.pathname.startsWith('/admin')
        }
      ]
    }] : [])
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <HandCoins className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold text-lg">Masjid Digital</span>
                <span className="text-xs text-muted-foreground">
                  {user.mosqueName || 'Sistem Pengurusan'}
                </span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {navigationItems.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.url)}
                          isActive={item.isActive}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex flex-col gap-2 p-2">
                  <div className="text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.role === 'super_admin' && 'Super Admin'}
                      {user.role === 'mosque_admin' && 'Admin Masjid'}
                      {user.role === 'ajk' && 'Ahli Jawatankuasa'}
                      {user.role === 'member' && 'Ahli Kariah'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Keluar
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger />
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold">
                {user.mosqueName || 'Sistem Pengurusan Masjid Digital'}
              </h1>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}