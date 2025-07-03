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
import { Users, Search, Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
}
interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipNumber: string;
  status: 'active' | 'inactive';
  joinDate: string;
  address: string;
  emergencyContact: string;
  membershipType: 'regular' | 'family' | 'student' | 'senior';
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  occupation?: string;
  emergencyPhone?: string;
  notes?: string;
}

interface MemberListProps {
  user: User;
}
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Ahmad Abdullah',
    email: 'ahmad@example.com',
    phone: '+60123456789',
    membershipNumber: 'MEM001',
    status: 'active',
    joinDate: '2024-01-15',
    address: 'Jalan Masjid 1, Kuala Lumpur',
    emergencyContact: '+60123456788',
    membershipType: 'regular',
  },
  {
    id: '2',
    name: 'Siti Aminah',
    email: 'siti@example.com',
    phone: '+60134567890',
    membershipNumber: 'MEM002',
    status: 'active',
    joinDate: '2024-02-20',
    address: 'Jalan Soleh 2, Petaling Jaya',
    emergencyContact: '+60134567889',
    membershipType: 'family',
  },
  {
    id: '3',
    name: 'Muhammad Hafiz',
    email: 'hafiz@example.com',
    phone: '+60145678901',
    membershipNumber: 'MEM003',
    status: 'active',
    joinDate: '2024-03-10',
    address: 'Jalan Islam 3, Shah Alam',
    emergencyContact: '+60176543210',
    membershipType: 'student',
  },
];
export default function MemberList({ user }: MemberListProps) {
  const t = useTranslation();
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };
  const getMembershipTypeColor = (type: string) => {
    const colors = {
      regular: 'bg-blue-100 text-blue-800',
      family: 'bg-purple-100 text-purple-800',
      student: 'bg-yellow-100 text-yellow-800',
      senior: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-gray-600">{t('members.memberList')}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('members.addMember')}
        </Button>
      </div>{' '}
      {/* Stats Cards */}{' '}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {' '}
        <Card>
          {' '}
          <CardContent className="p-6">
            {' '}
            <div className="flex items-center">
              {' '}
              <Users className="h-8 w-8 text-blue-600" />{' '}
              <div className="ml-4">
                {' '}
                <p className="text-sm font-medium text-gray-600">
                  {' '}
                  {t('members.totalMembers')}{' '}
                </p>{' '}
                <p className="text-2xl font-bold">{members.length}</p>{' '}
              </div>{' '}
            </div>{' '}
          </CardContent>{' '}
        </Card>{' '}
        <Card>
          {' '}
          <CardContent className="p-6">
            {' '}
            <div className="flex items-center">
              {' '}
              <Users className="h-8 w-8 text-green-600" />{' '}
              <div className="ml-4">
                {' '}
                <p className="text-sm font-medium text-gray-600">
                  {' '}
                  {t('members.activeMembers')}{' '}
                </p>{' '}
                <p className="text-2xl font-bold">
                  {' '}
                  {members.filter((m) => m.status === 'active').length}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </CardContent>{' '}
        </Card>{' '}
        <Card>
          {' '}
          <CardContent className="p-6">
            {' '}
            <div className="flex items-center">
              {' '}
              <Users className="h-8 w-8 text-orange-600" />{' '}
              <div className="ml-4">
                {' '}
                <p className="text-sm font-medium text-gray-600">
                  {' '}
                  {t('members.newThisMonth')}{' '}
                </p>{' '}
                <p className="text-2xl font-bold">12</p>{' '}
              </div>{' '}
            </div>{' '}
          </CardContent>{' '}
        </Card>{' '}
        <Card>
          {' '}
          <CardContent className="p-6">
            {' '}
            <div className="flex items-center">
              {' '}
              <Users className="h-8 w-8 text-purple-600" />{' '}
              <div className="ml-4">
                {' '}
                <p className="text-sm font-medium text-gray-600">
                  {' '}
                  {t('members.membershipTypes.all')}{' '}
                </p>{' '}
                <p className="text-2xl font-bold">4</p>{' '}
              </div>{' '}
            </div>{' '}
          </CardContent>{' '}
        </Card>{' '}
      </div>{' '}
      {/* Search and Filter */}{' '}
      <Card>
        {' '}
        <CardHeader>
          {' '}
          <CardTitle>{t('members.memberList')}</CardTitle>{' '}
          <CardDescription> {t('members.memberDetails')} </CardDescription>{' '}
        </CardHeader>{' '}
        <CardContent>
          {' '}
          <div className="flex space-x-4 mb-6">
            {' '}
            <div className="flex-1">
              {' '}
              <div className="relative">
                {' '}
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />{' '}
                <Input
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />{' '}
              </div>{' '}
            </div>{' '}
            <div className="flex space-x-2">
              {' '}
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                {' '}
                Semua{' '}
              </Button>{' '}
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                {' '}
                {t('status.active')}{' '}
              </Button>{' '}
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
              >
                {' '}
                {t('status.inactive')}{' '}
              </Button>{' '}
            </div>{' '}
          </div>{' '}
          {/* Members Grid */}{' '}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {' '}
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="hover:shadow-lg transition-shadow"
              >
                {' '}
                <CardHeader className="pb-2">
                  {' '}
                  <div className="flex justify-between items-start">
                    {' '}
                    <div>
                      {' '}
                      <CardTitle className="text-lg">
                        {member.name}
                      </CardTitle>{' '}
                      <CardDescription>
                        {member.membershipNumber}
                      </CardDescription>{' '}
                    </div>{' '}
                    <div className="flex space-x-1">
                      {' '}
                      <Button variant="ghost" size="sm">
                        {' '}
                        <Edit className="h-4 w-4" />{' '}
                      </Button>{' '}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                      >
                        {' '}
                        <Trash2 className="h-4 w-4" />{' '}
                      </Button>{' '}
                    </div>{' '}
                  </div>{' '}
                </CardHeader>{' '}
                <CardContent>
                  {' '}
                  <div className="space-y-2">
                    {' '}
                    <div className="flex items-center space-x-2">
                      {' '}
                      <Mail className="h-4 w-4 text-gray-500" />{' '}
                      <span className="text-sm">{member.email}</span>{' '}
                    </div>{' '}
                    <div className="flex items-center space-x-2">
                      {' '}
                      <Phone className="h-4 w-4 text-gray-500" />{' '}
                      <span className="text-sm">{member.phone}</span>{' '}
                    </div>{' '}
                    <div className="flex justify-between items-center mt-4">
                      {' '}
                      <Badge className={getStatusColor(member.status)}>
                        {' '}
                        {t(`status.${member.status}`)}{' '}
                      </Badge>{' '}
                      <Badge
                        className={getMembershipTypeColor(
                          member.membershipType
                        )}
                      >
                        {' '}
                        {member.membershipType}{' '}
                      </Badge>{' '}
                    </div>{' '}
                    <div className="text-xs text-gray-500 mt-2">
                      {' '}
                      {t('members.joinDate')}:{' '}
                      {new Date(member.joinDate).toLocaleDateString()}{' '}
                    </div>{' '}
                  </div>{' '}
                </CardContent>{' '}
              </Card>
            ))}{' '}
          </div>{' '}
          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              {' '}
              <Users className="mx-auto h-12 w-12 text-gray-400" />{' '}
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {' '}
                Tiada keputusan{' '}
              </h3>{' '}
              <p className="mt-1 text-sm text-gray-500">
                {' '}
                Cuba carian yang berbeza{' '}
              </p>{' '}
            </div>
          )}{' '}
        </CardContent>{' '}
      </Card>{' '}
    </div>
  );
}

export { MemberList };
