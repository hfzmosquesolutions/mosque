import { supabase } from '@/lib/supabase';

export interface MosqueProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  website?: string;
  capacity: number;
  established_date: string;
  registration_number: string;
  imam: string;
  chairman: string;
  bank_account: string;
  description?: string;
  services: string[];
  operating_hours: {
    subuh: string;
    zohor: string;
    asar: string;
    maghrib: string;
    isyak: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PublicMosqueData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  website?: string;
  capacity: number;
  established_date: string;
  imam: string;
  chairman: string;
  description?: string;
  services: string[];
  operating_hours: {
    subuh: string;
    zohor: string;
    asar: string;
    maghrib: string;
    isyak: string;
  };
}

export class MosqueService {
  /**
   * Get public mosque profile data (no authentication required)
   */
  static async getPublicMosqueProfile(): Promise<PublicMosqueData | null> {
    try {
      // In a real implementation, you would fetch from your database
      // For now, return mock data
      return {
        id: 'MSJ001',
        name: 'Masjid Al-Hidayah',
        address: 'Jalan Masjid Al-Hidayah, Kampung Baru',
        city: 'Kuala Lumpur',
        state: 'Wilayah Persekutuan',
        postcode: '50300',
        phone: '+603-2691-1234',
        email: 'admin@masjidhidayah.my',
        website: 'www.masjidhidayah.my',
        capacity: 500,
        established_date: '1985-06-15',
        imam: 'Ustaz Abdullah Rahman',
        chairman: 'Haji Ahmad Ibrahim',
        description:
          'Masjid Al-Hidayah adalah sebuah masjid yang telah berkhidmat kepada masyarakat selama lebih 35 tahun. Kami menyediakan pelbagai khidmat keagamaan dan kemasyarakatan untuk memenuhi keperluan umat Islam di kawasan ini.',
        services: [
          'Solat 5 Waktu',
          'Solat Jumaat',
          'Kelas Mengaji',
          'Majlis Tahlil',
          'Zakat',
          'Kenduri Kahwin',
          'Program Dakwah',
          'Kelas Tadika',
        ],
        operating_hours: {
          subuh: '5:30 AM - 7:00 AM',
          zohor: '1:00 PM - 2:30 PM',
          asar: '4:30 PM - 6:00 PM',
          maghrib: '7:15 PM - 8:00 PM',
          isyak: '8:30 PM - 10:00 PM',
        },
      };
    } catch (error) {
      console.error('Error fetching public mosque profile:', error);
      return null;
    }
  }

  /**
   * Get full mosque profile data (requires authentication)
   */
  static async getMosqueProfile(): Promise<MosqueProfile | null> {
    try {
      const { data, error } = await supabase
        .from('mosque_profiles')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching mosque profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching mosque profile:', error);
      return null;
    }
  }

  /**
   * Update mosque profile (requires authentication and admin role)
   */
  static async updateMosqueProfile(
    profileData: Partial<MosqueProfile>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mosque_profiles')
        .update(profileData)
        .eq('id', profileData.id);

      if (error) {
        console.error('Error updating mosque profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating mosque profile:', error);
      return false;
    }
  }

  /**
   * Get prayer times for today
   */
  static async getPrayerTimes(): Promise<{ [key: string]: string } | null> {
    try {
      // In a real implementation, you might fetch from an Islamic prayer times API
      // or calculate based on location. For now, return static times.
      return {
        subuh: '5:30 AM',
        syuruk: '7:00 AM',
        zohor: '1:00 PM',
        asar: '4:30 PM',
        maghrib: '7:15 PM',
        isyak: '8:30 PM',
      };
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      return null;
    }
  }

  /**
   * Get public mosque profile data by ID (no authentication required)
   */
  static async getPublicMosqueProfileById(
    mosqueId: string
  ): Promise<PublicMosqueData | null> {
    try {
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .eq('id', mosqueId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching mosque profile by ID:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Transform database data to public format
      return {
        id: data.id,
        name: data.name,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postcode: data.postcode || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website,
        capacity: data.capacity || 0,
        established_date: data.established_date || data.created_at,
        imam: data.imam || '',
        chairman: data.chairman || '',
        description: data.description,
        services: data.services || data.facilities || [],
        operating_hours: data.operating_hours || {
          subuh: '5:30 AM - 7:00 AM',
          zohor: '1:00 PM - 2:30 PM',
          asar: '4:30 PM - 6:00 PM',
          maghrib: '7:15 PM - 8:00 PM',
          isyak: '8:30 PM - 10:00 PM',
        },
      };
    } catch (error) {
      console.error('Error fetching mosque profile by ID:', error);
      return null;
    }
  }

  /**
   * Get list of all public mosques (for mosque directory)
   */
  static async getAllPublicMosques(): Promise<PublicMosqueData[]> {
    try {
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching mosques list:', error);
        return [];
      }

      return data.map((mosque) => ({
        id: mosque.id,
        name: mosque.name,
        address: mosque.address || '',
        city: mosque.city || '',
        state: mosque.state || '',
        postcode: mosque.postcode || '',
        phone: mosque.phone || '',
        email: mosque.email || '',
        website: mosque.website,
        capacity: mosque.capacity || 0,
        established_date: mosque.established_date || mosque.created_at,
        imam: mosque.imam || '',
        chairman: mosque.chairman || '',
        description: mosque.description,
        services: mosque.services || mosque.facilities || [],
        operating_hours: mosque.operating_hours || {
          subuh: '5:30 AM - 7:00 AM',
          zohor: '1:00 PM - 2:30 PM',
          asar: '4:30 PM - 6:00 PM',
          maghrib: '7:15 PM - 8:00 PM',
          isyak: '8:30 PM - 10:00 PM',
        },
      }));
    } catch (error) {
      console.error('Error fetching mosques list:', error);
      return [];
    }
  }
}
