require('dotenv').config();
const { sequelize, User, Job } = require('./models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Reset database
    console.log('Database synced');

    // Create sample user
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'admin@jobboard.com',
      passwordHash,
      role: 'admin'
    });
    console.log('Created admin user');

    // Create sample jobs
    const jobs = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
        location: 'San Francisco, CA',
        ownerId: user.id
      },
      {
        title: 'Frontend React Developer',
        description: 'Join our team as a React Developer! Build beautiful, responsive user interfaces and work with cutting-edge technologies.',
        location: 'Remote',
        ownerId: user.id
      },
      {
        title: 'Backend Node.js Engineer',
        description: 'Seeking a talented Backend Engineer with Node.js expertise. Design and implement scalable APIs and microservices.',
        location: 'New York, NY',
        ownerId: user.id
      },
      {
        title: 'DevOps Engineer',
        description: 'Help us build and maintain our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
        location: 'Austin, TX',
        ownerId: user.id
      },
      {
        title: 'UI/UX Designer',
        description: 'Creative UI/UX Designer needed to craft amazing user experiences. Strong portfolio and Figma skills required.',
        location: 'Los Angeles, CA',
        ownerId: user.id
      },
      {
        title: 'Data Scientist',
        description: 'Analyze large datasets and build machine learning models to drive business insights.',
        location: 'Boston, MA',
        ownerId: user.id
      },
      {
        title: 'Mobile App Developer',
        description: 'Develop native and cross-platform mobile applications using React Native or Flutter.',
        location: 'Seattle, WA',
        ownerId: user.id
      },
      {
        title: 'Product Manager',
        description: 'Lead product development from concept to launch. Define roadmaps and work with cross-functional teams.',
        location: 'Remote',
        ownerId: user.id
      }
    ];

    for (const jobData of jobs) {
      await Job.create(jobData);
    }

    console.log(`Created ${jobs.length} sample jobs`);
    console.log('\nSample login credentials:');
    console.log('Email: admin@jobboard.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
