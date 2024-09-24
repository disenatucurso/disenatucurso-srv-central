import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import seguridad from './seguridad.mjs';
import database from './bdat/database.mjs';
import constantes from './constantes.mjs';
import util from './util.mjs';

const app = express();
// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(express.json({charset: 'utf-8' }));

//URLS PÚBLICAS
//Login
app.post('/login', async (req, res, next) => {
    try{
        const { username, password } = req.body;
        // Verificar si el usuario existe y la contraseña es correcta
        const { passwordMatch, superadmin } = await database.loginUsuario(username,password);
        if(passwordMatch){
            const userInfo = {
                username: username,
                superadmin: superadmin
            };
            const token = jsonwebtoken.sign(userInfo, constantes.ENCRYPT_KEY(), { expiresIn: '1h' });
            res.json({ token });
        }
        else{
            const error = new Error('Invalid username or password');
            error.status = 401;
            next(error);
        }
    }
    catch(error){
        next(error);
    }
        
});
//Forgot Password
app.post('/forgotPass', async (req, res, next) => {
    try{
        const { username } = req.body;
        let usrObj = await database.getUsuario(username);
        await database.newUserPassword(usrObj);
        res.status(200).send();
    }
    catch(error){
        next(error);
    }
});
//Obtener Nombre Institucion
app.get('/institucion', async (req, res, next) => {
    try{
        res.json({ nombre:constantes.NOMBRE_INSTITUCION });
    }
    catch (error) {
        next(error);
    }
});
//Bajar B64 de Curso
app.get('/bajarCurso', async (req, res, next) => {
    try{
        const idCurso = req.query.idCurso;
        let bdatCurso = await database.getCurso(idCurso);
        if (bdatCurso.ruta && bdatCurso.ruta !== null) {
            let base64String = util.leerArchivo(bdatCurso.ruta);
            res.json({idCurso:bdatCurso.id,version:bdatCurso.version,base64:base64String});
        }
        else{
            throw new Error('Curso no encontrado o sin ruta');
        }
    }
    catch (error) {
        next(error);
    }
});
//Lista información de Cursos almacenados en Serv. Central
app.get('/listarCursos', seguridad.autentico, async (req, res, next) => {
    try{
        let vuelta = [];
        const criterio = req.query.criterio;
        let listCursos = await database.listCursos(criterio,req.user);
        for (let i = 0; i < listCursos.length; i++) {
            let curso = listCursos[i];
            //let base64String = util.leerArchivo(curso.ruta);
            vuelta.push({
                idCurso:curso.id
                ,version:curso.version
                //,base64:base64String
                ,nombreUsuario:curso.nombreusuario
                ,nombreCurso:curso.nombrecurso
                ,username:curso.username
            })
        }
        res.json(vuelta);
    }
    catch (error) {
        next(error);
    }
});
//Bajar B64 de Schema
app.get('/bajarSchema', async (req, res, next) => {
    try{
        const idSchema = req.query.schemaVersion;
        let base64String = util.leerArchivoSchema(idSchema);
        res.json({schemaVersion:idSchema,base64:base64String});
    }
    catch (error) {
        next(error);
    }
});

//URLS CON AUTENTICACIÓN: Solo usuarios logueados
//Registrar incidencia
app.post('/nuevaIncidencia', seguridad.autentico, async(req, res, next) => {
    try{
        const { titulo, descripcion,categoria } = req.body;
        let resultado = await database.newIncidencia(req.user.username,titulo, descripcion,categoria);
        await util.enviarEmail('Nueva incidencia reportada'
            , `<p>Usuario:${req.user.username}</p><p>Id incidencia:${resultado}</p><p>Titulo: ${titulo}</p><p>Descripcion: ${descripcion}</p><p>Categoria: ${categoria}</p>`
            , 'disenatucurso@gmail.com'
        );
        res.json({idIncidencia:resultado});
    }
    catch(error){
        next(error);
    }
});
//Guarda B64 de Curso
app.post('/subirCurso', seguridad.autentico, async(req, res, next) => {
    try{
        const { base64 } = req.body;
        // Decodificar la cadena base64 en datos binarios
        const jsonString = Buffer.from(base64, 'base64').toString('utf8');
        // Parsear la cadena JSON a un objeto JavaScript
        const objCurso = JSON.parse(jsonString);

        let username=req.user.username;
        let validacion = await util.validarMetadataCurso(objCurso,username);
        let respNewCurso = null;
        if(validacion.escenario=='NUEVO_CURSO' || validacion.escenario=='NUEVO_CURSO_YAEXISTE'){
            //Creo registro en BDAT
            //console.log(objCurso)
            respNewCurso = await database.newCurso(objCurso.nombreCurso,username);
        }
        else{
            //escenario=='ACTUALIZAR_CURSO'
            //Incremento version
            respNewCurso={
                id:validacion.idCurso,
                version:validacion.versionCurso+1,
                nombreCurso:objCurso.nombreCurso
            }
        }
        //Actualizo objeto Curso
        let nombreAutor = util.actualizarMetadataCurso(objCurso,respNewCurso.id,respNewCurso.version,username);
        //Actualizo nombre de usuario - OPCIONAL
        database.updateUserNombre(nombreAutor,username);
        //Grabo objeto Curso en FileSystem
        let rutaFS=util.guardarArchivoCurso(objCurso,respNewCurso.id);
        //Actualizo rutaFS en BDAT
        let respUpdateCurso = await database.updateCurso(respNewCurso.id,rutaFS,respNewCurso.version,respNewCurso.nombreCurso);
        
        let stringCurso = JSON.stringify(objCurso, null, 2);
        //const cursoB64 = btoa(stringCurso); // Convertir el JSON a base64
        const base64String = btoa(unescape(encodeURIComponent(stringCurso)));

        res.json({
            idCurso:respUpdateCurso.id
            ,version:respUpdateCurso.version
            ,base64:base64String
        });
    }
    catch(error){
        next(error);
    }
});
//Change Password
app.post('/cambiarPass', seguridad.autentico, async(req, res, next) => {
    try{
        const { oldPass, newPass } = req.body;
        //Checkeo password anterior
        const { passwordMatch, superadmin } = await database.loginUsuario(req.user.username,oldPass);
        if(passwordMatch){
            await database.updateUserPassword(req.user.username,newPass);
            res.status(200).send();
        }
        else{
            const error = new Error('Password anterior no es correcto');
            error.status = 500;
            next(error);
        }
    }
    catch(error){
        next(error);
    }
});
//URLS CON AUTORIZACIÓN: Solo usuario superadmin
//Registra Usuarios en el sistema
app.post('/registrar', seguridad.autorizo, async (req, res,next) => {
    try{
        for (const elem of req.body) {
            //console.log(`Username: ${elem.username}, Email: ${elem.email}`);
            try{
                await database.getUsuario(elem.username);
                elem.creado = false;
            }
            catch(error){
                //Usuario no existe o explotó la base
                try{
                    await database.newUsuario(elem.username,elem.email);
                    elem.creado = true;
                }
                catch(err){
                    console.log("Error al hacer database.newUsuario()");
                    console.log(err);
                    elem.creado = false;
                }
            }
        }
        res.json(req.body);
    }
    catch(error){
        next(error);
    }
});

export default app;
