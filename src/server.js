import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { createApp } from './app.js';
import { resolvers } from './resolvers/index.js';
import { buildContext } from './auth/authMiddleware.js';
import { PORT } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = createApp();
  const httpServer = http.createServer(app);
  const pubsub = new PubSub();

  const typeDefs = fs.readFileSync(
    path.join(__dirname, 'schema/schema.graphql'),
    'utf8'
  );

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx) => buildContext({ connectionParams: ctx.connectionParams }, pubsub)
    },
    wsServer
  );

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });

  await apolloServer.start();

  app.use('/graphql', expressMiddleware(apolloServer, {
    context: (ctx) => buildContext(ctx, pubsub)
  }));

  app.get('/graphql/schema', (_, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(typeDefs);
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}
