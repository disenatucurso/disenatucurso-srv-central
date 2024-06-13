# Disena Tu Curso - Servidor Central

Requisitos:
Node > 20
Postgres > 16

Crear database de nombre 'disenatucurso'
En el archivo src\bdat\config.mjs están seteadas las credenciales para conectarse a la BDAT.
Ejecutar script config\database.sql sobre la database, este script creará las estructuras necesarias y un usuario con privilegios de Administrador:
username=superadmin
password=5RT5rJ0rWc

Para instalar las dependencias del proyecto, desde un terminal ejecutar:
npm ci

Para iniciar el servidor, desde un terminal ejecutar:
node .\src\server.mjs

Ruta a Swagger:
http://localhost:3000/swagger-ui
