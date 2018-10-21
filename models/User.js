  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var userShema = mongoose.Schema({
  nombre: String,
  apellido: String,
  edad: Number,
  correo: String,
  clave: String,
  provider:String,
  infoProvider: Object
},{collection:'user'});
var user = mongoose.model('user', userShema);

module.exports= user;