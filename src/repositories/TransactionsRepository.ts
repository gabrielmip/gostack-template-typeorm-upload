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
    total: type === 'income' ? value : -1 * value,
  };
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const initialBalance: Balance = { income: 0, outcome: 0, total: 0 };

    return transactions.reduce(
      (currentBalance: Balance, transaction: Transaction): Balance => {
        const operation = { type: transaction.type, value: transaction.value };
        return addTransactionToBalance(currentBalance, operation);
      },
      initialBalance,
    );
  }

  public async getBalanceAfterOperation({
    value,
    type,
  }: Operation): Promise<Balance> {
    const currentBalance = await this.getBalance();
    return addTransactionToBalance(currentBalance, { value, type });
  }
}

export default TransactionsRepository;
