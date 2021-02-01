var ctx = document.getElementById('myChart').getContext('2d');
var id = $('#variableJSON1').text();

$(function () {
  $('#last5').click(function () {
    $.ajax({
      url: `http://localhost:8086/query?db=mydb&q=SELECT ldr,time FROM nodemcu WHERE id='${id}' ORDER BY desc LIMIT 5`,
      dataType: 'json',
      success: function (res) {
        console.log(res.results[0].series[0].values);
        const header = ['time', 'ldr'];
        var csvStr = header.join(",") + "\n";

        res.results[0].series[0].values.forEach(elem => {

          csvStr += new Date(elem[0]).toLocaleString() + ',' + elem[1] + "\n";
        });

        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvStr);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'ldr.csv';
        hiddenElement.click();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('Could not get data, server response: ' + textStatus + ': ' + errorThrown);
      }
    });

  });
  let init_red = false;
  let init_green = false;
  let init_slider = false;

  // var client = mqtt.connect('mqtt://test.mosquitto.org', {
  //   clientId: 'mqtt_javascript_client'                         //websocket
  // });

  var port = 8080;
  var clientID = "abgc";
  var client;
  client = new Paho.MQTT.Client('test.mosquitto.org', Number(port), clientID);

  //Hivemq- ws://broker.mqttdashboard.com:8000, err- failed: Connection closed before receiving a handshake response
  //test.mosquitto- ws://test.mosquitto.org/mqtt:8080, err- failed: Error during WebSocket handshake: Unexpected response code: 404
  //Local- ws://iot_guy:mosquitto@127.0.0.1:9001, err- No


  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  client.connect({
    onSuccess: onConnect,
  });

  function onConnect() {
    console.log('client has connected!');
    console.log(id + '/red_time')
    client.subscribe(id + '/red_time');
    client.subscribe(id + '/nodemcu_time');
    client.subscribe(id + '/green_time');
    client.subscribe(id + '/servo_time');

    client.subscribe(id + '/retain_green');
    client.subscribe(id + '/retain_red');
    client.subscribe(id + '/retain_servo');

    client.subscribe(id + '/nodemcu');
    client.subscribe(id + '/turnoff_client');
  };

  $('#green').change(function () {
    if (!init_green) {
      if ($(this).prop('checked')) {
        console.log("Green checked");

        message = new Paho.MQTT.Message('ON');
        message.destinationName = id + '/green_led';
        client.send(message);



        message = new Paho.MQTT.Message(`{"value":"ON","when":"${new Date().toLocaleString()}"}`);
        message.destinationName = id + '/retain_green';
        client.send(message);

        //client.publish(id + '/green_led', 'ON', { qos: 2 });
        //client.publish(id + '/retain_green', `{"value":"ON","when":"${new Date().toLocaleString()}"}`, { retain: true });
      } else {
        console.log("Unchecked");

        message = new Paho.MQTT.Message(`OFF`);
        message.destinationName = id + '/green_led';
        client.send(message);


        message = new Paho.MQTT.Message(`{"value":"OFF","when":"${new Date().toLocaleString()}"}`);
        message.destinationName = id + '/retain_green';
        client.send(message);

        //client.publish(id + '/green_led', 'OFF', { qos: 2 });
        //client.publish(id + '/retain_green', `{"value":"OFF","when":"${new Date().toLocaleString()}"}`, { retain: true });
      }
    }

  });
  $('#red').change(function () {
    if (!init_red) {
      if ($(this).prop('checked')) {
        console.log("RED checked");
        console.log(client)

        message = new Paho.MQTT.Message('ON');
        message.destinationName = id + '/red_led';
        client.send(message);


        //client.publish(id + '/retain_red', `{"value":"ON","when":"${new Date().toLocaleString()}"}`, { retain: true });
      } else {
        console.log("Unchecked");

        message = new Paho.MQTT.Message('OFF');
        message.destinationName = id + '/red_led';
        client.send(message);


        message = new Paho.MQTT.Message(`{"value":"OFF","when":"${new Date().toLocaleString()}"}`);
        message.destinationName = id + '/retain_red';
        client.send(message);

        //client.publish(id + '/red_led', 'OFF', { qos: 2 });
        //client.publish(id + '/retain_red', `{"value":"OFF","when":"${new Date().toLocaleString()}"}`, { retain: true });
      }
    }
  });
  $('#slider').change(function () {
    if (!init_slider) {
      $("#sliderval").html($(this).val());


      message = new Paho.MQTT.Message($(this).val());
      message.destinationName = id + '/servo';
      client.send(message);


      message = new Paho.MQTT.Message(`{"value":${$(this).val()},"when":"${new Date().toLocaleString()}"}`);
      message.destinationName = id + '/retain_servo';
      client.send(message);

      //client.publish(id + '/servo', $(this).val(), { qos: 2 });
      //client.publish(id + '/retain_servo', `{"value":${$(this).val()},"when":"${new Date().toLocaleString()}"}`, { retain: true });
    }
  });
  var data = {
    labels: [],
    datasets: [{
      fill: false,
      borderColor: '#2196f3', // Add custom color border (Line)
      backgroundColor: '#2196f3', // Add custom color background (Points and Fill)
      borderWidth: 1 // Specify bar border width
    }]
  }
  var chart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true, // Instruct chart js to respond nicely.
      maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
    }
  });
  let dp = [];
  let label = [];
  let i = 0;

  client.on('message', function (topic, msg) {

  });


});

