const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const nodemailer = require('nodemailer');

require('dotenv').config();

const register = async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.findOne({ where: { email: email } });

  if (user) {
    return res.status(400).json({ message: `Ya existe un usuario registrado con este correo.` })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'Usuario registrado exitosamente!', user });
  } catch (error) {
    res.status(400).json({ message: 'Ocurrió un error al registrar el usuario.', error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Los datos ingresados son incorrectos. Por favor, verifica tu correo y contraseña.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Los datos ingresados son incorrectos. Por favor, verifica tu correo y contraseña.' });

    //generar token
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.json(token);
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al iniciar sesión.', error });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.user.id;  // ID del usuario desde el token
    const usuario = await User.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    usuario.password = ''; //para no enviar la contraseña
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al obtener el usuario.' });
  }
};

const getAllUsers = async (req, res) => {

  try {
    const users = await User.findAll();

    // Eliminar contraseña de cada usuario para no devolverla
    users.forEach(user => {
      user.password = '';
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No se encontraron usuarios.' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al obtener la lista de usuarios. ', error });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  console.log("desde bd, rol: " + role);
  // rol solo puede ser 0 o 1
  if (role !== 0 && role !== 1) {
    return res.status(400).json({ message: 'Rol no válido. El rol debe ser 0 o 1.' });
  }

  try {

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: 'Se ha modificado el rol exitosamente.', user });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al modificar el rol del usuario.', error });
  }
};


//mail para cambio de contraseña

// token JWT para el cambio de contraseña
const generateResetToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// solicita restablecimiento de contraseña
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const resetToken = generateResetToken(user.id);
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Configurar transporte para enviar correo
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'tamaraabarza01@gmail.com',//process.env.EMAIL_USER,
        pass: 'ljpa zxzs qikg meoi'//process.env.EMAIL_PASSWORD,
      },
    });

    // Enviar correo
    await transporter.sendMail({
      from: `"Gestión de eventos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Restablecimiento de contraseña',
      text: `Usa el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
      html: generatePasswordResetHTML(resetLink), //función para generar el HTML
    });

    res.status(200).json({ message: 'Correo enviado con el enlace para restablecer la contraseña' });
  } catch (error) {
    console.error('Error en /request-password-reset:', error.message);
    res.status(500).json({ message: 'Error al solicitar el cambio de contraseña', error });
  }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: '¡Contraseña actualizada exitosamente!' });
  } catch (error) {
    res.status(400).json({ message: 'Token inválido o expirado', error });
  }
};


const updateUser = async (req, res) => {
  const { username, email } = req.body;
  const id = req.user.id;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verifico si el nuevo correo es diferente al actual y si está registrado
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'El correo electrónico ingresado ya está en uso por otro usuario.' });
      }
      user.email = email; // Si el correo es diferente y no está en uso, lo actualizo
    }

    if (username) user.username = username;

    await user.save(); 
    res.status(200).json({ message: '¡Datos de usuario actualizados exitosamente!', user });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al actualizar los datos del usuario ', error });
  }
};

// cambiar la contraseña
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id = req.user.id;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar si la contraseña actual es correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '¡La contraseña actual es incorrecta!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: '¡Contraseña modificada exitosamente!' });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al modificar la contraseña. ', error });
  }
};


const deleteUser = async (req, res) => {
  const { id } = req.params; 
  try {

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    await user.destroy();
    res.status(200).json({ message: '¡Usuario eliminado exitosamente!' });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al eliminar el usuario. ', error });
  }
};

//html del correo
const generatePasswordResetHTML = (resetLink) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Restablecimiento de Contraseña</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                background: linear-gradient(to right, #fff5f8, #ffeef4);
                margin: 0;
                padding: 0;
            }

            .email-container {
                max-width: 600px;
                margin: 30px auto;
                background-color: #fff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .header {
                text-align: center;
                margin-bottom: 20px;
            }

            .header h1 {
                font-size: 2rem;
                font-weight: bold;
                color: #444;
                margin-bottom: 10px;
            }

            .header p {
                font-size: 1.1rem;
                color: #555;
            }

            .body {
                font-size: 1rem;
                color: #555;
                margin-bottom: 20px;
            }

           .cta-button {
            display: inline-block;
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: bold;
            color: #fff !important;
            background-color: #d32f2f;
            text-decoration: none !important;
            border-radius: 4px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
            margin-top: 20px;
            }

            .cta-button:hover {
                background-color: #b71c1c;
            }

            .note {
                font-size: 0.9rem;
                color: #999;
                margin-top: 15px;
                text-align: center;
            }

            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 0.8rem;
                color: #777;
            }

            .footer a {
                color: #d32f2f;
                text-decoration: none;
            }

            .footer a:hover {
                text-decoration: underline;
            }
        </style>
    </head>

    <body>
        <div class="email-container">
            <div class="header">
                <h1>Restablecimiento de Contraseña</h1>
                <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
            </div>

            <div class="body">
                <p>Hola,</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no solicitaste este cambio,
                    puedes ignorar este correo.</p>
                <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>

                <!-- Botón para restablecer contraseña dentro del contenedor -->
                <a href="${resetLink}" class="cta-button">Restablecer mi contraseña</a>

                <p class="note">Este enlace caducará en 15 minutos, así que asegúrate de usarlo antes de que expire.</p>
            </div>

            <div class="footer">
                <p>Si tienes alguna pregunta, no dudes en ponerte en contacto con nosotros.</p>
                <p><a href="mailto:support@gestionEventos.com">support@GestionEventos.com</a></p>
                <p>Gracias por ser parte de <strong>Gestion de Eventos</strong>.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};


module.exports = {
  register, login, getUserById, getAllUsers, updateUserRole,
  resetPassword, requestPasswordReset,
  updateUser,updatePassword,deleteUser
};