/* ============================================================
   DATABASE SEEDER (server/utils/seed.js)
   Run: npm run seed
   Creates: admin user + sample courses + sample test
   ============================================================ */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Test = require('../models/Test');

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

const sampleTest = {
    title: 'Mathematics Practice Test — Class 10',
    description: 'Chapter-wise practice test for Class 10 Mathematics',
    type: 'chapter-test',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
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
            explanation: 'This formula is known as the Quadratic Formula (Sridharacharya\'s formula).',
            marks: 1
        }
    ]
};

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional)
    await Course.deleteMany({});
    await Test.deleteMany({});
    console.log('🧹 Cleared existing courses and tests');

    // Create admin if not exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
        const admin = await User.create({
            name: 'Admin',
            email: process.env.ADMIN_EMAIL || 'admin@edunexacademy.com',
            mobile: '9000000000',
            password: process.env.ADMIN_PASSWORD || 'Admin@1234',
            role: 'admin',
            isVerified: true,
            isActive: true
        });
        console.log(`👤 Admin created: ${admin.email}`);
    } else {
        console.log('👤 Admin already exists. Skipping.');
    }

    // Create sample student
    const existingStudent = await User.findOne({ role: 'student' });
    if (!existingStudent) {
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
        console.log(`🎓 Sample student created: ${student.rollNumber}`);
    }

    // Create courses
    const createdCourses = await Course.insertMany(courses);
    console.log(`📚 ${createdCourses.length} courses seeded.`);

    // Link test to first course
    sampleTest.course = createdCourses[0]._id;
    const test = await Test.create(sampleTest);
    console.log(`📝 Sample test seeded: ${test.title}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('─────────────────────────────────');
    console.log(`Admin Login: ${process.env.ADMIN_EMAIL || 'admin@edunexacademy.com'}`);
    console.log(`Admin Pass:  ${process.env.ADMIN_PASSWORD || 'Admin@1234'}`);
    console.log(`Student:     ravi@example.com / Student@123`);
    console.log('─────────────────────────────────\n');

    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
