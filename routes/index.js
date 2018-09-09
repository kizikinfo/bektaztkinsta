const express = require('express');
const passport = require('passport');
const Account = require('../models/account');
const router = express.Router(); 
var api = require('../modules/api');
var Client = require('instagram-private-api').V1;
var fs = require('fs');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'Gpmt38U9';
var closeSite = false;

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

function howMuchTimePassed(key, identifier){
    lsData = getFromLs(identifier);
    var currentTime = new Date().getTime();
    return Math.round(Math.abs((currentTime - lsData[key])/1000));
}

/*
function sendEmail(identifier, err, numbr){
    mailMsg = identifier+', '+numbr+': '+err;
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Beka from smartbot" oldtop2017@gmail.com',
        to: 'olx.400@mail.ru', 
        subject: 'Assalaumagaleikum!',
        text: mailMsg
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
        console.log(identifier+', Message sent '+numbr+'!');
    });
}
*/


router.get('/', (req, res) => {
    closeSite ? res.send({"st":"ok"}) : res.render('index', { user : req.user });
});


//////////////////register///////////////////////////
router.get('/register', (req, res) => {
    closeSite ? res.send({"st":"ok"}) : res.render('register', { });
});

router.post('/register', (req, res, next) => {
    Account.register(new Account({ username : req.body.username }), req.body.password, (err, account) => {
        if (err) {
          return res.render('register', { error : err.message });
        }

        passport.authenticate('local')(req, res, () => {
            req.session.save((err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/profile/'+req.body.username);
            });
        });
    });
});



///////////////////////////login//////////////////////////
router.get('/login', (req, res) => {
    closeSite ? res.send({"st":"ok"}) : res.render('login', { user : req.user, error : req.flash('error')});      
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), (req, res, next) => {
    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        //console.log('uuuserrrr: '+JSON.stringify(req.body.username));
        res.redirect('/profile/'+req.body.username);
    });
});

router.get('/profile/:p', (req, res) => {
    if(req.session.passport.user){
        Account.findOne({username: req.user.username}, function(err, obj) { 
                if(err) console.log(req.user.username+', '+err);
                if (obj.ati) { 
                    fs.exists(__dirname+'/../users/'+obj.ati+'_qk.json', function(cexists) { 
                        if (cexists) { 
                            var session = new Client.Session(new Client.Device(obj.ati), new Client.CookieFileStorage(__dirname + '/../users/'+obj.ati+'_qk.json'));
                            session.getAccount().then(function(account) {
                                obj.ls.apiCounter++;
                                obj.params.picture = account.params.picture;
                                obj.params.followerCount = account.params.followerCount;
                                obj.params.followingCount = account.params.followingCount;
                                obj.ls.iUserId = account.params.id;
                                obj.save(function (err) {
                                    if(err) console.log(req.user.username+', '+err); 
                                    if(obj.botStatus){
                                        //console.log('1');
                                        res.render('addIt', { instaAccount: obj.params, user: req.user.username, status: 'running', ati: obj.ati });
                                    }else{                                                                
                                        //console.log('2');                      
                                        res.render('addIt', { instaAccount: obj.params, user: req.user.username, ati: obj.ati });  
                                    }
                                });
                            }).catch(function(e){
                                console.log(req.user.username+', 12: '+e);
                                //sendEmail(req.user.username, e, '12');
                            }).error(function(e) {
                                console.log(req.user.username+ ', 12: '+e);
                            }); 
                        }else{
                            fs.writeFile(__dirname + '/../users/'+obj.ati+'_qk.json', decrypt(obj.tattisi), function(err) {
                                if(err) console.log(req.user.username+', '+err);                       
                                var session = new Client.Session(new Client.Device(obj.ati), new Client.CookieFileStorage(__dirname + '/../users/'+obj.ati+'_qk.json'));
                                session.getAccount().then(function(account) {
                                    obj.ls.apiCounter++;
                                    obj.params.picture = account.params.picture;
                                    obj.params.followerCount = account.params.followerCount;
                                    obj.params.followingCount = account.params.followingCount;
                                    obj.ls.iUserId = account.params.id;  
                                    obj.save(function (err) {
                                        if(err) console.log(req.user.username+', '+err); 
                                        if(obj.botStatus){
                                            //console.log('3'); 
                                            res.render('addIt', { instaAccount: obj.params, user: req.user.username, status: 'running', ati: obj.ati });
                                        }else{
                                            //console.log('4');                            
                                            res.render('addIt', { instaAccount: obj.params, user: req.user.username, ati: obj.ati });  
                                        }
                                    });
                                }).catch(function(e){
                                    console.log(req.user.username+', 13: '+e);
                                    //sendEmail(req.user.username, e, '13');
                                }).error(function(e) {
                                    console.log(req.user.username+ ', 13: '+e);
                                });  
                            });         
                        } 
                    });                  
                }else{                                     
                    if(!obj.ls.veryStartTime){
                        obj.ls.veryStartTime = new Date().getTime();
                        obj.save(function(err){
                            if(err) console.log(req.user.username+', '+err);
                        });
                    }           
                    res.render('addIt', { instaAccount:{}, user: req.user.username, validate:{} });                  
                } 
        });
    }else{
        res.redirect('/');
    }
});


////////////////////////addacount///////////////////////

