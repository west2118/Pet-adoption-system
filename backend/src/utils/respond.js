export const sendSuccess = (res, data, message, meta, statusCode = 200) => {
  const body = { success: true, data };
  if (message !== undefined) body.message = message;
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});
