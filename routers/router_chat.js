var express= require('express');
var router= express.Router();
var User = require('../models/User.js');

router.get('/', function(req, res){
  console.log('----------------[chat---------------');
  console.log(req.session);
  //req.session.usuario2='dario';
  /*
  User.findOne({ _id:req.session.idUsuario }, function (err, user) {
		  console.log('idUsuario'+req.session.idUsuario);
		  if (err){
		  	console.log(err);
		  	return handleError(err);
		  } 
		  	
		  // Prints "Space Ghost is a talk show host".
		  if (user) {
		  	usuario=user;
		  	console.log(usuario);
		  	res.render('chatGeneral',{user:usuario});
		  }
		  else{
		  	res.render('home',{user:usuario});
		  	console.log('no se encontro el usuario con las credenciales dadas');
		  }
		});
	*/
	if (req.user) {
		res.render('chatGeneral',{user:req.user});
	}
	else{
		res.redirect('/');
	}
});


module.exports = router;
