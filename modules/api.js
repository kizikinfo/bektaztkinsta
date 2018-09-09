var toktattim = 1;
var Client = require('instagram-private-api').V1;
var Promise = require('bluebird');
var _ = require('underscore');
var fs = require('fs');
const Account = require('../models/account');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'Gpmt38U9';



var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var mailMsg;
var transport = nodemailer.createTransport(smtpTransport({
    service: 'Mailgun',
    auth: {
        user: 'postmaster@sandbox8856113c4d5547de826322422eb42c71.mailgun.org', 
        pass: '57b76f1dda132b416852faea6f96a489'
    }
}));


var dataLs = {};
var followingFeed, userFollowersFeed, session, myId, 
apiPassedTime, sinceVerySTime, identifier;
var ceil = 6500, floor = 3000, oneDay = 86400;

var distortion = 7, moment = 63, mainLimit = 800; //for old accounts
//var distortion = 68, moment = 189, mainLimit = 300; //for new accounts



function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


function modifyLs(key, value){
	dataLs[key] = value;
	fs.writeFileSync(__dirname+'/../users/'+identifier+'_ls.json', JSON.stringify(dataLs), 'utf8'); 
}

function getFromLs(){
	return JSON.parse(fs.readFileSync(__dirname+'/../users/'+identifier+'_ls.json', {encoding: 'utf-8'}));
}

function howMuchTimePassed(key){
	dataLs = getFromLs();
	var currentTime = new Date().getTime();
	return Math.round(Math.abs((currentTime - dataLs[key])/1000));
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


function sendEmail(err, numbr){
    mailMsg = identifier+', '+numbr+': '+err;
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Beka from smartbot" oldtop2017@gmail.com',
        to: 'olx.400@mail.ru', 
        subject: 'Ooops!',
        text: mailMsg
    };

    // send mail with defined transport object
    transport.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
        console.log(identifier+', Message sent '+numbr);
    });
}



//tekseru uwin
//start('beka_20175609', '234418125', '4857289995');

module.exports = function(identf){
	identifier = identf;
	//console.log('here: '+identifier);
	session = new Client.Session(new Client.Device(identifier), new Client.CookieFileStorage(__dirname + '/../users/'+identifier+'_qk.json'));
	console.log('men orndaldm');
	start();
}




function start(){
    session.getAccount().then(function(account) {		
		Account.findOne({ati: identifier}, function(err, obj) { 
	        if(err) console.log(identifier+', '+err);
			if(obj.running){  
				fs.exists(__dirname+'/../users/'+identifier+'_qk.json', function(cexists) {
					if (cexists) { 
						fs.readFile(__dirname+'/../users/'+identifier+'_qk.json', function(err, data){
							if(err) console.log(identifier+', '+err);
							obj.params.followingCount = account.params.followingCount;
							obj.params.followerCount = account.params.followerCount;
							obj.tattisi = encrypt(data);
							obj.save(function (err) {
						        if(err) console.log(identifier+', '+err); 
								startHelper(obj);
						    });
						});
					}else{
			            fs.writeFile(__dirname + '/../users/'+identifier+'_qk.json', decrypt(obj.tattisi), function(err) {
						    if(err) console.log(identifier+', '+err);
							startHelper(obj);
						}); 			
					} 
				});			
			} 	
		});
	})
}

