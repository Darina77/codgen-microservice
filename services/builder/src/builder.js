const kafka = require('kafka-node');
const { exec } = require('child_process');
const fs = require("fs");
(async () => {
  const kafkaClientOptions = {
    sessionTimeout: 100,
    spinDelay: 100,
    retries: 2
  };
  const kafkaClient = new kafka.Client(process.env.KAFKA_ZOOKEEPER_CONNECT, 'consumer-client', kafkaClientOptions);

  const topics = [{
    topic: "build"
  }];

  const options = {
    autoCommit: true,
    fetchMaxWaitMs: 10,
    fetchMaxBytes: 1024 * 1024,
    encoding: "buffer"
  };

  const kafkaConsumer = new kafka.HighLevelConsumer(kafkaClient, topics, options);

  kafkaConsumer.on('message', function (message) {
    console.log('Message received:', message);
    var buf = new Buffer.from(message.value, "buffer");
    var decodedShema = JSON.parse(buf.toString());
    console.log('Decoded Shema:', decodedShema);

  exec(`pio init -d ${decodedShema.path} --board ${decodedShema.platform} && pio run -d ${decodedShema.path}`, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        console.log(stderr);
        return;
      }
      console.log(stdout);
    });
  });


  kafkaClient.on('error', (error) => console.error('Kafka client error:', error));
  kafkaConsumer.on('error', (error) => console.error('Kafka consumer error:', error));
})();