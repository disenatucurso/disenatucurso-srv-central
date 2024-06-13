import pg from 'pg';

function conectarse(){
    //DATOS DE CONEXION
    const client = new pg.Client({
        user: 'postgres',
        password: 'admin',
        host: 'localhost',
        port: 5432,
        database: 'disenatucurso'
    });
    //CONEXIÓN CON LA BASE DE DATOS
    client.connect()
      .then(() => console.log('Conexión BDAT exitosa'))
      .catch(err => console.error('Error de conexión BDAT:', err));
    return client;
}

export default { conectarse };