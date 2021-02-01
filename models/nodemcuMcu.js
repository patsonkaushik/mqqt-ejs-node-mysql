var Sequelize = require('sequelize');
var sequelize = require('../config');

var Nodemcu = sequelize.define('nodemcu', {
    type: Sequelize.STRING,
    toggle_red: Sequelize.INTEGER,
    toggle_green: Sequelize.INTEGER,
    gauge: Sequelize.INTEGER,
    slider: Sequelize.INTEGER,
    line_chart: Sequelize.INTEGER,
    red_led: Sequelize.STRING,
    green_led: Sequelize.STRING,
    servo: Sequelize.STRING
});

module.exports = Nodemcu;