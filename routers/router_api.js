var express= require('express');
var router= express.Router();
var User = require('../models/User.js');
var fs = require('fs');

router.get('/', function(req, res){
  console.log('-------API get:localhost:3000/api/----------');
  //res.status(200).json({nombre:'ruben',apelldio:'suarez'});
    fs.readFile('./demo.json', 'utf8', function (err, data) {
        if (err) throw err;
        obj = JSON.parse(data);
        console.log(obj);
        res.status(200).json(obj);

    });
    //res.status(200).json([[{variable:'Temperaturax',placeholder:'typea'},{variable:'Precipitacion',placeholder:'typea en precipitacion'}],[{variable:'Presion',placeholder:'medida en hpA'},{variable:'VelocidadViento',placeholder:'typea en m/s'}]]);
});

router.get('/usuarios', function(req, res){
    console.log('-------API get:localhost:3000/api/usuarios----------');
    User.find({},function (err,usuarios) {
        if(err){
            console.log(err);
            res.status(404).send('error base de datos');
        }
        else{
            res.status(200).json(usuarios);
        }
        
    });
  
  });


module.exports = router;