function startHelper(obj){
	myId = obj.ls.iUserId;//'4143261143';
	followingFeed = new Client.Feed.AccountFollowing(session, myId);

	fs.exists(__dirname+'/../users/'+identifier+'_ls.json', function(exists) { 
		if (!exists){
			//console.log('no file');
			dataLs = {
				sc: obj.ls.sc || 0,
				ucursor: obj.ls.ucursor || '',
				cursor: obj.ls.cursor || '',
				direction: obj.ls.direction || '',
				startTime: obj.ls.startTime || new Date().getTime(),
				iUserId: obj.ls.iUserId,
				apiStartTime: obj.ls.apiStartTime,
				apiCounter: obj.ls.apiCounter,
				veryStartTime: obj.ls.veryStartTime,
				myPersonalLimit: obj.ls.myPersonalLimit,
				index: obj.ls.index || 0
			};
			fs.writeFileSync(__dirname+'/../users/'+identifier+'_ls.json', JSON.stringify(dataLs), 'utf8'); 
		}else{
			//console.log('file');
			/*for(var m in obj.ls){
            	dataLs[m] = obj.ls[m];
            }*/
            //fs.writeFileSync(__dirname+'/../users/'+identifier+'_ls.json', JSON.stringify(dataLs), 'utf8');
            modifyLs('myPersonalLimit', obj.ls.myPersonalLimit); 
            modifyLs('sc', obj.ls.sc);
            modifyLs('apiStartTime', obj.ls.apiStartTime);
            modifyLs('apiCounter', obj.ls.apiCounter); 
            modifyLs('startTime', obj.ls.startTime);
            modifyLs('veryStartTime', obj.ls.veryStartTime);
            modifyLs('index', obj.ls.index);
            modifyLs('cursor', obj.ls.cursor);
            modifyLs('ucursor', obj.ls.ucursor);
            modifyLs('direction', obj.ls.direction);
		}
		defineDirectionAndRun(); 
	}); 
}



function defineDirectionAndRun(){
	dataLs = getFromLs();
	Account.findOne({ati: identifier}, function(err, obj) { 
        if(err) console.log(identifier+', '+err);
		modifyLs('counter', obj.params.followingCount);
		if(dataLs.direction){
			console.log(identifier+', direction: '+dataLs.direction);
			if(dataLs.direction === 'up'){
				searchByLocation();
			}else{
				unFollow();
			}
		}else{
			console.log(identifier+', direction doesnt exist');
			if(ceil>obj.params.followingCount){
				console.log(identifier+', ceil > followingCount searchByLocation called');
				searchByLocation();
			}else{
				console.log(identifier+', ceil <= followingCount unfollow called');
				unFollow();
			}
		}

	});
}




function unFollow(){
	dataLs = getFromLs();	
	modifyLs('direction', 'down');

	if(dataLs.apiCounter<=490){	
		dataLs.apiCounter++;
		modifyLs('apiCounter', dataLs.apiCounter);	
		unFollowHelper();
	}else{
		apiPassedTime = howMuchTimePassed('apiStartTime');
		if(apiPassedTime>=3600){
			console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
			modifyLs('apiCounter', 0);
			modifyLs('apiStartTime', new Date().getTime());
			unFollowHelper();
		}else{
			console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
			setTimeout(function(){
				modifyLs('apiCounter', 0);
				modifyLs('apiStartTime', new Date().getTime());
				unFollowHelper();
			}, (3600-apiPassedTime)*1000);
		}
	}
}

function unFollowHelper(){

	dataLs = getFromLs();
	followingFeed.setCursor(dataLs.ucursor || '');

	followingFeed.get().then(function(f){
		console.log(identifier+', media length: '+f.length+', isMoreAvailable: '+followingFeed.isMoreAvailable());
		//for(var i = 0; i<f.length; i++){
			//console.log(f[i]._params.username);			
		//}
		modifyLs('ucursor', followingFeed.getCursor());
		Account.findOne({ati: identifier}, function(err, obj) { 
	        if(err) console.log(identifier+', '+err);
			obj.ls.ucursor = followingFeed.getCursor();
			obj.save(function(e){
				if(e) console.log(identifier+', '+e);
			});
		});	
		unfollowIt(f, f.length-1);
	}).catch(function(e){
		console.log(identifier+', unFollowHelper: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ unFollowHelper(); }, 300000);
		}else if(e.toString()==='PrivateUserError: User is private and you are not authorized to view his content!' || e.toString()==="TypeError: Cannot read property 'params' of undefined"){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ETIMEDOUT')!==-1){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: read ECONNRESET')!==-1){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ECONNREFUSED')!==-1){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: socket hang up')!==-1){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString()==="NotFoundError: Page wasn't found!"){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
			setTimeout(function(){ unFollowHelper(); }, 2000);
		}else{
			sendEmail(identifier, e, 'unFollowHelper');
		}
	});
}

