const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = 500;

  if (res.statusCode && res.statusCode !== 200) {
    statusCode = res.statusCode;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.name === "MulterError") {
    statusCode = 400;
  }

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
