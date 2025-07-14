# Dynamic Public Mosque Profile Feature## OverviewThe Dynamic Public Mosque Profile feature allows visitors to view information about any mosque in the system without needing to authenticate. This feature provides a comprehensive public-facing interface that showcases mosque services, contact information, prayer times, and leadership details for multiple mosques.## Features### 1. Public Landing Page (`/public`)- Welcome page for unauthenticated visitors- Overview of mosque services and community- Call-to-action buttons to view mosque directory or join as member- Responsive design with modern gradient styling### 2. Mosque Directory (`/public/mosques`)- Lists all mosques in the system- Search functionality by mosque name, city, or state- Cards showing mosque overview with quick access to profiles- Responsive grid layout for optimal viewing### 3. Dynamic Mosque Profiles (`/public/mosque/[id]`)- Individual mosque pages accessible via unique ID- Detailed mosque information including: - Basic information (name, address, capacity, established date) - Contact details (phone, email, website) - Prayer times and operating hours - Services and programs offered - Leadership information (Imam, Chairman) - Community statistics- No authentication required- Responsive design optimized for all devices- Error handling for non-existent mosques### 4. Navigation Integration- Directory route at `/public/mosques` for listing all mosques- Dynamic routes at `/public/mosque/[id]` for individual profiles- Shortcut routes redirect to the directory- Updated root page to redirect unauthenticated users to public landing- Profile guard updated to allow access to public routes## File Structure`src/├── app/│   ├── public/│   │   ├── layout.tsx              # Public pages layout (no auth required)│   │   ├── page.tsx                # Public landing page│   │   ├── mosque/│   │   │   ├── page.tsx            # Redirect to mosque directory│   │   │   └── [id]/│   │   │       └── page.tsx        # Dynamic mosque profile page│   │   └── mosques/│   │       └── page.tsx            # Mosque directory listing│   ├── mosque/│   │   └── page.tsx                # Redirect to public mosque directory│   └── page.tsx                    # Root redirect logic├── services/│   └── mosque.ts                   # Mosque data service├── components/guards/│   └── ProfileGuard.tsx            # Updated to allow public routes└── supabase/migrations/    ├── 004_sample_mosque_data.sql  # Sample data for testing    └── 005_extend_mosque_schema.sql # Extended mosque table schema`## Services### MosqueService (`src/services/mosque.ts`)- `getPublicMosqueProfileById(id)`: Fetches public mosque data by ID (no auth required)- `getAllPublicMosques()`: Gets list of all mosques for directory- `getPublicMosqueProfile()`: Fetches default mosque data (legacy)- `getMosqueProfile()`: Fetches full mosque data (auth required)- `updateMosqueProfile()`: Updates mosque profile (admin only)- `getPrayerTimes()`: Gets current prayer times## Database SchemaThe feature requires an extended mosque table with the following fields:`sql-- Core fieldsid UUID PRIMARY KEYname TEXT NOT NULLdescription TEXTaddress TEXTcity TEXTstate TEXTpostcode TEXTphone TEXTemail TEXTwebsite TEXTcapacity INTEGER-- Leadership fieldsimam TEXTchairman TEXTestablished_date DATE-- Service fieldsservices TEXT[]operating_hours JSONB-- Admin fields (not shown publicly)registration_number TEXTbank_account TEXT`## TranslationsAdded multilingual support for public mosque profiles:- Malay: `ms.publicMosque.*`- English: `en.publicMosque.*`Key translation keys:- `publicMosque.title`- `publicMosque.loadingMessage`- `publicMosque.joinCommunity`- `publicMosque.staffLogin`- `publicMosque.notFoundTitle`- `publicMosque.notFoundMessage`## Responsive DesignThe public mosque profile features:- Mobile-first responsive design- Gradient backgrounds for modern appeal- Card-based layout for better content organization- Accessible color schemes and typography- Smooth transitions and hover effects- Search functionality with real-time filtering## Security Considerations1. **No Sensitive Data**: Public pages only display non-sensitive information2. **No Authentication Required**: Accessible to anyone without login3. **Selective Information Display**: Private details like registration numbers and bank accounts are not shown4. **Rate Limiting**: Consider implementing rate limiting for public endpoints5. **Input Validation**: Search queries are properly sanitized## Usage Examples### Accessing Public Mosque Profiles`# Mosque directoryhttps://yoursite.com/public/mosques# Specific mosque profilehttps://yoursite.com/public/mosque/[mosque-id]# Public landing pagehttps://yoursite.com/public# Shortcut redirectshttps://yoursite.com/mosque (redirects to directory)`

### Integration with Existing Pages

```tsx
// Link to mosque directory
import Link from 'next/link';

<Link href="/public/mosques">
  <Button>Browse Mosques</Button>
</Link>

// Link to specific mosque
<Link href={`/public/mosque/${mosqueId}`}>
  <Button>View Mosque Profile</Button>
</Link>
```

### Fetching Mosque Data

```tsx
import { MosqueService } from '@/services/mosque';

// Get all mosques
const mosques = await MosqueService.getAllPublicMosques();

// Get specific mosque
const mosque = await MosqueService.getPublicMosqueProfileById(mosqueId);
```

## Sample Data

The system includes sample mosque data for testing:

- Masjid Al-Hidayah (Kuala Lumpur)
- Masjid An-Nur (Petaling Jaya)
- Masjid Ar-Rahman (Shah Alam)
- Masjid Al-Falah (Johor Bahru)
- Masjid At-Taqwa (Kuala Lumpur)

## Database Migrations

Run the following migrations to set up the dynamic mosque profiles:

```bash
# Extend mosque table schema
npx supabase migration up 005_extend_mosque_schema.sql

# Add sample data (optional)
npx supabase migration up 004_sample_mosque_data.sql
```

## Future Enhancements

1. **Advanced Search**: Add filters by services, location radius, capacity
2. **Photo Gallery**: Add mosque photos and facility images
3. **Event Calendar**: Display upcoming public events per mosque
4. **Donation Integration**: Add public donation capabilities per mosque
5. **Social Media Links**: Link to mosque social media accounts
6. **Location Map**: Integrate with mapping services for directions
7. **Multi-language Support**: Add more language options
8. **SEO Optimization**: Add meta tags and structured data
9. **Review System**: Allow community reviews and ratings
10. **API Documentation**: Generate public API docs for integration

## Development Notes

- Public pages use a separate layout to bypass authentication guards
- The ProfileGuard component is updated to allow public routes
- All public routes are prefixed with `/public/` for clear organization
- The mosque service provides both public and private data methods
- Translations are added for both Malay and English languages
- Dynamic routes handle mosque IDs with proper error handling
- Search functionality uses PostgreSQL full-text search capabilities

## Testing

To test the dynamic public mosque profiles:

1. **Setup Database**: Run migrations to extend mosque schema
2. **Add Sample Data**: Insert sample mosques using the provided migration
3. **Start Development Server**: `npm run dev`
4. **Test Directory**: Visit `http://localhost:3000/public/mosques`
5. **Test Search**: Search for mosques by name, city, or state
6. **Test Individual Profiles**: Click on mosque cards to view profiles
7. **Test Responsive Design**: Check on different screen sizes
8. **Test Error Handling**: Try accessing non-existent mosque IDs
9. **Test Translations**: Switch between Malay and English languages
10. **Test Navigation**: Verify all redirect routes work correctly

## Performance Considerations

- Database queries are optimized with proper indexes
- Images should be optimized and served via CDN
- Consider implementing caching for mosque data
- Use pagination for large numbers of mosques
- Implement proper error boundaries for better UX
- Monitor public endpoint usage for scaling needs
