import { Elysia, t } from "elysia";
import { db } from "./db";
import { clients, transactions } from "./db/schema";
import { desc, eq } from "drizzle-orm";

const createTransaction = new Elysia()
  .post(
    "/clientes/:id/transacoes",
    async ({ params: { id }, body, set }) => {
      const [clientExists] = await db
        .select({
          limit: clients.limit,
          balance: clients.balance,
        })
        .from(clients)
        .where(eq(clients.id, id));

      if (!clientExists) {
        set.status = 404;
        return { message: "Client not found" };
      }

      const { descricao, tipo, valor } = body;

      if (
        tipo === "d" &&
        clientExists.balance - valor < clientExists.limit * -1
      ) {
        set.status = 422;
        return { message: "Client limit exceeded" };
      }

      const updatedClient = await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          amount: valor,
          description: descricao,
          type: tipo === "c" ? "c" : "d",
          clientId: id,
        });

        const [updatedClient] = await tx
          .update(clients)
          .set({
            balance: clientExists.balance + (tipo === "c" ? valor : -valor),
          })
          .where(eq(clients.id, id))
          .returning();

        return updatedClient;
      });

      return {
        limite: updatedClient.limit,
        saldo: updatedClient.balance,
      };
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        valor: t.Number(),
        tipo: t.String({
          default: "c",
          pattern: "^(c|d)$",
        }),
        descricao: t.String({
          maxLength: 10,
          minLength: 1,
        }),
      }),
    }
  )
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return error.message;
    }
  });

const statement = new Elysia().get(
  "/clientes/:id/extrato",
  async ({ params: { id }, set }) => {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));

    if (!client) {
      set.status = 404;
      return { message: "Client not found" };
    }

    const lastTransactions = await db
      .select({
        valor: transactions.amount,
        tipo: transactions.type,
        descricao: transactions.description,
        realizada_em: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.clientId, client.id))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return {
      saldo: {
        total: client.balance,
        data_extrato: new Date().toISOString(),
        limite: client.limit,
      },
      ultimas_transacoes: lastTransactions,
    };
  },
  {
    params: t.Object({
      id: t.Numeric(),
    }),
  }
);

const app = new Elysia()
  .use(createTransaction)
  .use(statement)
  .listen(process.env.PORT || 3333);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
