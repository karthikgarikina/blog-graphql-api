export function encodeCursor(id) {
  return Buffer.from(id.toString()).toString('base64');
}

export function decodeCursor(cursor) {
  return parseInt(Buffer.from(cursor, 'base64').toString('ascii'), 10);
}

export function createConnection(data, hasNextPage) {
  return {
    edges: data.map(item => ({
      node: item,
      cursor: encodeCursor(item.id)
    })),
    pageInfo: {
      hasNextPage,
      endCursor: data.length
        ? encodeCursor(data[data.length - 1].id)
        : null
    }
  };
}
