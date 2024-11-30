# Sistema de Gestión de Eventos
Un sistema que permite a los organizadores gestionar eventos, los usuarios pueden registrarse para participar y descargar certificados de asistencia.

## Características principales
- **Gestión de eventos:**
  - Crear, editar y eliminar eventos.
  - Ver eventos próximos.
- **Registro de usuarios:**
  - Inscribirse para participar en eventos.
  - Confirmar asistencia.
- **Generación de certificados:**
  - Descargar un certificado en formato PDF como comprobante de participación.

## Tecnologías utilizadas
- **Backend:**
  - Node.js con Express.js.
  - MySQL como base de datos.
  - Librerías:
    - `mysql`
    - `dotenv`
    - `cors`
    - `nodemon`
- **Frontend:**
   - `angular`

## Requisitos previos
1. Tener instalado:
   - Node.js (versión 14 o superior).
   - MySQL.
   - XAMPP (opcional para gestionar la base de datos).
2. Clonar este repositorio:
   ```bash
   git clone https://github.com/TamaraAbarza/Integrador-Bootcamp-ULP

3. Configurar las variables de entorno:
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=<tu-contraseña>
   DB_NAME=gestion_eventos

## Credenciales de prueba
Puedes iniciar sesión como administrador con las siguientes credenciales:

 - Correo: admin@gmail.com
 - Contraseña: 123456
