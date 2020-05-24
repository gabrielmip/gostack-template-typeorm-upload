import neatCsv from 'neat-csv';
import fs from 'fs';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import { findOrCreateCategoryByTitle } from './CreateTransactionService';

interface TransactionDTO {
  title: string;
  type: string;
  value: number;
  category: string;
}

interface Operation {
  value: number;
  type: 'income' | 'outcome';
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const fileContent = fs
      .readFileSync(filename)
      .toString()
      .replace(/, /g, ',');
    const transactionsToImport = (await neatCsv(fileContent)).map(t => ({
      ...t,
      value: Number(t.value),
    })) as TransactionDTO[];
    const repository = getCustomRepository(TransactionsRepository);
    const operations = transactionsToImport.map(({ value, type }) => {
      return {
        value,
        type,
      };
    }) as Operation[];

    const { total } = await repository.getBalanceAfterOperations(operations);

    if (total <= 0) {
      throw new Error('Insufficient balance if the operations are imported.');
    }

    const entities = [];
    for (const transaction of transactionsToImport) {
      const category = await findOrCreateCategoryByTitle(transaction.category); // eslint-disable-line
      const entity = repository.create();
      entities.push(
        Object.assign(entity, {
          ...transaction,
          category,
        }),
      );
    }

    return repository.save(entities);
  }
}

export default ImportTransactionsService;
