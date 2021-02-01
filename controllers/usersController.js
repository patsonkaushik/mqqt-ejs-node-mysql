const Users = require('./../models/usersModel');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var request = require('request-promise');
var uniqid = require('uniqid');
var mqtt = require('mqtt');



exports.login = async (req, res) => {
    const email = req.body.email;
    var users = await Users.findOne({ where: { email: email } }).then(userData => {

        var user = userData.dataValues
        console.log(user)
        //console.log(user);
        bcrypt.compare(req.body.password, user.password, async (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result) {   //If comparasion is successful
                const token = jwt.sign({
                    email: user.email,
                    userId: user.id
                }, 'test secret', { expiresIn: '3h' });
                // Set session expiration to 3 hr.
                const expiresIn = 60 * 60 * 3 * 1000;
                const options = { maxAge: expiresIn, httpOnly: true };
                res.cookie('token', token, options);
                res.cookie('id', user.id, options);

                res.redirect('/dashboard/' + user.id);
            }
            else {
                res.render('login', {
                    message: 'password do not match'
                });
            }
        })


    })
}


exports.signup = async (req, res) => {
    const email = req.body.email;
    try {
        await Users.findOne({ where: { email: email } })
            .then(user => {
                console.log(user);
                if (user != null) {
                    return res.render('register', {
                        message: 'User Already Exists'
                    });
                }
                else {
                    let password = req.body.password;
                    let confirm_password = req.body.confirm_password;
                    if (password === confirm_password) {
                        bcrypt.hash(req.body.password, 10, async (err, hash) => {   //Salt size is 10
                            if (err) {
                                return res.render('register', {
                                    message: err
                                });
                            } else {

                                //await Users.create({ email: email })
                                await Users.create({
                                    email: email, password: hash
                                }).then(() => {
                                    console.log('User added in DB');
                                    res.render('login', {
                                        message: 'Login with same credentials'
                                    });
                                })
                                    .catch(err => {
                                        res.render('register', {
                                            message: err.stack
                                        });
                                    })
                            }
                        });
                    }
                }
            })
            .catch(err => {
                res.render('register', {
                    message: err.stack
                });
            })
    } catch (error) {
        res.status(404).send(error);
    }
}
