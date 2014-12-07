var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config/sqs.json');
var config = require('./config/config.json');

var sqs = new AWS.SQS();
var sqsParams = {
  QueueUrl: config.sqs_url
};

// キューメッセージの取得
sqs.receiveMessage(sqsParams, function(err, data) {
  if (err) console.log(err, err.stack);

  var msg = data.Messages.shift();
  var params = JSON.parse(msg.Body);
  var recieptHandle = msg.ReceiptHandle;

  var http = require('http');
  var fs = require('fs');
  var outFile = fs.createWriteStream('./tmp/file.jpg');

  // 対象画像のダウンロード
  var req = http.get(params.url, function (res) {
    res.pipe(outFile);
    res.on('end', function () {
      outFile.close();
    }); 
  });
  req.on('error', function (err) {
    console.log('Error: ', err); return;
  });

  var easyimg = require('easyimage');
  
  var target = './tmp/file.jpg';
  var dist = './out/file.jpg';

  // リサイズ処理
  easyimg.resize({
    src:target,
    dst:dist,
    width:params.width,
    height:params.height
  }).then(
  function(image) {
    console.log('Resized ' + image.width + ' x ' + image.height);
  },
  function (err) {
    console.log(err);
  });

  // リサイズ画像読み込み
  var readableStream = fs.createReadStream(dist);
  readableStream.on('data', function(data) {
    AWS.config.loadFromPath('./config/s3.json');
    var config = require('./config/config.json');
    var s3 = new AWS.S3();
    var s3Params = {
      Bucket: config.s3_bucket,
      Key: params.width + '/' + params.height + '/file.jpg',
      Body: data
    };
    // サムネイルのS3アップロード
    s3.putObject(s3Params, function(err, data) {
      if (err) console.log(err, err.stack);
    });
  });
  readableStream.on('end', function() {
    console.log('upload finish');
  });

});
