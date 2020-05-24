import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { getCustomRepository } from 'typeorm';

import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const fileUploader = multer(uploadConfig);

transactionsRouter.get('/', async (_, response) => {
  const repository = getCustomRepository(TransactionsRepository);
  const transactions = await (
    await repository.find({ relations: ['category'] })
  ).map(t => ({ ...t, value: Number(t.value) }));
  const balance = await repository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category: categoryName } = request.body;

  const createTransactionService = new CreateTransactionService();
  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    categoryName,
  });

  const returnedTransaction = {
    ...transaction,
    category: transaction.category.title,
  };
  delete returnedTransaction.category_id;

  return response.send(returnedTransaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const repository = getCustomRepository(TransactionsRepository);
  await repository.delete({ id });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  fileUploader.single('file'),
  async (request, response) => {
    const importService = new ImportTransactionsService();
    const transactions = await importService.execute(request.file.path);

    fs.unlink(request.file.path, () => {});
    return response.status(201).json({ transactions });
  },
);

export default transactionsRouter;