function unfollowIt(ar, i){
	dataLs = getFromLs();
	sinceVerySTime = howMuchTimePassed('veryStartTime');
	if(sinceVerySTime>=dataLs.myPersonalLimit){
		sendEmail(dataLs.myPersonalLimit+' seconds expired', '');
		Account.findOne({ati: identifier}, function(err, obj) { 
	        if(err) console.log(identifier+', '+err);
			obj.ls.veryStartTime = new Date().getTime();
			obj.save(function(e){
				if(e) console.log(identifier+', '+e);
			});
		});
	}else{	
		if(dataLs.sc>=mainLimit){	
			var sinceStarted = howMuchTimePassed('startTime');
			if(sinceStarted>=oneDay){
				console.log(identifier+', sc reached '+mainLimit+', sinceStarted: '+sinceStarted+', start called at once');			
				modifyLs('sc', 0);
				modifyLs('startTime', new Date().getTime());
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.sc = 0;
					obj.ls.startTime = new Date().getTime();
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				start();
			}else{
				var shouldWait = oneDay - sinceStarted;
				console.log(identifier+', sc reached '+mainLimit+', sinceStarted: '+sinceStarted+', shouldWait: '+shouldWait);
				setTimeout(function(){
					modifyLs('sc', 0);
					modifyLs('startTime', new Date().getTime());
					Account.findOne({ati: identifier}, function(err, obj) { 
				        if(err) console.log(identifier+', '+err);
						obj.ls.sc = 0;
						obj.ls.startTime = new Date().getTime();
						obj.save(function(e){
							if(e) console.log(identifier+', '+e);
						});
					});
					start();
				}, shouldWait*1000);
			}	
		}else if(dataLs.counter<=floor){	
			console.log(identifier+', switching to location seeeeeeeeeeeeeeeeeeeeearch');
			searchByLocation();
		}else{
			if(i<0){
				if(followingFeed.isMoreAvailable()){
					console.log(identifier+', end of array');
					unFollow();
				}else{
					console.log(identifier+', end of all media');
					modifyLs('ucursor', '');
					Account.findOne({ati: identifier}, function(err, obj) { 
				        if(err) console.log(identifier+', '+err);
						obj.ls.ucursor = '';
						obj.save(function(e){
							if(e) console.log(identifier+', '+e);
						});
					});	
					console.log(identifier+', switching to location seeeeeeeeeeeeeeeeeeeeearch');
					searchByLocation();
				}
			}else{
				unfollowItHelper(ar, dataLs, i);		    
			}
		}
	}
}

function unfollowItHelper(ar, dataLs, i){
	if(toktattim===1){
		console.log('-------------------------------------------------------------\n'+identifier+', opened user with index: '+i+' and username: '+ar[i]._params.username);			
		var passedTime = howMuchTimePassed('clickTime') || 0;
		var randomNumber = Math.floor((Math.random() * distortion) + moment);
		if(passedTime>=randomNumber){
			console.log(identifier+', passedTime: '+passedTime+', randomNumber: '+randomNumber+', unfollow done at once');
			clickUnfollow(0, dataLs, ar, i);
		}else{
			var waitTime = (randomNumber - passedTime)*1000;
			console.log(identifier+', passedTime: '+passedTime+', randomNumber: '+randomNumber+', waitTime: '+waitTime/1000);
			clickUnfollow(waitTime, dataLs, ar, i);
		}
	}else{
		console.log('toktattim');
	}
}

function clickUnfollow(waitTime, dataLs, ar, i){
	setTimeout(function(){
		if(dataLs.apiCounter<=490){	
			dataLs.apiCounter++;
			modifyLs('apiCounter', dataLs.apiCounter);	
			clickUnfollowHelper(dataLs, ar, i);
		}else{
			apiPassedTime = howMuchTimePassed('apiStartTime');
			if(apiPassedTime>=3600){
				console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
				modifyLs('apiCounter', 0);
				modifyLs('apiStartTime', new Date().getTime());
				clickUnfollowHelper(dataLs, ar, i);
			}else{
				console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
				setTimeout(function(){
					modifyLs('apiCounter', 0);
					modifyLs('apiStartTime', new Date().getTime());
					clickUnfollowHelper(dataLs, ar, i);
				}, (3600-apiPassedTime)*1000);
			}
		}
	}, waitTime);
}

