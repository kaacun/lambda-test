var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config/aws.json');
var config = require('./config/config.json');

var sqs = new AWS.SQS();
var sqs_params = {
  QueueUrl: config.queue_url
};
sqs.receiveMessage(sqs_params, function(err, data) {
  if (err) console.log(err, err.stack);

  var msg = data.Messages.shift();
  var params = JSON.parse(msg.Body);
  var width = params.width;
  var height = params.height;
  var url = params.url;
  var reciept_handle = msg.ReceiptHandle;

  console.log(width);
  console.log(height);
  console.log(url);
  console.log(reciept_handle);
});
