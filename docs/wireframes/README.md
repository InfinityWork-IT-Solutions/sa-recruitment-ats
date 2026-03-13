# SA RECRUITMENT ATS - WIREFRAMES

## 📁 Contents

This folder contains comprehensive UI/UX wireframes for the SA Recruitment ATS system.

### Wireframe Files

1. **index.html** - Interactive wireframe gallery and navigation
2. **01-login-registration.html** - Authentication screens
3. **02-dashboard.html** - Main dashboard with KPIs and activity feed
4. **03-jobs.html** - Job listing and job creation/editing
5. **04-candidates.html** - Candidate profile and resume upload
6. **05-applications-ee.html** - Application pipeline and EE reports

## 🚀 How to View

### Option 1: Open in Browser (Recommended)
Simply double-click `index.html` to open the interactive wireframe gallery in your default browser.

### Option 2: Direct Access
Open any individual wireframe HTML file directly in your browser.

## 📱 Responsive Design

All wireframes are designed with responsive layouts in mind:
- **Desktop**: 1024px+ (primary focus)
- **Tablet**: 768-1023px
- **Mobile**: <768px

## 🎨 Design System

### Colors
- **Primary**: #4a90e2 (Blue)
- **Success**: #27ae60 (Green)
- **Warning**: #f39c12 (Orange)
- **Danger**: #e74c3c (Red)
- **Dark**: #2c3e50
- **Light**: #f8f9fa

### Typography
- **Font Family**: Arial, sans-serif
- **Headers**: Bold, 16-24px
- **Body**: Regular, 13-14px
- **Small**: 11-12px

### Layout
- **Max Width**: 1200-1400px
- **Spacing**: 15-20px grid system
- **Border Radius**: 3-8px for cards and buttons

## 🎯 Key Features Demonstrated

### Authentication (01)
- Login with email/password
- Registration with subscription tiers
- Email verification flow
- Password recovery
- MFA support

### Dashboard (02)
- Real-time KPI cards
- Recent activity feed
- Top candidate matches
- Quick action buttons
- Role-based content

### Jobs (03)
- Job listing with search/filter
- Create/edit job form
- Multi-board posting support
- Skills tagging
- Application counts

### Candidates (04)
- Comprehensive profile view
- Tabbed navigation (Overview, Experience, Education, Applications, Matches)
- Resume upload with drag & drop
- AI parsing status with progress
- Parsed data review

### Applications & EE (05)
- Kanban pipeline with drag & drop
- Status tracking across 6 stages
- Employment Equity dashboard
- Race/gender/disability distribution
- Gap analysis vs targets
- DPSA export capability

## 🔧 Technical Notes

### Wireframe Style
- Grayscale aesthetic with intentional color highlights
- Clear labeling and annotations
- Placeholder content with realistic data
- Interactive elements clearly marked

### Implementation Guidelines
- Wireframes show structure, not final design
- Colors, fonts, and spacing are approximate
- Real implementation will use Tailwind CSS
- Component library: React with TypeScript
- State management: Zustand
- Routing: React Router

### Browser Compatibility
These wireframes are standard HTML/CSS and work in:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📝 Developer Notes

### Converting to React Components

Each wireframe section can be converted to React components:

```typescript
// Example: Job Card Component
interface JobCardProps {
  job: Job;
  onView: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onView }) => {
  return (
    <div className="border-2 border-gray-300 p-4 hover:border-blue-500">
      <div className="flex justify-between">
        <div>
          <h3 className="font-bold text-lg">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.client} | {job.location}</p>
        </div>
        <div>
          <span className="badge">{job.status}</span>
        </div>
      </div>
      <button onClick={() => onView(job.id)}>VIEW</button>
    </div>
  );
};
```

### Key UI Patterns

1. **Sidebar Navigation**: Fixed left sidebar with active state highlighting
2. **Top Bar**: Logo, search, notifications, user profile
3. **Card Layouts**: Consistent padding (15-20px), border styling
4. **Forms**: Two-column grid for related fields, clear labels
5. **Tables**: Sortable headers, row actions, pagination
6. **Modals**: Centered overlay with backdrop
7. **Drag & Drop**: Visual feedback on hover/drag

## 🎨 Design Tokens for Implementation

```css
/* Colors */
--primary: #4a90e2;
--success: #27ae60;
--warning: #f39c12;
--danger: #e74c3c;
--dark: #2c3e50;
--light: #f8f9fa;
--border: #ddd;
--text-primary: #333;
--text-secondary: #666;
--text-muted: #999;

/* Spacing */
--spacing-xs: 5px;
--spacing-sm: 10px;
--spacing-md: 15px;
--spacing-lg: 20px;
--spacing-xl: 30px;

/* Typography */
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 13px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 24px;

/* Borders */
--border-width: 2px;
--border-radius-sm: 3px;
--border-radius-md: 6px;
--border-radius-lg: 8px;
--border-radius-xl: 12px;
```

## 📚 Related Documentation

- **System Requirements**: See `SA_Recruitment_ATS_System_Requirements.md`
- **Database Schema**: See `database_schema.sql`
- **Project Plan**: See `SA_Recruitment_ATS_Project_Plan.xlsx`
- **Developer Guide**: See `DEVELOPER_QUICKSTART.md`

## 🆘 Questions?

For wireframe clarifications or design questions:
- Email: mpumelelo@infinityworkitsolutions.com
- Company: InfinityWork IT Solutions (Pty) Ltd
- Location: Cape Town, South Africa

---

**Version**: 1.0  
**Date**: January 22, 2026  
**Status**: Ready for Development