function onConnectionLost(responseObject) {
  console.log('responseObject', responseObject)
}


function onMessageArrived(message) {

  //RETAINED TOPIC USED FOR INITLIZATING DASHBOARD

  var topic = message.destinationName;
  var msg = message.payloadString;

  if (topic == id + '/retain_green') {
    console.log(msg.toString());
    let obj = JSON.parse(msg.toString());
    $('#update_green').text(obj.when);
    if (obj.value == 'ON' && $('#green').prop('checked') == false) {
      init_green = true;
      $('#green').click();
      init_green = false;
    }
  }
  if (topic == id + '/retain_red') {
    let obj = JSON.parse(msg.toString());
    $('#update_red').text(obj.when);
    if (obj.value == 'ON' && $('#red').prop('checked') == false) {
      init_red = true;
      $('#red').click();
      init_red = false;
    }
  }
  if (topic == id + '/retain_servo') {
    let obj = JSON.parse(msg.toString());
    $('#update_slider').text(obj.when);

    init_slider = true;
    $("#sliderval").html(obj.value);
    $('#slider').val(obj.value);
    init_slider = false;
  }

  if (topic == id + '/nodemcu') {
    let obj = JSON.parse(msg.toString());

    //UPDATE GAUGE
    document.getElementById('canvas').setAttribute("data-value", obj.ldr);
    //UPDATE LINE CHART
    label.push(new Date().toLocaleString().split(',')[1]);
    dp.push(obj.dist);
    i = dp.length;
    if (i > 5) {
      dp.shift();
      label.shift();
      i--;
    }
    data.labels = label;
    data.datasets[0].label = new Date().toLocaleString().split(',')[0];
    data.datasets[0].data = dp;
    //console.log(dp);
    chart.update();
  }
  if (topic == id + '/turnoff_client' && msg.toString() == 'ok') {
    client.unsubscribe([id + '/nodemcu', id + '/red_time', id + '/green_time', id + '/servo_time', id + '/nodemcu_time', id + '/retain_green', id + '/retain_red', id + '/retain_servo', id + '/turnoff_client'], function (err) {
      if (err) {
        console.log("Mqtt err: " + err);
      } else {
        console.log("UNSUBSCRIBED EVERY TOPIC from client");

        client.end();
      }
    });
  }
  console.log('topic', topic)
  if (topic == id + '/red_time') {
    console.log(msg.toString())
    $('#update_red').text(msg.toString());
  }
  else if (topic == id + '/green_time') {
    $('#update_green').text(msg.toString());
  }
  else if (topic == id + '/servo_time') {
    $('#update_slider').text(msg.toString());
  }
  else if (topic == id + '/nodemcu_time') {
    $('#update_gauge').text(msg.toString());
  }
}

function startDisconnect() {
  client.disconnect();
  console.log('Disconnected')
}
