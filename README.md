# MyMeet - Career Fair Intelligence Platform

Run smarter career fairs effortlessly. Create events, generate QR codes, share resources, and get real-time analytics.

## 🚀 Features

### Event Management
- **Smart Event Creation** - Guided 4-step wizard for complete event setup
- **Google Meet Integration** - Instant meeting link generation
- **Resource Hub** - Attach up to 10 labeled resource links
- **QR Code Generator** - Modern SVG-based QR codes for any URL
- **Event Categories** - Organize events with custom tags

### Analytics & Data
- **Custom Analytics** - Build your own analytics fields and charts
- **Live Charts** - Real-time data visualization with Chart.js
- **CSV Export** - Export all data in readable CSV format
- **Cross-Event Comparison** - Compare performance across events

### User Experience
- **Mobile Responsive** - Works perfectly on all devices
- **Dark/Light Theme** - Monochrome design system
- **Keyboard Shortcuts** - Power user navigation (D, N, E, A, H)
- **Onboarding Tour** - Interactive first-time user guide
- **Toast Notifications** - Elegant feedback system

### Technical Features
- **No Backend Required** - Pure frontend application
- **Local Storage** - All data stored locally
- **Shareable Forms** - Direct links for attendee registration
- **Undo Delete** - 10-second recovery window
- **Data Validation** - Client-side form validation

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: CSS Variables, Flexbox, Grid
- **Charts**: Chart.js
- **QR Codes**: Custom SVG implementation
- **Maps**: Google Maps Embed
- **Export**: SheetJS for Excel, Custom CSV export
- **WebGL**: Three.js for landing page effects

## 📦 Deployment

### Vercel Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy - No build configuration needed

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd MyMeet-main

# Start development server
python3 -m http.server 3000
# or
npm run dev
```

## 📱 Usage

1. **Create Events**: Use the 4-step wizard to set up events
2. **Manage Resources**: Add links and QR codes for attendees
3. **Track Analytics**: Monitor attendance and custom metrics
4. **Export Data**: Download CSV reports for analysis

## 🔧 Configuration

### Environment Variables
No environment variables required - everything runs client-side.

### Customization
- Modify `styles/base.css` for theme changes
- Update `scripts/storage.js` for data structure changes
- Edit `index.html` for landing page customization

## 📄 Pages

- **Landing Page** (`/`) - WebGL shader background with feature showcase
- **Dashboard** (`/dashboard.html`) - Overview and quick actions
- **Create Event** (`/create.html`) - 4-step event creation wizard
- **My Events** (`/events.html`) - Event management with search/filter
- **Analytics** (`/analytics.html`) - Data visualization and insights
- **Help** (`/help.html`) - FAQ and chatbot support
- **Event Detail** (`/event-detail.html`) - Full event editing and management
- **Attendee Form** (`/form.html`) - Public registration form

## 🎯 Keyboard Shortcuts

- `D` - Dashboard
- `N` - New Event
- `E` - Events
- `A` - Analytics
- `H` - Help

## 🔒 Security

- All data stored locally in browser
- No external API dependencies
- Secure QR code generation
- Input validation and sanitization

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For support and questions, use the in-app chatbot or create an issue in the repository.

---

**MyMeet** - Making career fairs smarter, one event at a time.
