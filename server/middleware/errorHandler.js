const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  if (err.ghlResponse) {
    console.error('[GHL]', JSON.stringify(err.ghlResponse));
  }

  // Anthropic API errors
  if (err.status && err.error) {
    return res.status(err.status).json({
      success: false,
      message: err.error?.message || 'Anthropic API error',
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // CastError (invalid MongoDB ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export default errorHandler;
