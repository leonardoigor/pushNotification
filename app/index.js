
const exp = require("express");
const app = exp();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;
var amqp = require('amqplib/callback_api');


// static files
app.use(exp.static(__dirname + "/public"));

// connect to kibana


app.get('/status', (req, res) => {
    res.send({ status: "OK" });
})

app.get('/s', (req, res) => {

    amqp.connect('amqp://rabbitmq', function (error0, connection) {

        if (error0) {
            console.log(error0);
        }
        connection.createChannel(function (error1, channel) {
            var queue = 'hello';
            var msg = 'Hello world' + Date.now();

            channel.assertQueue(queue, {
                durable: false
            });

            channel.sendToQueue(queue, Buffer.from(msg));
        })
    })
    res.send({ status: "OK" });
})



http.listen(PORT, () => {
    console.log("server started at port " + PORT);


    io.on("connection", (socket) => {
        console.log(`user connected id: ${socket.id}`);

        amqp.connect('amqp://rabbitmq', function (error0, connection) {

            if (error0) {
                console.log(error0);
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    console.log(error1);
                }
                var queue = 'hello';



                channel.assertQueue(queue, {
                    durable: false
                });

                channel.consume(queue, function (msg) {
                    console.log(" [x] Received %s", msg.content.toString());

                    socket.emit("message", msg.content.toString());
                    channel.ack(msg);
                }, {
                    noAck: false
                });
                socket.on("disconnect", () => {
                    console.log(`user disconnected id: ${socket.id}`);
                    channel.close();
                });
            });

        });

    })

})