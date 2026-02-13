import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { createApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Load schema SDL
  const typeDefs = fs.readFileSync(
    path.join(__dirname, 'schema/schema.graphql'),
    'utf8'
  );

  // TEMP resolvers (safe placeholders)
  const resolvers = {
    Query: {
      __typename: () => 'Query'
    }
  };

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const apolloServer = new ApolloServer({
    schema
  });

  await apolloServer.start();

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(apolloServer)
  );

  // Schema SDL endpoint
  app.get('/graphql/schema', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(typeDefs);
  });

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}
