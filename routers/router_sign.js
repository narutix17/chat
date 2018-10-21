var express= require('express');
var router= express.Router();
var passport = require('passport');
var User = require('../models/User.js');

router.post('/', function(req, res){
  console.log('------attemptLogin-----');
  console.log(req.body);
  console.log(req.session.id);
  console.log(req.session);
	User.findOne({ correo: req.body.email ,clave:req.body.password }, function (err, user) {
	  if (err) return handleError(err);
	  if (user) {
	  	req.session.idUsuario=user._id;
	  	req.session.save(function (err) {
	  		return handleError(err);
	  	});
	  	console.log(req.session);
	  	res.redirect('/');	
	  }
	  else{
	  	res.redirect('/');
	  	console.log('no se encontro el usuario con las credenciales dadas');
	  }
	});
});

router.get('/logout',function (req,res) {
	console.log('------attemptLogout--------------');
	req.session.idUsuario=null;
	req.session.save(function (err) {
		if (err) {
			return handleError(err);	
		}
		else{
			res.redirect('/');
		}
		
	});

});


router.post('/loginPassport',passport.authenticate('local', { successRedirect: '/',failureRedirect: '/' }));
router.get('/logoutPassport',function (req,res) {
	req.logout();
	res.redirect('/');
});



router.get('/auth/facebook', passport.authenticate('facebook',{ scope: ['email']}));
router.get('/auth/facebook/callback',passport.authenticate('facebook', { successRedirect: '/',failureRedirect: '/', successFlash:'Inicio de session exitoso', failureFlash:'Inicio de session fallido' }));


router.get('/auth/google',passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','profile','email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/',successFlash:'Inicio de session exitoso', failureFlash:'Inicio de session fallido' }),function(req, res) {
    res.redirect('/');
});

module.exports = router;
