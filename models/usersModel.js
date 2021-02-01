var Sequelize = require('sequelize');
var sequelize = require('../config');

var Users = sequelize.define('userdata', {
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

module.exports = Users;