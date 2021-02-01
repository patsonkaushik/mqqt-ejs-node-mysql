const usersController = require('./../controllers/usersController')
const Users = require('./../models/usersModel');

const Nodemcu = require('./../models/nodemcuMcu');
const express = require('express');
const router = express.Router();
var mqtt = require('mqtt');


router
    .route('/')
    .get((req, res) => {
        res.redirect('/login');
    })

router.post('/login', usersController.login);
router.get('/login', ((req, res) => {
    res.render('login', {
        message: ''
    });
}));


router.get('/register', ((req, res) => {
    res.render('register', {
        message: ''
    });
}));

router.post('/register', usersController.signup);


//var requestLoop;
var client = mqtt.connect('ws://iot_guy:mosquitto@127.0.0.1:9001');
client.on('connect', function () {
    console.log("Server connected to the Mqtt for nodemcu");
});
var client1 = mqtt.connect('mqtt://test.mosquitto.org');
client1.on('connect', function () {
    console.log("Server connected to the websocket Mqtt for browser");
});

router.get('/dashboard/:id', (async (req, res) => {
    const id = req.params.id;
    //console.log(req.sessions.token);
    var users = await Users.findOne({ where: { id: id } })
        .then(userData => {
            var user = userData.dataValues
            client1.subscribe(id + '/nodemcu', function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Subscribed to ' + id + '/nodemcu');
                }
            });
            client1.subscribe(id + '/red_led');
            client1.subscribe(id + '/green_led');
            client1.subscribe(id + '/servo');

            client.subscribe(id + '/red_led');
            client.subscribe(id + '/green_led');
            client.subscribe(id + '/servo');

            function IsJSONString(text) {
                if (typeof text !== "string") {
                    return false;
                }
                try {
                    JSON.parse(text);
                    return true;
                }
                catch (error) {
                    return false;
                }
            }

            client.on('message', function (topic, msg) {   //FOr communicating to CLIENT/BROWSER
                console.log('topic', topic)
                console.log('msg', msg)
                if (topic == id + '/green_led') {
                    if (msg.toString() == 'ON')
                        client1.publish(id + '/green_led', 'ON', { qos: 2 });
                    else
                        client1.publish(id + '/green_led', 'OFF');
                }
                if (topic == id + '/red_led') {
                    if (msg.toString() == 'ON')
                        client1.publish(id + '/red_led', 'ON');
                    else
                        client1.publish(id + '/red_led', 'OFF');
                }
                if (topic == id + '/servo') {
                    client1.publish(id + '/servo', msg.toString());
                }
            });

            client1.on('message', async function (topic, msg) {


                //FOr communicating to NODEMCU
                console.log(`topic${topic}`)
                if (topic == `${id}/nodemcu`) {
                    let obj;
                    if (IsJSONString(msg.toString()) == true) {
                        obj = JSON.parse(msg.toString());
                    }
                    console.log(obj)
                    console.log('topic', topic)
                    console.log('msg', msg)


                    await Nodemcu.create({
                        type: 'dynamic',
                        fields: {
                            ldr: obj.ldr,
                            dist: obj.dist
                        }
                    }).then(async () => {
                        console.log('LDR: ' + obj.ldr + ' Dist: ' + obj.dist);
                        client.publish(id + '/nodemcu', msg.toString(), { qos: 2 });

                        await Nodemcu.findOne({ where: { id: id }, attributes: ['id', 'createdAt'], order: [['green_led', 'DESC']] })
                            .then(NodemcuData => {
                                console.log(NodemcuData)

                                console.log(NodemcuData.dataValues.createdAt)
                                console.log(id + '/red_time')
                                //client1.publish(id + '/red_time', 'publicdddd')
                                client.publish(id + '/green_time', new Date(NodemcuData.dataValues.createdAt).toLocaleString(), { qos: 2 });
                            })
                    });


                    await Nodemcu.findOne({ where: { id: id }, attributes: ['id', 'createdAt'], order: [['id', 'DESC']] })
                        .then(NodemcuData => {
                            console.log(NodemcuData)

                            console.log(NodemcuData.dataValues.createdAt)
                            console.log(id + '/nodemcu_time')
                            //client1.publish(id + '/red_time', 'publicdddd')
                            client.publish(id + '/nodemcu_time', new Date(NodemcuData.dataValues.createdAt).toLocaleString(), { qos: 2 });
                        }).catch(err => {
                            console.log(err.stack);
                        });



                    // influx.query(`
                    //     select last(ldr),time from nodemcu
                    //     WHERE id='${id}'`).then(result => {
                    //     client.publish(id + '/nodemcu_time', new Date(result[0].time).toLocaleString(), { qos: 2 });
                    // }).catch(err => {
                    //     console.log(err.stack);
                    // });
                }
                if (topic == id + '/green_led') {

                    console.log('green_led')
                    var green_led = msg.toString()
                    await Nodemcu.create({
                        type: 'static', green_led
                    }).then(async (data) => {
                        console.log(data)
                        console.log('RED: ' + msg.toString());

                        await Nodemcu.findOne({ where: { id: id }, attributes: ['id', 'createdAt'], order: [['green_led', 'DESC']] })
                            .then(NodemcuData => {
                                console.log(NodemcuData)

                                console.log(NodemcuData.dataValues.createdAt)
                                console.log(id + '/red_time')
                                //client1.publish(id + '/red_time', 'publicdddd')
                                client.publish(id + '/green_time', new Date(NodemcuData.dataValues.createdAt).toLocaleString(), { qos: 2 });
                            })
                    });
                    client.publish('green_time', new Date().toLocaleString());

                    // influx.writePoints([
                    //     {
                    //         measurement: 'nodemcu',
                    //         tags: {
                    //             id: id,
                    //             type: 'static'
                    //         },
                    //         fields: {
                    //             green_led: msg.toString()
                    //         },
                    //     }
                    // ]).then(() => {
                    //     console.log('GREEN: ' + msg.toString());
                    //     influx.query(`
                    //         select last(green_led),time from nodemcu
                    //         WHERE id='${id}'`).then(result => {
                    //         client.publish(id + '/green_time', new Date(result[0].time).toLocaleString(), { qos: 2 });
                    //     }).catch(err => {
                    //         console.log(err.stack);
                    //     });
                    //     //client.publish('green_time',new Date().toLocaleString());   can be used with other DB
                    // })
                }
                else if (topic == id + '/red_led') {

                    console.log('red_led')

                    var red_led = msg.toString()
                    await Nodemcu.create({
                        type: 'dynamic', red_led
                    }).then(async (data) => {
                        console.log(data)
                        console.log('RED: ' + msg.toString());

                        await Nodemcu.findOne({ where: { id: id }, attributes: ['id', 'createdAt'], order: [['red_led', 'DESC']] })
                            .then(NodemcuData => {
                                console.log(NodemcuData)

                                console.log(NodemcuData.dataValues.createdAt)
                                console.log(id + '/red_time')
                                //client1.publish(id + '/red_time', 'publicdddd')
                                client.publish(id + '/red_time', new Date(NodemcuData.dataValues.createdAt).toLocaleString(), { qos: 2 });
                            })
                        // influx.query(`
                        //     select last(red_led),time from nodemcu
                        //     WHERE id='${id}'`).then(result => {
                        //     client.publish(id + '/red_time', new Date(result[0].time).toLocaleString(), { qos: 2 });
                        // }).catch(err => {
                        //     console.log(err.stack);
                        // });
                    })
                }
                if (topic == id + '/servo') {

                    var servo = msg.toString();
                    await Nodemcu.create({
                        type: 'static', servo
                    }).then(async (data) => {
                        await Nodemcu.findOne({ where: { id: id }, attributes: ['id', 'createdAt'], order: [['servo', 'DESC']] })
                            .then(NodemcuData => {
                                console.log(NodemcuData)

                                console.log(NodemcuData.dataValues.createdAt)
                                console.log(id + '/servo_time')
                                //client1.publish(id + '/red_time', 'publicdddd')
                                client.publish(id + '/servo_time', new Date(NodemcuData.dataValues.createdAt).toLocaleString(), { qos: 2 });
                            })
                    })




                    // influx.writePoints([
                    //     {
                    //         measurement: 'nodemcu',
                    //         tags: {
                    //             id: id,
                    //             type: 'static'
                    //         },
                    //         fields: {
                    //             servo: msg.toString()
                    //         },
                    //     }
                    // ]).then(() => {
                    //     console.log('servo: ' + msg.toString());
                    //     influx.query(`
                    //         select last(servo),time from nodemcu
                    //         WHERE id='${id}'`).then(result => {
                    //         client.publish(id + '/servo_time', new Date(result[0].time).toLocaleString(), { qos: 2 });
                    //     }).catch(err => {
                    //         console.log(err.stack);
                    //     });
                    // })
                }

            });

            res.render('dashboard', {
                uid: user.id,
                creationTime: user.time,
                email: user.email
            });

        })
        .catch(function (err) {
            console.log(err.stack);
        });
}))







module.exports = router;