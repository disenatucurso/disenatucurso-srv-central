import util from './util.mjs';
import path from 'path';
import url from 'url';

// Variable privada que almacena el valor aleatorio generado
let valorAleatorio = null;
let rutaFSCursos = null;
let rutaFSSchemas = null;
// Función que devuelve el valor aleatorio la primera vez y luego lo almacena para devolverlo siempre
function ENCRYPT_KEY() {
  if (valorAleatorio === null) {
    valorAleatorio = util.generarPassword()+util.generarPassword();
  }
  return valorAleatorio;
}
const SERVER_URL = "http://localhost:3000";
const NOMBRE_INSTITUCION = 'SRV LocalHost';
//En Windows, se quita la letra de unidad y :
//En este caso mi ruta completa es "C:/Users/net..."
const RUTA_CODIGO="/Users/nesto/Documents/GitHub/disenatucurso-srv-central/src/"
function RUTA_FS_CURSO(idCurso){
    if (rutaFSCursos === null) {
        // Get the current directory path
        let scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
        // Construir la ruta del directorio de archivos
        rutaFSCursos = path.resolve(scriptDir, '..', 'cursos');
    }
    return path.resolve(rutaFSCursos, idCurso + '.json');
}
function RUTA_FS_SCHEMA(idSchema){
    if (rutaFSSchemas === null) {
        // Get the current directory path
        let scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
        // Construir la ruta del directorio de archivos
        rutaFSSchemas = path.resolve(scriptDir, '..', 'schemas');
    }
    return path.resolve(rutaFSSchemas, idSchema + '.json');
}

export default {ENCRYPT_KEY,SERVER_URL,NOMBRE_INSTITUCION,RUTA_CODIGO,RUTA_FS_CURSO,RUTA_FS_SCHEMA};