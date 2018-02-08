import { SQLConnection, Sequelize } from './../libs/mysql-lib';

SQLConnection.define(
  'demo_table',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    image_url: Sequelize.STRING,
    phone_number: Sequelize.STRING,
    state: Sequelize.STRING,
    gender: Sequelize.STRING,
    birthday: Sequelize.DATE,
    profile_id: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true, //Soft Delete
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

export const User = SQLConnection.models.user_data;
