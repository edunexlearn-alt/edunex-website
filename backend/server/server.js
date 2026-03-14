/* ============================================================
   EDUNEX ACADEMY - MAIN SERVER (server/server.js)
   Node.js + Express + MongoDB Backend
   ============================================================ */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// ---- Middleware ----
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'null'          // for file:// opened HTML files
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ---- Rate Limiting ----
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ---- Static Files ----
// (Frontend and Admin are now served separately from the frontend directory)


// ---- API Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));

// ---- API Root ----
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Edunex Academy REST API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            courses: '/api/courses',
            tests: '/api/tests',
            fees: '/api/fees',
            enquiries: '/api/enquiries',
            admin: '/api/admin',
            payments: '/api/payments'
        }
    });
});

// ---- 404 Handler (only for /api routes) ----
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API Route ${req.originalUrl} not found.` });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ---- Auto-seed function for in-memory DB ----
async function autoSeed() {
    const User = require('./models/User');
    const Course = require('./models/Course');
    const Test = require('./models/Test');

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return; // Already seeded

    console.log('🌱 Auto-seeding database with sample data...\n');

    // Create admin
    const admin = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@edunexacademy.com',
        mobile: '9000000000',
        password: process.env.ADMIN_PASSWORD || 'Admin@Edunex2024',
        role: 'admin',
        isVerified: true,
        isActive: true
    });
    console.log(`   👤 Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@Edunex2024'}`);

    // Create sample student
    const student = await User.create({
        name: 'Ravi Sharma',
        email: 'ravi@example.com',
        mobile: '9876543210',
        password: 'Student@123',
        role: 'student',
        studentClass: '10',
        parentName: 'Suresh Sharma',
        isActive: true
    });
    console.log(`   🎓 Student: ravi@example.com / Student@123 (Roll: ${student.rollNumber})`);

    // Create courses
    const courses = [
        {
            title: 'Class 5th – 10th (All Subjects)', code: 'ACA-5-10', category: 'academic',
            description: 'Full academic coaching for classes 5 to 10 covering all CBSE/State Board subjects.',
            icon: 'fas fa-book-open', colorGradient: 'linear-gradient(135deg,#667eea,#764ba2)',
            topics: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'],
            duration: 'Year-round', monthlyFee: 2500, admissionFee: 1000,
            batches: [
                { name: 'Morning', time: '8:00 AM – 10:00 AM', days: 'Mon-Sat', capacity: 25 },
                { name: 'Evening', time: '4:00 PM – 6:00 PM', days: 'Mon-Sat', capacity: 25 }
            ], order: 1
        },
        {
            title: 'Class 11–12 (PCM)', code: 'PC-11-PCM', category: 'senior-secondary', subcategory: 'PCM',
            description: 'Physics, Chemistry, Mathematics for 11th & 12th grade students targeting Engineering.',
            icon: 'fas fa-flask', colorGradient: 'linear-gradient(135deg,#f093fb,#f5576c)',
            topics: ['Physics', 'Chemistry', 'Mathematics', 'Board Exam Prep', 'JEE Foundation'],
            duration: '2 Years', monthlyFee: 4500, admissionFee: 2000,
            batches: [{ name: 'Morning', time: '7:00 AM – 10:00 AM', days: 'Mon-Sat', capacity: 20 }], order: 2
        },
        {
            title: 'Class 11–12 (PCB)', code: 'PC-11-PCB', category: 'senior-secondary', subcategory: 'PCB',
            description: 'Physics, Chemistry, Biology for students targeting Medical/NEET.',
            icon: 'fas fa-heartbeat', colorGradient: 'linear-gradient(135deg,#43e97b,#38f9d7)',
            topics: ['Physics', 'Chemistry', 'Biology', 'NEET Foundation', 'Practical Lab'],
            duration: '2 Years', monthlyFee: 4500, admissionFee: 2000,
            batches: [{ name: 'Afternoon', time: '11:00 AM – 2:00 PM', days: 'Mon-Sat', capacity: 20 }], order: 3
        },
        {
            title: 'Python Programming (Beginner to Advanced)', code: 'CS-PYTHON', category: 'computer',
            description: 'Complete Python programming from basics to advanced, including projects & OOP.',
            icon: 'fab fa-python', colorGradient: 'linear-gradient(135deg,#4facfe,#00f2fe)',
            topics: ['Python Basics', 'Data Structures', 'OOP', 'File Handling', 'APIs', 'Projects'],
            duration: '4 Months', monthlyFee: 3000, admissionFee: 500, hasCertificate: true,
            batches: [{ name: 'Weekend', time: '10:00 AM – 1:00 PM', days: 'Sat-Sun', capacity: 15 }], order: 4
        },
        {
            title: 'Web Development (HTML, CSS, JS, React)', code: 'CS-WEBDEV', category: 'computer',
            description: 'Build modern, responsive websites and web applications from scratch.',
            icon: 'fas fa-laptop-code', colorGradient: 'linear-gradient(135deg,#fa709a,#fee140)',
            topics: ['HTML5', 'CSS3', 'JavaScript ES6+', 'React.js', 'Node.js Basics', 'Deployment'],
            duration: '5 Months', monthlyFee: 3500, admissionFee: 500, hasCertificate: true,
            batches: [{ name: 'Evening', time: '5:00 PM – 7:00 PM', days: 'Mon-Fri', capacity: 15 }], order: 5
        },
        {
            title: 'Data Analytics & Excel Advanced', code: 'CS-DATA', category: 'computer',
            description: 'Master data analysis, Excel, Power BI, and basic SQL for career success.',
            icon: 'fas fa-chart-bar', colorGradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
            topics: ['Excel Advanced', 'Pivot Tables', 'Power BI', 'SQL Basics', 'Data Visualization'],
            duration: '3 Months', monthlyFee: 2800, admissionFee: 500, hasCertificate: true,
            batches: [{ name: 'Weekend', time: '2:00 PM – 5:00 PM', days: 'Sat-Sun', capacity: 15 }], order: 6
        }
    ];

    const createdCourses = await Course.insertMany(courses);
    console.log(`   📚 ${createdCourses.length} courses seeded`);

    // Create sample test
    const sampleTest = {
        title: 'Mathematics Practice Test — Class 10',
        description: 'Chapter-wise practice test for Class 10 Mathematics',
        type: 'chapter-test',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        course: createdCourses[0]._id,
        duration: 30,
        maxAttempts: 3,
        showAnswers: true,
        isActive: true,
        questions: [
            {
                questionText: 'What is the standard form of a quadratic equation?',
                type: 'mcq',
                options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx + c = 0', 'ax² + b = 0'],
                correctAnswer: 'ax² + bx + c = 0',
                explanation: 'The standard form of a quadratic equation is ax² + bx + c = 0, where a ≠ 0.',
                marks: 2
            },
            {
                questionText: 'The number of roots of a quadratic equation is:',
                type: 'mcq',
                options: ['1', '2', '3', 'Infinite'],
                correctAnswer: '2',
                explanation: 'A quadratic equation always has exactly 2 roots (may be equal or complex).',
                marks: 1
            },
            {
                questionText: 'If discriminant (D) < 0, the equation has real roots.',
                type: 'true-false',
                options: ['True', 'False'],
                correctAnswer: 'False',
                explanation: 'When D < 0, the equation has no real roots (only complex roots).',
                marks: 1
            },
            {
                questionText: 'Solve: x² - 5x + 6 = 0. What are the roots?',
                type: 'mcq',
                options: ['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 1, -6'],
                correctAnswer: 'x = 2, 3',
                explanation: 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3.',
                marks: 2
            },
            {
                questionText: 'The formula to find roots is x = [-b ± √(b²-4ac)] / 2a. This is called:',
                type: 'mcq',
                options: ['Factorization', 'Quadratic Formula', 'Completing the square', 'None'],
                correctAnswer: 'Quadratic Formula',
                explanation: "This formula is known as the Quadratic Formula (Sridharacharya's formula).",
                marks: 1
            }
        ]
    };

    await Test.create(sampleTest);
    console.log(`   📝 Sample test seeded`);

    console.log('\n   ✅ Database seeded successfully!');
    console.log('   ─────────────────────────────────');
    console.log(`   Admin Login: ${process.env.ADMIN_EMAIL || 'admin@edunexacademy.com'}`);
    console.log(`   Admin Pass:  ${process.env.ADMIN_PASSWORD || 'Admin@Edunex2024'}`);
    console.log(`   Student:     ravi@example.com / Student@123`);
    console.log('   ─────────────────────────────────\n');
}

// ---- Boot Sequence ----
async function startServer() {
    // 1. Connect to MongoDB (falls back to in-memory)
    await connectDB();

    // 2. Auto-seed if database is empty
    try {
        await autoSeed();
    } catch (seedErr) {
        console.error('⚠️  Auto-seed warning:', seedErr.message);
    }

    // 3. Start HTTP server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log('\n🚀 ========================== 🚀');
        console.log(`   EDUNEX ACADEMY SERVER`);
        console.log(`   🌐 http://localhost:${PORT}`);
        console.log(`   🔧 Mode: ${process.env.NODE_ENV}`);
        console.log('🚀 ========================== 🚀\n');
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err.message);
        server.close(() => process.exit(1));
    });
}

startServer();

module.exports = app;