function clickUnfollowHelper(dataLs, ar, i){
	new Client.Relationship.destroy(session, ar[i]._params.id).then(function(data){
		modifyLs('clickTime', new Date().getTime());
	    dataLs.counter--;
	    modifyLs('counter', dataLs.counter);
	    dataLs.sc++;
	    modifyLs('sc', dataLs.sc);		    
		console.log(identifier+', unfolloweed, dataLs: '+JSON.stringify(dataLs));
		Account.findOne({ati: identifier}, function(err, obj) { 
            if(err) console.log(identifier+', '+err);
            obj.ls.sc = dataLs.sc;
			obj.ls.direction = dataLs.direction;
			obj.ls.startTime = dataLs.startTime;
			obj.ls.apiStartTime = dataLs.apiStartTime;
			obj.ls.apiCounter = dataLs.apiCounter;
            obj.save(function(err){
                if(err) console.log(identifier+', '+err);
            });
        });
	    i--;
	    unfollowIt(ar, i);
	}).catch(function(e){
		console.log(identifier+', clickUnfollowHelper: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ unfollowIt(ar,i); }, 300000);
		}else if(e.toString()==='PrivateUserError: User is private and you are not authorized to view his content!' || e.toString()==="TypeError: Cannot read property 'params' of undefined"){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ETIMEDOUT')!==-1){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: read ECONNRESET')!==-1){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ECONNREFUSED')!==-1){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString().indexOf('RequestError: Error: socket hang up')!==-1){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString()==="NotFoundError: Page wasn't found!"){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
			setTimeout(function(){ i--; unfollowIt(ar,i); }, 2000);
		}else{
			sendEmail(identifier, e, 'clickUnfollowHelper');
		}
	});
}



function searchByLocation(){
	Account.findOne({ati: identifier}, function(err, obj) { 
        if(err) console.log(identifier+', '+err);
		modifyLs('direction', 'up');
		console.log('-------------------------------------------------------------\n'+identifier+', opening user in array: '+obj.arr[dataLs.index].username+' with index: '+dataLs.index);	
		userFollowersFeed = new Client.Feed.AccountFollowers(session, obj.arr[dataLs.index].id);
		if(dataLs.apiCounter<=490){	
			dataLs.apiCounter++;
			modifyLs('apiCounter', dataLs.apiCounter);			
			searchByLocationHelper();
		}else{
			apiPassedTime = howMuchTimePassed('apiStartTime');
			if(apiPassedTime>=3600){
				console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
				modifyLs('apiCounter', 0);
				modifyLs('apiStartTime', new Date().getTime());				
				searchByLocationHelper();
			}else{
				console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
				setTimeout(function(){
					modifyLs('apiCounter', 0);
					modifyLs('apiStartTime', new Date().getTime());					
					searchByLocationHelper();
				}, (3600-apiPassedTime)*1000);
			}
		}	
	});
}

function searchByLocationHelper(){
	dataLs = getFromLs();
	userFollowersFeed.setCursor(dataLs.cursor);
	userFollowersFeed.get().then(function(f){
		console.log(identifier+', media length: '+f.length+', isMoreAvailable: '+userFollowersFeed.isMoreAvailable());
		modifyLs('cursor', userFollowersFeed.getCursor());	
		Account.findOne({ati: identifier}, function(err, obj) { 
	        if(err) console.log(identifier+', '+err);
			obj.ls.cursor = userFollowersFeed.getCursor();
			obj.save(function(e){
				if(e) console.log(identifier+', '+e);
			});
		});
		/*for(var t=0; t<5; t++){
			console.log(f[t].params.username);
		}
		setTimeout(function(){searchByLocationHelper()}, 2000);*/
		f = shuffle(f);
		userFollowingArray(f, f.length-1);	
	}).catch(function(e){
		console.log(identifier+', searchByLocationHelper: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ searchByLocation(); }, 300000);
		}else if(e.toString()==='PrivateUserError: User is private and you are not authorized to view his content!' || e.toString()==="TypeError: Cannot read property 'params' of undefined"){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation(); 
			}, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ETIMEDOUT')!==-1){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation();  
			}, 2000);
		}else if(e.toString().indexOf('RequestError: Error: read ECONNRESET')!==-1){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation();  
			}, 2000);
		}else if(e.toString().indexOf('RequestError: Error: connect ECONNREFUSED')!==-1){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation();  
			}, 2000);
		}else if(e.toString().indexOf('RequestError: Error: socket hang up')!==-1){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation();  
			}, 2000);
		}else if(e.toString()==="NotFoundError: Page wasn't found!"){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation(); 
			}, 2000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
			setTimeout(function(){ 
				dataLs.index++;
				modifyLs('index', dataLs.index);
				modifyLs('cursor', '');
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.index = dataLs.index;
					obj.ls.cursor = '';
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				searchByLocation();  
			}, 2000);
		}else{
			sendEmail(identifier, e, 'searchByLocationHelper');
		}
	});
}

