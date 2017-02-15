var express = require('express');
var app = express();

app.use(express.static('views'));
app.use(express.static(__dirname + '/public'));

app.listen(3000, function() {
  console.log('color app listening on port 3000!');
})
