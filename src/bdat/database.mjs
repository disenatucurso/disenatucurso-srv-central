import util from '../util.mjs';
import config from './config.mjs';
import constantes from '../constantes.mjs';

const client = config.conectarse();
//CONSULTAS EN BASE DE DATOS
async function loginUsuario(username,password){
    try {
        // Consulta SQL para buscar un usuario específico por su nombre de usuario
        const query = 'SELECT username, password, superadmin FROM usuario WHERE username = $1 AND habilitado = true';
        const values = [username]; // Valores a sustituir en la consulta ($1)

        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rows.length === 0) {
            return false;
        }

        let usuarioEncontrado = result.rows[0];
        let passwordMatch = await util.comparePassword(password,usuarioEncontrado.password);
        return {passwordMatch, superadmin: usuarioEncontrado.superadmin};
    }
    catch (error) {
        throw error;
    }
}
async function getUsuario(username){
    try {
        // Consulta SQL para buscar un usuario específico por su nombre de usuario
        const query = 'SELECT * FROM usuario WHERE username = $1';
        const values = [username]; // Valores a sustituir en la consulta ($1)

        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rows.length === 0) {
            throw new Error('RowCount incorrecto');
        }
        return result.rows[0];
    }
    catch (error) {
        throw error;
    }
}
async function newUsuario(username,email){
    try {
        let password = util.generarPassword();
        let hash = await util.hashPassword(password);
        const query = "INSERT INTO usuario (username,password,email,habilitado,superadmin) values ($1,$2,$3,true,false);";
        const values = [username,hash,email];
        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rowCount === 1) {
            try{
                //const response = 
                await util.enviarEmail('Diseña Tu Curso - Nuevo usuario online'
                    , `<p>Se le ha creado un usuario para el uso de los servicios en linea de Diseña Tu Curso - Servidor Central de la institución ${constantes.NOMBRE_INSTITUCION} - URL: <b>${constantes.SERVER_URL}</b></p>
                    <p>Usuario: ${username}</p>
                    <p>Password: ${password}</p>
                    <p>Para poder utilizar este servicio debe bajar la nueva versión del programa de los enlaces aquí debajo:</p>
                    <p><b><a href="https://drive.google.com/file/d/1_TMpI53oQ__N2I7ngLvlqUtHRHtBWoo1/view?usp=sharing">Windows</a></b></p>
                    <p><b><a href="https://drive.google.com/file/d/1svnv-biA7K6CqWw8zxWNLg62FlWUzo09/view?usp=sharing">Linux</a></b></p>
                    <p><b><a href="https://drive.google.com/file/d/1Bi_92ylPd84ZhRSJ_Rmqb545ZeoDXLV2/view?usp=sharing">Mac</a></b></p>
                    <p>Hemos creado un video tutorial para realizar la actualización que puede ver <b><a href="https://youtu.be/fjIunIuzjSQ">AQUÍ</a></b></p>
                    <p>Adicionalmente, hemos actualizado los enlaces en el sitio de presentación del proyecto <b><a href="https://disenatucurso.noreste.udelar.edu.uy/">AQUÍ</a></b></p>
                    </br>
                    <p>Cualquier consulta o asistencia con este proceso, no dude en escribirnos a <a href="mailto:disenatucurso@gmail.com">disenatucurso@gmail.com</a></p>`
                    , email
                );
                //console.log(`Password enviado al email: ${email}`);
                //console.log(response);
            }
            catch(error){
                console.log(`No se pudo enviar password al email: ${email}`);
                console.log(error);
            }
        }
        else{
            throw new Error('RowCount incorrecto');
        }
    }
    catch (error) {
        throw error;
    }
}
async function newUserPassword(usrObj){
    try {
        let password = util.generarPassword();
        await updateUserPassword(usrObj.username,password);
        try{
            //const response = 
            await util.enviarEmail('Diseña Tu Curso - Recuperación de contraseña'
                , `<p>Se ha restablecido su contraseña para utilizar los servicios en linea de Diseña Tu Curso - Servidor Central.</p><p>Usuario: ${usrObj.username}</p><p>Password: ${password}</p></br><p>Este es un correo automático, no responda.</p>`
                , usrObj.email
            );
            //console.log(`Password enviado al email: ${usrObj.email}`);
            //console.log(response);
        }
        catch(error){
            throw error;
        }
    }
    catch (error) {
        throw error;
    }
}
async function updateUserPassword(username,newPass){
    try {
        let hash = await util.hashPassword(newPass);
        const query = "UPDATE usuario SET password=$1 WHERE username=$2;";
        const values = [hash,username];
        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rowCount !== 1) {
            throw new Error('RowCount incorrecto');
        }
    }
    catch (error) {
        throw error;
    }
}
async function updateUserNombre(nombre,username){
    try {
        const query = "UPDATE usuario SET nombre=$1 WHERE username=$2;";
        const values = [nombre,username];
        await client.query(query, values);
    }
    catch (error) {
        console.error('Error BDAT al actualizar nombre de usuario:', error);
    }
}
async function newIncidencia(username,titulo,desc,categoria){
    try {
        const query = "INSERT INTO incidencia (username,titulo,descripcion,categoria) VALUES ($1,$2,$3,$4) RETURNING id;";
        const values = [username,titulo,desc,categoria];
        const result = await client.query(query, values);
        if (result.rows.length === 1) {
            const idIncidencia = result.rows[0].id;
            return idIncidencia;
        }
        throw new Error('RowCount incorrecto');
    }
    catch (error) {
        throw error;
    }
}
async function newCurso(nombrecurso,username){
    try {
        const query = "INSERT INTO curso (nombrecurso,username) VALUES ($1,$2) RETURNING id,version,nombrecurso;";
        const values = [nombrecurso,username];
        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rows.length === 1) {
            return {
                id:result.rows[0].id,
                version:result.rows[0].version,
                nombreCurso:result.rows[0].nombrecurso
            }
        }
        throw new Error('RowCount incorrecto');
    }
    catch (error) {
        throw error;
    }
}
async function updateCurso(idCurso,ruta,version,nombreCurso){
    try {
        const query = "UPDATE curso SET ruta=$1,version=$2,nombrecurso=$3,fechaactualizacion=CURRENT_TIMESTAMP WHERE id=$4 RETURNING id,version;";
        const values = [ruta,version,nombreCurso,idCurso];
        const result = await client.query(query, values); // Ejecuta la consulta con los valores proporcionados
        if (result.rowCount === 1) {
            return result.rows[0];
        }
        throw new Error('RowCount incorrecto');
    }
    catch (error) {
        throw error;
    }
}
async function getCurso(idCurso){
    try {
        const query = 'SELECT * FROM curso WHERE id = $1';
        const values = [idCurso];
        const result = await client.query(query, values);
        if (result.rows.length !== 0) {
            return result.rows[0];
        }
        throw new Error('RowCount incorrecto');
    }
    catch (error) {
        throw error;
    }
}

