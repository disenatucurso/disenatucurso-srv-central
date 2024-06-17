import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import seguridad from './seguridad.mjs';
import database from './bdat/database.mjs';
import constantes from './constantes.mjs';
import util from './util.mjs';

const app = express();
// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(express.json());

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
app.get('/listarCursos', async (req, res, next) => {
    try{
        let vuelta = [];
        const criterio = req.query.criterio;
        let listCursos = await database.listCursos(criterio);
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
        const binaryData = Buffer.from(base64, 'base64');
        // Convertir los datos binarios a objeto JavaScript si representan un JSON serializado
        const objCurso = JSON.parse(binaryData.toString('utf8'));

        let username=req.user.username;
        let respValidacion = await util.validarMetadataCurso(objCurso,username);
        let escenario=respValidacion.escenario;
        let respNewCurso = null;
        if(escenario=='NUEVO_CURSO' || escenario=='NUEVO_CURSO_YAEXISTE'){
            //Creo registro en BDAT
            respNewCurso = await database.newCurso(objCurso.nombreCurso,username);
        }
        else{
            //escenario=='ACTUALIZAR_CURSO'
            //Incremento version
            respNewCurso={
                id:objCurso.idGlobal,
                version:objCurso.versionGlobal+1,
                nombreCurso:objCurso.nombreCurso
            }
        }
        //Actualizo objeto Curso
        util.actualizarMetadataCurso(objCurso,respNewCurso.id,respNewCurso.version,username);
        //Actualizo nombre de usuario - OPCIONAL
        database.updateUserNombre(objCurso.versiones[objCurso.versiones.length - 1].autor,username);
        //Grabo objeto Curso en FileSystem
        let rutaFS=util.guardarArchivoCurso(objCurso);
        //Actualizo rutaFS en BDAT
        let respUpdateCurso = await database.updateCurso(respNewCurso.id,rutaFS,respNewCurso.version,respNewCurso.nombreCurso);
        
        const base64String = Buffer.from(JSON.stringify(objCurso, null, 2), 'utf8').toString('base64');

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
