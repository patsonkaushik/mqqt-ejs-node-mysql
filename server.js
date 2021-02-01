var express = require('express')
var app = express()

const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
var methodOverride = require('method-override')

const sequelize = require('./config');
const usesRouter = require('./routes/usersRouter');


const port = 3001;

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been  established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database: ', err);
    });


sequelize.sync().then(function () {

}).then(function () {
    console.log('Connection to database established successfully.');
    app.listen(port, () => {
        console.log('Running server on port ' + port);
    });
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'))

var path = require('path');
var cookieParser = require('cookie-parser');

app.use(cookieParser());

//Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Set static public data
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usesRouter);


// Default response for any other request
app.use(function (req, res) {
    res.status(404).render('404');
});
