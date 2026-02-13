import { verifyToken } from './jwt.js';
import { createLoaders } from '../loaders/index.js';

function getAuthHeader({ req, connectionParams } = {}) {
  if (req?.headers?.authorization) {
    return req.headers.authorization;
  }

  if (connectionParams?.Authorization) {
    return connectionParams.Authorization;
  }

  if (connectionParams?.authorization) {
    return connectionParams.authorization;
  }

  return '';
}

export function buildContext({ req, connectionParams } = {}, pubsub) {
  const authHeader = getAuthHeader({ req, connectionParams });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const decoded = token ? verifyToken(token) : null;

  return {
    user: decoded,
    loaders: createLoaders(),
    pubsub
  };
}