router.post('/addaccount', function(req, res){ 
    //Client.Request.setProxy('http://138.68.242.184:3128');
    Client.Session.create(new Client.Device(req.body.instaLogin), new Client.CookieFileStorage(__dirname + '/../users/'+req.body.instaLogin+'_qk.json'), req.body.instaLogin, req.body.instaPassword)
    .then(function(session) {
        Account.findOne({username: req.user.username}, function(err, obj) { 
            if(err) console.log(identifier+', '+err);
            obj.ls.apiStartTime =  new Date().getTime();
            obj.ls.apiCounter = 2;
            obj.ls.myPersonalLimit = 1728000;
            obj.running = true;
            obj.ls.index = 0;
            obj.save(function(err){
                if(err) console.log(req.user.username+', '+err);
            });
        });
        fs.readFile(__dirname + '/../users/'+req.body.instaLogin+'_qk.json', 'utf-8', function(err, data){
            if(err) console.log(req.user.username+', '+err); 
            Account.findOneAndUpdate({username: req.user.username}, {$set:{ati:req.body.instaLogin, tattisi:encrypt(data)}}, {new: true}, function(err, doc){
                if(err) console.log(req.user.username+', '+err);                         
                res.redirect('/profile/'+req.user.username);
            });
        });
    }).catch(function(e){
        console.log(req.user.username+', 11: '+e);
        if(e.toString()==='CheckpointError: Instagram call checkpoint for this action!'){            
            Account.findOne({username: req.user.username}, function(err, obj) { 
                if(err) console.log(identifier+', '+err);
                obj.ls.apiStartTime =  new Date().getTime();
                obj.ls.apiCounter = 1;
                obj.save(function(err){
                    if(err) console.log(req.user.username+', '+err);
                });
            });
            fs.unlinkSync(__dirname + '/../users/'+req.body.instaLogin+'_qk.json');
            res.render('addIt', { instaAccount:{}, user: req.user.username, validate:{loginName: req.body.instaLogin, msg: true} });
        }else if(e.toString()==='AuthenticationError: The password you entered is incorrect. Please try again.'){
            res.render('addIt', { instaAccount:{}, user: req.user.username, validate:{authmsg: 'Неправильный пароль'} });
        }else if(e.toString().indexOf("AuthenticationError: The username you entered doesn't appear")!==-1){
            res.render('addIt', { instaAccount:{}, user: req.user.username, validate:{authmsg: 'Неправильный логин'} });
        }else{
            console.log(req.user.username+', 11: '+e);
            //sendEmail(req.user.username, e, '11'); 
        }
    }).error(function(e) {        
        console.log(req.user.username+', 11: '+e);
    });
});


//////////////////////////getlocation/////////////////////
router.post('/profile/:id/getlocation', function(req, res){      
    //console.log(JSON.stringify(req.body));
    var session = new Client.Session(new Client.Device(req.body.identifier), new Client.CookieFileStorage(__dirname + '/../users/'+req.body.identifier+'_qk.json'));
    Account.findOne({username: req.user.username}, function(err, obj) { 
        if(err) console.log(req.user.username+', '+err);
        new Client.Location.search(session, req.body.location).then(function(loc) {
            //console.log(loc); 
            obj.ls.apiCounter++;
            obj.save(function(err){
                if(err) console.log(req.user.username+', '+err);
            });             
            res.render('addIt', { instaAccount: obj.params, user: req.user.username, ar: loc, ati: obj.ati }); 
        }).catch(function(e){
            console.log(req.user.username+', 15: '+e);
            //sendEmail(req.user.username, e, '15');
        }).error(function(e) {
            console.log(req.user.username+ ', 15: '+e);
        });   
    });        
});

///////////////////////////startrobot/////////////////////////
router.post('/profile/:id/startrobot', function(req, res){       
    //console.log(JSON.stringify(req.body));
    var session = new Client.Session(new Client.Device(req.body.ident), new Client.CookieFileStorage(__dirname + '/../users/'+req.body.ident+'_qk.json'));  
    Account.findOne({username: req.user.username}, function(err, obj) { 
        if(err) console.log(req.user.username+', '+err); 
        var locationFeed = new Client.Feed.LocationMedia(session, req.body.locationId); 
        locationFeed.get().then(function(f){
            if(f.length>0){ 
                obj.botStatus = true;
                obj.ls.apiCounter++;
                obj.save(function (err) {
                    if(err) console.log(req.user.username+', '+err); 
                    api(req.body.ident);
                    res.redirect('/profile/'+req.user.username);
                }); 
            }else{
                obj.ls.apiCounter++;
                obj.save(function(err){
                    if(err) console.log(req.user.username+', '+err);
                }); 
                res.render('addIt', { instaAccount: obj.params, user: req.user.username, zeroLenth: 'К сожалению пользователей не найдено, введите другой город', ati: obj.ati }); 
            }
        }).catch(function(e){
            console.log(req.user.username+', 10: '+e);
            //sendEmail(req.user.username, e, '10');
        }).error(function(e) {
            console.log(req.user.username+', 10: '+e);
        });  
    });        
});

/////////////////////////changebot/////////////////////////
router.get('/profile/:id/changebot', function(req, res){
    if(req.session.passport.user){
        //console.log(req.user.username);
        Account.findOneAndUpdate({username: req.params.id}, {$set:{botStatus:false}}, {new: true}, function(err, doc){
            if(err) console.log(req.user.username+', '+err);                         
            res.redirect('/profile/'+req.user.username);
        });
    }else{
        res.redirect('/');
    }
});


////////////////////////logout///////////////////////////
router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

////////////////////////jjjjj/////////////////
router.get('/startPing', function(req, res){
    res.send({"st":"ok"});
});


router.get('/ping', (req, res) => {
    res.status(200).send("pong!");
});

module.exports = router;
