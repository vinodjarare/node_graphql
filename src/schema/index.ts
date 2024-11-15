import { buildSchema } from "graphql";

export const typeDefs = buildSchema(`

scalar DateTime

type User {
  id: ID!
  address: String!
  email: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Product {
  id: ID
  name: String!
  price: Float!
  quantity: Int
  owner: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type productsPagination {
  products: [Product!]!
  total: Int!
  limit: Int!
  page: Int!
  totalPages: Int!
  hasNextPage: Boolean!
  hasPrevPage: Boolean!
  nextPage: Int
  prevPage: Int
}

type Query {
  product(id: ID!): Product
  productCount: Int!
  users: [User!]!
  user(id: ID!): User
  productsByUser(userId: ID!): [Product!]!
  products(limit: Int!, page: Int!, search:String): productsPagination
}

type AuthPayload {
  token: String
  user: User
}

type Mutation {
  addProduct(name: String!, price: Float!, quantity: Int!): Product
  updateProduct(id: ID!, name: String!, price: Float!, quantity: Int!): Product
  createUser(address: String!, email: String!, password: String!): User
  login(email: String!, password: String!): AuthPayload
}
`);
