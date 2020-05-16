import { gql } from "apollo-boost";
import fetch from "isomorphic-unfetch";
import { InMemoryCache } from "apollo-cache-inmemory";
import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import ApolloClient from "apollo-client";

const WebSocket = require("websocket").client;

const createApolloClient = () => {
  const httpLink = new HttpLink({
    uri: process.env.THE_GRAPH_HTTP,
    fetch
  });
  const wsLink = new WebSocketLink({
    uri: process.env.THE_GRAPH_WS,
    options: {
      reconnect: true
    },
    webSocketImpl: WebSocket
  });
  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink
  );
  const defaultOptions = {
    subscribe: {
      fetchPolicy: "network-only",
      errorPolicy: "all"
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all"
    }
  };

  return new ApolloClient({ ssrMode: false, link, cache: new InMemoryCache(), defaultOptions });
};

export const client = createApolloClient();

// QUERIES ////////////////////////////////////

export const PLANETS = gql`
  query {
    acquiredPlanets {
      id
      owner
    }
  }
`;

// SUBSCRIPTIONS //////////////////////////

export const PLANETS_SUBSCRIPTION = gql`
  subscription {
    acquiredPlanets {
      id
      owner
    }
  }
`;
