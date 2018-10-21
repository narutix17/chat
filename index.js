//Recursos
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var router_chat=require('./routers/router_chat');
var router_sign=require('./routers/router_sign');
var router_api=require('./routers/router_api');
var bodyParser= require('body-parser');
var session=require('express-session');
var mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy, FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var flash = require('connect-flash');
//mongodb://rdsuarez:rdsuarez@ds037205.mlab.com:37205/simplenodechatdatabase
mongoose.connect('mongodb://localhost/prueba');
var User = require('./models/User.js');
//const MongoClient = require('mongodb').MongoClient;
//const url = 'mongodb://localhost:27017';

//--------------------variables globales--------------
var mensajes=[];

// Database Name
//const dbName = 'prueba';

//--------------------Configuracion--------------------
//recordar que el orden en el que se usa los middlewares son importantes me lo demostro el use de la session que no guardaba en la base de datos por no haber usado primero 
/*
Session
lo unico que se guarda en el navegador es una coockie puedes acceder y ver las coockies de tu app en el developer de google chrome y en la opccion de applications en storage.
las coockies se guardan en el navegador la primera vez que se accede a el servicio ya que el use osea el middleware lo hace desde el principio cuando se realiza la primera peticion.
Lo que se hace es que este middleware le manda en la primera peticion la informacion de la coockie como el id y la clave. la clave viaja encriptada y solo eso es lo que se peude ver en la coockie.
estas credenciales los que haran en lo posterior sera como digamos autenticar esta coockie y de esa manera poder acceder a la informacion de ella desde el servidor.
puedes acceder a la informacion de la session a traves de req.session la cual puedes meterle la info que tu quieras en este objeto session. algunos campos ya vienen predeterminados como la expiracion etc.
por default la informacion que puedas guardar de la session utilizara la memoria del servidor osea la de tu maquina especificamente la ram. Tu puedes utilizar cualquier store para que no use esta memoria sino una base de datos y asi tengas las sessiones bien organizadas en la base de datos.
otra opcion que deberas configurar es el maxage que es cuanto esa coockie durara desde el momento que se instancia. a partir del maxage se calcula de manera predeterminada el campo expire  todo esto ya lo podras ver en la base de datos. si configuras el maxage la session se renovara cada vez que cierres el explorador.
las opciones que por ley tienes que configuar son resave y saveUniialized yo las puse en true.
para guardar algun cambio que hagas en los campos de la session(req.session) debes luego utilizar el metodo req.session.save(fun(err){if(err){return err}else{lo que quieras o si no nada}})
para obtener dinamicamente el id de la session se lo puede hacer de dos maneras req.session.id y la otra no me acuerdo creo que viendo en la base de datos saco el campo del id, si no me equivoco es idSession O NO SE.
con la session que esata een el navegador es la que se trabaja la cual se autentica cada vez que se hace peticion al servidor y se puede extraer la info de la base de datos. aqui en esta session puedes poner lo que quieras yo use req.session.idUsuario. para poder mantenre a los usuarios qeu se me logueen.

socket.io
instanciar la libreria en el cliente se lo puede hacer mandandole opciones como el query que es para pasar algun parametro osea para que ese socket setearle un parametro y ya quede con ese parametro y asi las veces qeu se reciba o se identifique este socket en el servidor se puede acceder a este campo.
en el servidor puedes usar handshake mientras qeu en el cliente no simplemente sacas de una todo.
algo importante que hice es que pude mandaar a traves del evento de conexion del cliente un parametro como el nombre de usuario que se conecto osea puedes mandar algun objeto a traves de un campo query y recibirlo en el servidor como socket.handshake.query.[objetoquemandaste]
esto anterior quiere decir que el socket que se instancia en el evento es el socket que se crea por el cliente con la informacion del cliente de aki a traves del hanshake puedes sacar muchas cosas como el query,ip etc entre otras. y por lo tanto esta instancia de socket es la comunicacion entre el servidor y ese cliente por lo tanto si utilizo socket.emit en el servidor es porque solo le emito a ese cliente y viceversa tambien mientras que si utlizo io.emit estoy haciendo un broadcast osea a todos los sockets les emito.

*/
app.set('port',process.env.PORT || 3000);
app.use('/static',express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
	secret:'chat',
	 cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    },
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//Passport strategy
//la estrategia es la primera cosa que se hace una vez llamado el authenticate en el route o direccionamiento y es la forma en la que se autentica esto lo puedes modular a tu forma dependiendo tambien de la estrategia que escojas en este caso la estrategia es passport-local que me permite traer el username y password desde el route post cuando haces loguin. nota: los argumentos username y password se los puede cambiar a otros nombres lee la documentacion.
//passport local
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ correo: username, clave:password }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      /*
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      */
      return done(null, user);
    });
  }
));
//passport strategy facebook
passport.use(new FacebookStrategy({
    clientID: "172509846447409",
    clientSecret: "81a1918608f5b271ff9f81cec1d0e0e0",
    callbackURL: "http://localhost:3000/sign/auth/facebook/callback",
    profileFields: ["name","email","birthday","gender"],
  },
  function(accessToken, refreshToken, profile, done) {
  	console.log('---autenticacion con facebook----');
  	console.log(profile);
    
    User.findOne({
        'infoProvider.id': profile.id 
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        //No user was found... so create a new user with values from Facebook (all the profile. stuff)
        if (!user) {
        	console.log('no existe este usuario en la base de datos');
            user = new User({
                nombre: profile.name.givenName,
                apellido:profile.name.familyName,
                correo: profile.emails[0].value,
                provider: profile.provider,
                infoProvider: profile._json
                });
                //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
            user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
            });
        } else {
            //found user. Return
            return done(err, user);
        }
    });
  }
));