function userFollowingArray(ar, i){
	dataLs = getFromLs();
	sinceVerySTime = howMuchTimePassed('veryStartTime');
	if(sinceVerySTime>=dataLs.myPersonalLimit){
		sendEmail(dataLs.myPersonalLimit+' seconds expired', '');
		Account.findOne({ati: identifier}, function(err, obj) { 
	        if(err) console.log(identifier+', '+err);
			obj.ls.veryStartTime = new Date().getTime();
			obj.save(function(e){
				if(e) console.log(identifier+', '+e);
			});
		});
	}else{		
		if(dataLs.sc>=mainLimit){
			var sinceStarted = howMuchTimePassed('startTime');
			if(sinceStarted>=oneDay){
				console.log(identifier+', sc reached '+mainLimit+', sinceStarted: '+sinceStarted+', start called at once');			
				modifyLs('sc', 0);
				modifyLs('startTime', new Date().getTime());
				Account.findOne({ati: identifier}, function(err, obj) { 
			        if(err) console.log(identifier+', '+err);
					obj.ls.sc = 0;
					obj.ls.startTime = new Date().getTime();
					obj.save(function(e){
						if(e) console.log(identifier+', '+e);
					});
				});
				start();
			}else{
				var shouldWait = oneDay - sinceStarted;
				console.log(identifier+', sc reached '+mainLimit+', sinceStarted: '+sinceStarted+', shouldWait: '+shouldWait);
				setTimeout(function(){
					modifyLs('sc', 0);
					modifyLs('startTime', new Date().getTime());
					Account.findOne({ati: identifier}, function(err, obj) { 
				        if(err) console.log(identifier+', '+err);
						obj.ls.sc = 0;
						obj.ls.startTime = new Date().getTime();
						obj.save(function(e){
							if(e) console.log(identifier+', '+e);
						});
					});
					start();
				}, shouldWait*1000);
			}		
		}else if(dataLs.counter>=ceil){
			console.log(identifier+', switching to unfolloooooooooooooooooooooow');
			unFollow(myId);
		}else{
			if(i<0){
				if(userFollowersFeed.isMoreAvailable()){			    	
					console.log(identifier+', end of user followers array');
					searchByLocationHelper();
				}else{
					console.log(identifier+", end of user followers' all media");
					dataLs.index++;
					modifyLs('index', dataLs.index);
					modifyLs('cursor', '');
					Account.findOne({ati: identifier}, function(err, obj) { 
				        if(err) console.log(identifier+', '+err);
						obj.ls.index = dataLs.index;
						obj.ls.cursor = '';
						obj.save(function(e){
							if(e) console.log(identifier+', '+e);
						});
					});
					searchByLocation();
				}
			}else{
				if(!ar[i].params.isPrivate){
					doSmg(ar, i);
					//setTimeout(function(){ console.log(ar[i].params.username); i--;	userFollowingArray(ar, i); }, 2000);
				}else{
					setTimeout(function(){ i--;	userFollowingArray(ar, i); }, 2000);
				}
			}
		}

	}
}

