const Message = require('../models/Message');

const getMessagesByChannel = async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.channel }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

const postMessage = async (req, res) => {
  const { content, channel } = req.body;
  const user = req.user; // Viene del token

  try {
    const message = new Message({
      content,
      channel,
      user: user.username, // o user.id, si guardás el ID
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
};

module.exports = { getMessagesByChannel, postMessage };
