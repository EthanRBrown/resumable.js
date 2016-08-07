'use strict';

const koa = require('koa');
const route = require('koa-route');
const path = require('path');
const resumablejsTempDir = path.join(__dirname, 'var', 'resumablejs');
// make sure resumable.js ingest directory exists
require('mkdirp').sync(resumablejsTempDir);
const resumable = require('./resumable-node.js')(resumablejsTempDir);

app = koa();

// Host most stuff in the public folder
app.use(require('koa-logger')());
app.use(require('koa-static')(path.join(__dirname, 'public')));
app.use(require('koa-better-body')());


// Handle uploads through Resumable.js
app.use(route.post('/upload', function*(){
    const status = yield new Promise((resolve, reject) => {
        resumable.post(this.request.fields, this.request.files, function(status, filename, original_filename, identifier){
            console.log('POST', status, original_filename, identifier);
            resolve(status);
        })});
    this.body = status;
}));

// Handle status checks on chunks through Resumable.js
app.use(route.get('/upload', function*(){
    const status = yield new Promise((resolve, reject) =>
        resumable.get(this.request, function(status, filename, original_filename, identifier){
            console.log('GET', status);
            resolve(status);
        }));
    if(status !== 'found') this.status = 404;
    resolve(status);
}));

/*
app.get('/download/:identifier', function(req, res){
	resumable.write(req.params.identifier, res);
});
*/

app.use(route.get('/resumable.js', function*() {
  var fs = require('fs');
  this.type = "application/javascript";
  this.body = fs.createReadStream("../../../resumable.js");
}));

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('listening on port ' + port);
});
