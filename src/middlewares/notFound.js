function notFound(req, res) {
  return res.status(404).json({
    message: 'Rota nao encontrada.',
  });
}

module.exports = notFound;
