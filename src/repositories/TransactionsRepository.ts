import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Operation {
  value: number;
  type: 'income' | 'outcome';
}

function addTransactionToBalance(
  balance: Balance,
  { type, value }: Operation,
): Balance {
  return {
    ...balance,
    [type]: balance[type] + value,
    total: balance.total + (type === 'income' ? value : -1 * value),
  };
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await (await this.find()).map(t => ({
      ...t,
      value: Number(t.value),
    }));
    const initialBalance: Balance = { income: 0, outcome: 0, total: 0 };

    return transactions.reduce(
      (currentBalance: Balance, transaction: Transaction): Balance => {
        const operation = { type: transaction.type, value: transaction.value };
        return addTransactionToBalance(currentBalance, operation);
      },
      initialBalance,
    );
  }

  public async getBalanceAfterOperations(
    operations: Operation[],
  ): Promise<Balance> {
    const currentBalance = await this.getBalance();
    return operations.reduce(
      (balance, operation) => addTransactionToBalance(balance, operation),
      currentBalance,
    );
  }
}

export default TransactionsRepository;
