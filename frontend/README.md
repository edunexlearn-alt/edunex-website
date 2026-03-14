# 🎓 Edunex Academy — Institute Website

A professional, fully responsive educational institute website built with **HTML5, CSS3, and Vanilla JavaScript**. Designed for scalability — future-ready for React.js, Node.js backend, and MongoDB.

---

## 📁 Project Structure

```
edunex_academy/
│
├── index.html                  # Home Page
│
├── pages/
│   ├── about.html              # About Us Page
│   ├── courses.html            # All Courses (Academic + Computer)
│   ├── admissions.html         # Admission Enquiry Form
│   ├── contact.html            # Contact Page
│   └── login.html              # Student Login (Portal Placeholder)
│
├── assets/
│   ├── css/
│   │   ├── style.css           # Global Styles & Design System
│   │   ├── home.css            # Home Page Specific Styles
│   │   └── pages.css           # Inner Pages Styles
│   │
│   ├── js/
│   │   ├── main.js             # Global JavaScript (Navbar, Animations, Toast)
│   │   └── home.js             # Home Page JS (Counters, Testimonials Slider)
│   │
│   └── images/
│       ├── logo.png            # Institute Logo
│       └── hero-banner.png     # Hero Section Banner
│
└── README.md                   # This File
```

---

## 🚀 How to Run

### Option 1: Direct Open (No Server)
1. Navigate to `c:\edunex_academy\`
2. Double-click `index.html` to open in your browser

### Option 2: VS Code Live Server (Recommended)
1. Open the project folder in VS Code:
   ```
   code c:\edunex_academy
   ```
2. Install the **Live Server** extension by Ritwick Dey
3. Right-click `index.html` → **"Open with Live Server"**
4. The site opens at `http://127.0.0.1:5500`

### Option 3: Python HTTP Server
```bash
cd c:\edunex_academy
python -m http.server 8080
# Open http://localhost:8080
```

### Option 4: Node.js HTTP Server
```bash
npx serve c:\edunex_academy
```

---

## 📄 Pages Overview

| Page | File | Description |
|------|------|-------------|
| **Home** | `index.html` | Hero, Course Categories, Why Us, Testimonials, CTAs |
| **About** | `pages/about.html` | Story, Mission/Vision, Faculty, Achievements |
| **Courses** | `pages/courses.html` | All courses with filter (Academic, Senior, Computer) |
| **Admissions** | `pages/admissions.html` | Validated enquiry form, session info sidebar |
| **Contact** | `pages/contact.html` | Contact cards, contact form, WhatsApp link |
| **Login** | `pages/login.html` | Future-ready student portal placeholder |

---

## 🎨 Design System

- **Primary Color**: `#1a3c8f` (Deep Navy Blue)
- **Accent Color**: `#00c8ff` (Cyan)
- **Gold Accent**: `#f5a623`
- **Fonts**: Plus Jakarta Sans (headings) + Inter (body)
- **Icons**: Font Awesome 6.5
- **Responsive**: Mobile, Tablet, Desktop

---

## 🔧 Features

- ✅ Fully Responsive (Mobile-first)
- ✅ Sticky Navbar with glass effect
- ✅ Dropdown navigation
- ✅ Animated number counters
- ✅ Auto-playing testimonials slider
- ✅ Course filter tabs
- ✅ JS Form Validation
- ✅ Toast notifications
- ✅ Scroll animations
- ✅ Announcement ticker
- ✅ Back-to-top button
- ✅ SEO meta tags on every page
- ✅ WhatsApp integration
- ✅ Future-ready Login portal scaffold

---

## 🔮 Future Roadmap (Backend Integration)

- [ ] Node.js + Express backend
- [ ] MongoDB database for student records
- [ ] JWT-based student authentication
- [ ] Admin dashboard (manage courses, students, fees)
- [ ] Online tests & auto-grading
- [ ] Fee payment integration (Razorpay)
- [ ] Email notifications (Nodemailer)
- [ ] LMS (Learning Management System)

---

## 📞 Institute Contact

- **Phone**: +91 98765 43210  
- **Email**: info@edunexacademy.com  
- **Address**: 123 Education Street, Sector 4, New Delhi – 110001  
- **Hours**: Monday to Saturday, 8:00 AM – 8:00 PM

---

*Built with ❤️ for Edunex Academy — Empowering Futures Through Quality Education*