async function listCursos(criterio,usuarioLogueado) {
    try {
        const values = [];
        let query = `SELECT c.id, c.version, c.nombrecurso, c.username, u.nombre as nombreusuario, c.ruta
                     FROM curso c
                     INNER JOIN usuario u ON u.username = c.username AND u.habilitado
                     WHERE c.ruta IS NOT NULL`;
        if (criterio && criterio !== null) {
            const upperCriterio = criterio.toUpperCase(); // Convertimos el criterio a mayúsculas
            query += " AND (UPPER(c.nombrecurso) LIKE $1 OR UPPER(u.nombre) LIKE $1 OR UPPER(u.username) LIKE $1)";
            values.push(addLikeString(upperCriterio)); // Añadimos el criterio en mayúsculas con el operador LIKE
        }
        if(!usuarioLogueado.superadmin){
            const paramIndex = values.length + 1;
            query+=` AND c.username=$${paramIndex}`;
            values.push(usuarioLogueado.username);
        }
        query += ";";
        const result = await client.query(query, values);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

function addLikeString(string){
    return '%'+string+'%';
}

export default { loginUsuario
    ,getUsuario
    ,newUsuario
    ,newUserPassword
    ,updateUserPassword
    ,updateUserNombre
    ,newIncidencia
    ,getCurso
    ,newCurso
    ,listCursos
    ,updateCurso
};