function doSmg(ar, i){
	if(toktattim===1){
		dataLs = getFromLs();

		new Client.Account.getById(session, ar[i].params.id).then(function(account){
			console.log('username: '+account.params.username);
			var reg = /(\+\d{1,2})|(\-\d{2}\-)|(\d{3}\-)|(\d{3}\))|(\d{5})|(sex)|(секс)|(whatsapp)|(ватцап)|(извращен)|(смеш.*видео)|(видео.*смеш)|(юмор.*видео)|(видео.*юмор)|(реклам)|(увеличение продаж)|(живые подписчики)|(18+)|(живая аудитория)|(\P{L}тел\.)/igm;
			var reg2 = /(.kz)|(.ru)|(video)|(_kz)/igm;
			var descText = account.params.biography.toString().replace(/ +/g, "").toLowerCase();
			if(reg2.test(account.params.username)){
				console.log('reklama');
				setTimeout(function(){ i--;	userFollowingArray(ar, i); }, 2000);
			}else{			
				if(reg.test(descText)){
					console.log('reklama');
					setTimeout(function(){ i--;	userFollowingArray(ar, i); }, 2000);
				}else{
					if(dataLs.apiCounter<=490){	
						dataLs.apiCounter++;
						modifyLs('apiCounter', dataLs.apiCounter);	
						doSmgHelper2(ar, i, dataLs);
					}else{
						apiPassedTime = howMuchTimePassed('apiStartTime');
						if(apiPassedTime>=3600){
							console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
							modifyLs('apiCounter', 0);
							modifyLs('apiStartTime', new Date().getTime());
							doSmgHelper2(ar, i, dataLs);
						}else{
							console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
							setTimeout(function(){
								modifyLs('apiCounter', 0);
								modifyLs('apiStartTime', new Date().getTime());
								doSmgHelper2(ar, i, dataLs);
							}, (3600-apiPassedTime)*1000);
						}
					}
				}
			}
		}).catch(function(e){
			console.log(identifier+', doSmg: '+e);
			if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
				setTimeout(function(){ userFollowingArray(ar, i); }, 300000);
			}else if(e.toString()==="NotFoundError: Page wasn't found!"){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
			}else if(e.toString()==='ParseError: Not possible to parse API response'){
					setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
			}else{
				sendEmail(identifier, e, 'doSmg');
			}
		});
	}else{
		console.log('totattim');
	}
}


function doSmgHelper2(ar, i, dataLs){
	new Client.Relationship.get(session, ar[i].params.id).then(function(account){
    	if(!account._params.following){
    		var pTime = howMuchTimePassed('clickTime') || 0;
			var rNumber = Math.floor((Math.random() * distortion) + moment);
			if(pTime>=rNumber){
				console.log(identifier+', pTime: '+pTime+', rNumber: '+rNumber+', follow done at once');				
	    		if(dataLs.apiCounter<=490){	
					dataLs.apiCounter++;
					modifyLs('apiCounter', dataLs.apiCounter);	
					likeIt(ar, i, 0);
				}else{
					apiPassedTime = howMuchTimePassed('apiStartTime');
					if(apiPassedTime>=3600){
						console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
						modifyLs('apiCounter', 0);
						modifyLs('apiStartTime', new Date().getTime());
						likeIt(ar, i, 0);
					}else{
						console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
						setTimeout(function(){
							modifyLs('apiCounter', 0);
							modifyLs('apiStartTime', new Date().getTime());
							likeIt(ar, i, 0);
						}, (3600-apiPassedTime)*1000);
					}
				}
			}else{
				var wTime = (rNumber - pTime)*1000;
				console.log(identifier+', pTime: '+pTime+', rNumber: '+rNumber+', wTime: '+wTime/1000);				
	    		if(dataLs.apiCounter<=490){	
					dataLs.apiCounter++;
					modifyLs('apiCounter', dataLs.apiCounter);	
					likeIt(ar, i, wTime);
				}else{
					apiPassedTime = howMuchTimePassed('apiStartTime');
					if(apiPassedTime>=3600){
						console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
						modifyLs('apiCounter', 0);
						modifyLs('apiStartTime', new Date().getTime());
						likeIt(ar, i, wTime);
					}else{
						console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
						setTimeout(function(){
							modifyLs('apiCounter', 0);
							modifyLs('apiStartTime', new Date().getTime());
							likeIt(ar, i, wTime);
						}, (3600-apiPassedTime)*1000);
					}
				}
			}
    	}else{
    		setTimeout(function(){ i--;	userFollowingArray(ar, i); }, 2000);
    	}
    }).catch(function(e){
		console.log(identifier+', doSmgHelper2: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ userFollowingArray(ar, i); }, 300000);
		}else if(e.toString()==="NotFoundError: Page wasn't found!"){
			setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
		}else{
			sendEmail(identifier, e, 'doSmgHelper2');
			//setTimeout(function(){ i--; followIt(ar,i,identifier); }, 2000);
		}
	});
}


