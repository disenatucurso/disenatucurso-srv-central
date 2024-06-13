import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import database from './bdat/database.mjs';
import fs from 'fs';
import constantes from './constantes.mjs';

//FUNCIONES AUXILIARES
// Función para generar un hash de una contraseña
async function hashPassword(password) {
    try{
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }
    catch(error){
        throw error;
    }
}
// Función para comparar una contraseña con su hash
async function comparePassword(password, hash) {
    try{
        return await bcrypt.compare(password, hash);
    }
    catch(error){
        throw error;
    }
}
// Funcion para generar un password aleatorio de 10 caracteres
function generarPassword(){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    //console.log(`Password Generado: ${password}`);
    return password;
}
// Funcion para enviar el password del usuario
function enviarEmail(asunto,body,destinatario) {
    return new Promise((resolve, reject) => {
        // Configurar el transporte
        let remitente='disenatucurso@gmail.com';
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: remitente, // Tu correo electrónico de Gmail
                pass: 'aqoregcqeensnbjd' // Tu contraseña de Gmail
            }
            
        });
        // Configurar el mensaje
        const mailOptions = {
            from: remitente, // Remitente
            to: destinatario, // Destinatario(s)
            subject: asunto,
            html: body
        };
        // Enviar el correo electrónico
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(info.response);
            }
        });
    });
}
// Función que valida en que escenario de subir curso estoy
async function validarMetadataCurso(objCurso,username){
    try{
        if (objCurso.idGlobal === null) {
            return {
                escenario:"NUEVO_CURSO",
                versionCurso:null
            }
        }
        else {
            //Obtengo el curso con idCurso=idGlobal para conocer su creador
            let resCurso = await database.getCurso(objCurso.idGlobal);
            if(resCurso.username === username){
                if(resCurso.version == objCurso.versionGlobal){
                    return {
                        escenario:"ACTUALIZAR_CURSO",
                        versionCurso:resCurso.version
                    }
                }
                throw new Error('Número de versión incorrecto');
            }
            else{
                return {
                    escenario:"NUEVO_CURSO_YAEXISTE",
                    versionCurso:resCurso.version
                }
            }
        }
    }
    catch(error){
        throw error;
    }
}
// Escribe/sobreescribe archivo curso
function guardarArchivoCurso(objCurso){
    try {
        let idCurso=objCurso.idGlobal;
        let filePath = constantes.RUTA_FS_CURSO(idCurso);
        // Convertir el objeto JavaScript a una cadena JSON
        const jsonString = JSON.stringify(objCurso, null, 2);
        // Escribir la cadena JSON en un archivo de forma sincrónica
        fs.writeFileSync(filePath, jsonString);
        return filePath;
    }
    catch (error) {
        throw error;
    }
}
// Actualiza la metadata de objCurso
function actualizarMetadataCurso(objCurso,idCurso,version,username){
    try{
        //Actualizo/agrego Autor
        const arrayAutores = objCurso.autores;
        let ultAutor = arrayAutores[arrayAutores.length - 1];
        if(ultAutor.username === null){
            ultAutor.username = username;
            ultAutor.institucion = constantes.SERVER_URL;
        }
        //Actualizo metadata versionGlobal,idGlobal
        objCurso.versionGlobal=version;
        objCurso.idGlobal=idCurso;
        objCurso.institucion=constantes.SERVER_URL;
        //Actualizo referencia interna
        const arrayRefInt = objCurso.referencias.internas;
        let ultRefInt = arrayRefInt[arrayRefInt.length - 1];
        if(ultRefInt !== undefined){
            if(ultRefInt.idGlobal == idCurso
                && ultRefInt.username == username
                && ultRefInt.institucion == constantes.SERVER_URL
            ){
                ultRefInt.versionGlobal=version;
            }
            else{
                objCurso.referencias.internas.push(
                    {
                        idGlobal:idCurso,
                        versionGlobal:version,
                        username:username,
                        institucion:constantes.SERVER_URL
                    }
                );
            }
        }
        else{
            objCurso.referencias.internas.push(
                {
                    idGlobal:idCurso,
                    versionGlobal:version,
                    username:username,
                    institucion:constantes.SERVER_URL
                }
            );
        }
        return ultAutor.nombre;
    }
    catch(error){
        throw error;
    }
}
// Devuelve base64 de curso
function leerArchivo(rutaFS) {
    try {
        // Leer el contenido del archivo JSON de forma asíncrona
        const jsonString = fs.readFileSync(rutaFS, 'utf8');
        const base64String = Buffer.from(jsonString, 'utf8').toString('base64');
        // Devolver el b64
        return base64String;
    }
    catch (error) {
        throw error;
    }
}
// Devuelve base64 de schema
function leerArchivoSchema(idSchema){
    try{
        let filePath = constantes.RUTA_FS_SCHEMA(idSchema);
        return leerArchivo(filePath);
    }
    catch(error){
        throw error;
    }
}

export default { hashPassword
    ,comparePassword
    ,generarPassword
    ,enviarEmail
    ,validarMetadataCurso
    ,guardarArchivoCurso
    ,leerArchivo
    ,leerArchivoSchema
    ,actualizarMetadataCurso
};