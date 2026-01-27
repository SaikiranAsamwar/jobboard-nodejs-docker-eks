const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Use SQLite if PostgreSQL is not available
const sequelize = process.env.DB_URI
  ? new Sequelize(process.env.DB_URI, {
      dialect: 'postgres',
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../jobboard.db'),
      logging: false,
    });

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'user' }
});

const Job = sequelize.define('Job', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'active' }
});

const Application = sequelize.define('Application', {
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

// Relationships
Job.belongsTo(User, { as: 'postedBy', foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });

module.exports = { sequelize, User, Job, Application };
