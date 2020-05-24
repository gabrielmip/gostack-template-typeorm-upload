import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

async function findOrCreateCategoryByTitle(title: string): Promise<Category> {
  const categoryRepository = getRepository(Category);
  const category = await categoryRepository.findOne({ where: { title } });

  if (!category) {
    const newCategory = categoryRepository.create();
    newCategory.title = title;
    return categoryRepository.save(newCategory);
  }
  return category;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: TransactionDTO): Promise<Transaction> {
    const repository = getCustomRepository(TransactionsRepository);
    const currentBalance = await repository.getBalanceAfterOperation({
      value,
      type,
    });

    if (currentBalance.total < 0) {
      throw new AppError('Insufficient balance to perform operation');
    }

    const category = await findOrCreateCategoryByTitle(categoryName);
    const transaction = repository.create();
    transaction.title = title;
    transaction.value = value;
    transaction.type = type;
    transaction.category = category;

    return repository.save(transaction);
  }
}

export default CreateTransactionService;
