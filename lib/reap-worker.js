/**
 * Created by igor on 17/04/15.
 */

//Statics
var filePattern = /\.json$/;
var fs = require('graceful-fs');
var mdlPath = require('path');
var ONE_DAY = 24 * 60 * 60;

//passed arguments
var path = process.argv[2];
var ttl = process.argv[3] || 3600;

if (path){
    console.log("[session-file-store Worker] Deleting expired sessions");
    reap();
} else{
    console.log ("[session-file-store Worker] Reap worker started with invalid path");
    process.exit(0);
}


function reap(){
    var files;
    try {
        files = fs.readdirSync (path);
        files = files.filter(function (file) {
            return filePattern.exec(file);
        });
    } catch (err) {
        console.log ("[session-file-store Worker] Reap worker started with invalid path");
        process.exit(0);
    }

    for (var i = 0; i < files.length; i++) {
        // get the session id from filename
        destroyIfExpired(files[i].substring(0, files[i].lastIndexOf('.json')));
    }
    process.exit(0);
}

function destroyIfExpired(sessionId) {
    var isExpired = expired(sessionId);
    if (isExpired != null && isExpired) {
        console.log ("[session-file-store Worker] Deleting session " + sessionId);
        fs.unlinkSync(mdlPath.join(this.path, sessionId + '.json'));
    }
}

function expired (sessionId){
    var now = new Date().getTime();
    var data = fs.readFileSync(mdlPath.join(path, sessionId + '.json'), 'utf8')
    try {
        var json = JSON.parse(data);
        var maxAge = json.cookie.maxAge;
        ttl = ttl * 1000 || ('number' == typeof maxAge
            ? maxAge | 0
            : ONE_DAY);
        return json.__lastAccess + ttl < now;
    } catch (err) {
        return null;
    }
}