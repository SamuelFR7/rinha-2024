import { db } from ".";
import { clients, transactions } from "./schema";

await db.delete(transactions);
await db.delete(clients);
await db.insert(clients).values([
  {
    id: 1,
    limit: 100000,
  },
  {
    id: 2,
    limit: 80000,
  },
  {
    id: 3,
    limit: 1000000,
  },
  {
    id: 4,
    limit: 10000000,
  },
  {
    id: 5,
    limit: 500000,
  },
]);

process.exit(0);
