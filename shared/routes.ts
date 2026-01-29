import { z } from "zod";
import { insertUserSchema, insertMessageSchema, users, messages } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    login: {
      method: "POST" as const,
      path: "/api/users/login",
      input: insertUserSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/users",
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages",
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect & { 
          user?: typeof users.$inferSelect,
          replyTo?: typeof messages.$inferSelect & { user?: typeof users.$inferSelect }
        }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/messages",
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/messages/:id",
      input: z.object({ content: z.string() }),
      responses: {
        200: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/messages/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};