function likeIt(ar, i, wTime){
	dataLs = getFromLs();
	setTimeout(function(){			
		new Client.Feed.UserMedia(session, ar[i].params.id).get().then(function(p){
			if(dataLs.apiCounter<=490){	
				dataLs.apiCounter++;
				modifyLs('apiCounter', dataLs.apiCounter);
				(p.length===0) ? iFollow(ar, i) : likeItHelper(p[0].params.id, dataLs, ar, i);			
			}else{
				apiPassedTime = howMuchTimePassed('apiStartTime');
				if(apiPassedTime>=3600){
					console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
					modifyLs('apiCounter', 0);
					modifyLs('apiStartTime', new Date().getTime());
					(p.length===0) ? iFollow(ar, i) : likeItHelper(p[0].params.id, dataLs, ar, i);	
				}else{
					console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
					setTimeout(function(){
						modifyLs('apiCounter', 0);
						modifyLs('apiStartTime', new Date().getTime());
						(p.length===0) ? iFollow(ar, i) : likeItHelper(p[0].params.id, dataLs, ar, i);	
					}, (3600-apiPassedTime)*1000);
				}
			}
		}).catch(function(e){
			console.log(identifier+', likeIt: '+e);
			if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
				setTimeout(function(){ userFollowingArray(ar, i); }, 300000);
			}else if(e.toString()==='PrivateUserError: User is private and you are not authorized to view his content!' || e.toString()==="TypeError: Cannot read property 'params' of undefined"){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
			}else if(e.toString().indexOf('connect ETIMEDOUT')!==-1){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
			}else if(e.toString()==='ParseError: Not possible to parse API response'){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
			}else{
				sendEmail(identifier, e, 'likeIt');
			}
		});
	}, wTime);	
}


function likeItHelper(id, dataLs, ar, i){
	new Client.Like.create(session, id).then(function(h){
		if(dataLs.apiCounter<=490){	
			dataLs.apiCounter++;
			modifyLs('apiCounter', dataLs.apiCounter);					
			iFollow(ar, i);
		}else{
			apiPassedTime = howMuchTimePassed('apiStartTime');
			if(apiPassedTime>=3600){
				console.log('apiPassedTime > 1 hour, apiCounter zeroed at once');
				modifyLs('apiCounter', 0);
				modifyLs('apiStartTime', new Date().getTime());
				iFollow(ar, i);
			}else{
				console.log('should wait: '+(3600-apiPassedTime)+', then apiCounter will be zeroed');
				setTimeout(function(){
					modifyLs('apiCounter', 0);
					modifyLs('apiStartTime', new Date().getTime());
					iFollow(ar, i);
				}, (3600-apiPassedTime)*1000);
			}
		}
	}).catch(function(e){		
		console.log(identifier+', likeItHelper: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ userFollowingArray(ar, i); }, 300000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
		}else{
			sendEmail(identifier, e, 'likeItHelper');
		}
	});
}


function iFollow(ar, i){
	dataLs = getFromLs();
	new Client.Relationship.create(session, ar[i].params.id).then(function(account){
		modifyLs('clickTime', new Date().getTime());
	    dataLs.counter++;		    
	    modifyLs('counter', dataLs.counter);
	    dataLs.sc++;
	    modifyLs('sc', dataLs.sc);		    
		console.log(identifier+', likeed and followed, dataLs: '+JSON.stringify(dataLs));
		Account.findOne({ati: identifier}, function(err, obj) { 
            if(err) console.log(identifier+', '+err);
            obj.ls.sc = dataLs.sc;
			obj.ls.direction = dataLs.direction;
			obj.ls.startTime = dataLs.startTime;
			obj.ls.apiStartTime = dataLs.apiStartTime;
			obj.ls.apiCounter = dataLs.apiCounter;
            obj.save(function(err){
                if(err) console.log(identifier+', '+err);
            });
        });
		i--;
		userFollowingArray(ar, i);
    }).catch(function(e){
		console.log(identifier+', iFollow: '+e);
		if(e.toString()==='RequestsLimitError: You just made too many request to instagram API'){			
			setTimeout(function(){ userFollowingArray(ar, i); }, 300000);
		}else if(e.toString()==='ParseError: Not possible to parse API response'){
				setTimeout(function(){ i--; userFollowingArray(ar, i); }, 2000);
		}else{
			sendEmail(identifier, e, 'iFollow');
		}
	});
}