// passport strategy Google
passport.use(new GoogleStrategy({
    clientID: '75241405786-2rihdtqdeos6sf0t0grm4b67f6stotfh.apps.googleusercontent.com',
    clientSecret: '5CXAaR2-utNK1EB8qz_1tHHT',
    callbackURL: "http://localhost:3000/sign/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('---autenticacion con Google----');
    console.log(profile);
    
    User.findOne({
        'infoProvider.id': profile.id 
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        //No user was found... so create a new user with values from Facebook (all the profile. stuff)
        if (!user) {
          console.log('no existe este usuario en la base de datos');
            user = new User({
                nombre: profile.name.givenName,
                apellido:profile.name.familyName,
                correo: profile.emails[0].value,
                provider: profile.provider,
                infoProvider: profile._json
                });
                //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
            user.save(function(err) {

                if (err) console.log(err);
                return done(err, user);
            });
        } else {
            //found user. Return
            return done(err, user);
        }
    });
  }
));


app.use('/chat', router_chat);
app.use('/sign', router_sign);
app.use('/api', router_api);
app.set('view engine', 'ejs');
app.set('views', './views');

// esto se puede poner antes o despues de el authenticate que se hace en la estrategia.
//esto es lo que se va a guardar en la informacion de la session en la base de datos especificamente lo guarda como user:[object id del usuario] este usuario te lo entrega la autenticacion osea primero es passport.authenticate y luego el callback validator llama a done y ese donde es como que le dice sigamos con lo siguiente en ese done se manda al usuario. 
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
//esto supongo que es lo que se carga en el objeto req.user cada vez que se hace una peticion al servidor posterior al authenticado del usuario ya no se authentica si no que se busca directo en la base de datos.
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//---------------Direccionamiento----------------
var countSession=0;
/*
app.get('/',function (req,res) {
	console.log('-------HOME--------');
	console.log(req.session);
	var usuario;
	// esto es practicamente la desserializacion que se hace en passport lo que hace es obtener el id del usuario autenticado en la session y buscarlo directo en la base de datos. la deserializacion es una fase posterior o digamos un ciclo que siempre se hace despues de la autenticacion.
	if (req.session.idUsuario) {
		User.findOne({ _id:req.session.idUsuario }, function (err, user) {
		  console.log('idUsuario'+req.session.idUsuario);
		  if (err){
		  	console.log(err);
		  	return handleError(err);
		  } 
		  	
		  if (user) {
		  	usuario=user;
		  	console.log(usuario);
		  	res.render('home',{user:usuario});
		  }
		  else{
		  	res.render('home',{user:usuario});
		  	console.log('no se encontro el usuario con las credenciales dadas');
		  }
		});
	}
	else{
		res.render('home');
	}
});
*/

app.get('/',function (req,res) {
	if (req.user) {
		console.log(req.session.id);
		console.log(req.user);
    var flash=req.flash();
    if (Object.keys(flash).length === 0 && flash.constructor === Object) {
      console.log('hola');
      res.render('home',{user:req.user});
    }
    else{
      res.render('home',{user:req.user,flash:flash});
    }
		
	}
	else{
		res.render('home');
	}
	
});

// ------------Socket.io-------------
io.on('connection', function(socket){
  //var address = socket.handshake.address;
  /*
  console.log(socket.id);
  io.clients((error, clients) => {
	  if (error) throw error;
	  console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
	});
  */
  console.log(`${socket.id} se ha conectado`);
  console.log(`${socket.handshake.query.nombreUsuario} se ha conectado`);
  var mensaje={};
  mensaje.id=socket.id;
  mensaje.nombreUsuario=socket.handshake.query.nombreUsuario;
  mensaje.ip=socket.handshake.address;
  mensaje.conected=true;
  mensaje.msg='';
  mensajes.push(mensaje);
  //mensajes.push(`${socket.handshake.address} se ha conectado`);
  io.emit('mensajes', mensajes);
  //io.emit('nuevaConexion',mensajes);
  socket.on('mensaje client', function(msg){
  	var mensaje={};
	mensaje.id=this.id;
	mensaje.ip=this.handshake.address;
	mensaje.nombreUsuario=socket.handshake.query.nombreUsuario;
	mensaje.conected=true;
	mensaje.msg=msg;
  	console.log(`el cliente ${mensaje.id} dice: ${mensaje.msg}`);
  	mensajes.push(mensaje);
    io.emit('mensajes', mensajes);
  });

  
  socket.on('disconnect', function(){
  	var mensaje={};
	mensaje.id=socket.id;
	mensaje.ip=socket.handshake.address;
	mensaje.conected=false;
	mensaje.msg='';
	mensajes.push(mensaje);
    io.emit('mensajes', mensajes);
    console.log('user disconnected');
  });
});



// Server setiado para escuchar en puerto
http.listen(app.get('port'), function(){
  console.log('listening on *:3000');
});

