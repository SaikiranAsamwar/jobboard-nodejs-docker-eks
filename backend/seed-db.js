require('dotenv').config();
const { sequelize, User, Job } = require('./src/models');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Reset database
    await sequelize.sync({ force: true });
    console.log('✓ Database synced');

    // Create sample user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'admin@jobboard.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin'
    });
    console.log('✓ Created admin user');

    // Create sample jobs
    const jobs = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
        location: 'San Francisco, CA',
        company: 'TechCorp',
        userId: user.id
      },
      {
        title: 'Frontend React Developer',
        description: 'Join our team as a React Developer! Build beautiful, responsive user interfaces and work with cutting-edge technologies.',
        location: 'Remote',
        company: 'WebStudio Inc',
        userId: user.id
      },
      {
        title: 'Backend Node.js Engineer',
        description: 'Seeking a talented Backend Engineer with Node.js expertise. Design and implement scalable APIs and microservices.',
        location: 'New York, NY',
        company: 'CloudServices Ltd',
        userId: user.id
      },
      {
        title: 'DevOps Engineer',
        description: 'Help us build and maintain our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
        location: 'Austin, TX',
        company: 'InfraScale',
        userId: user.id
      },
      {
        title: 'UI/UX Designer',
        description: 'Creative UI/UX Designer needed to craft amazing user experiences. Strong portfolio and Figma skills required.',
        location: 'Los Angeles, CA',
        company: 'DesignHub',
        userId: user.id
      },
      {
        title: 'Data Scientist',
        description: 'Analyze large datasets and build machine learning models to drive business insights.',
        location: 'Boston, MA',
        company: 'DataFlow Analytics',
        userId: user.id
      },
      {
        title: 'Mobile App Developer',
        description: 'Develop native and cross-platform mobile applications using React Native or Flutter.',
        location: 'Seattle, WA',
        company: 'AppWorks Studio',
        userId: user.id
      },
      {
        title: 'Product Manager',
        description: 'Lead product development from concept to launch. Define roadmaps and work with cross-functional teams.',
        location: 'Remote',
        company: 'InnovateLabs',
        userId: user.id
      }
    ];

    for (const jobData of jobs) {
      await Job.create(jobData);
    }

    console.log(`✓ Created ${jobs.length} sample jobs`);
    console.log('\n📋 Sample login credentials:');
    console.log('   Email: admin@jobboard.com');
    console.log('   Password: password123\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedDatabase();
