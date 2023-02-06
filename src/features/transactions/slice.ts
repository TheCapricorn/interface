/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* helpful when dealing with deeply nested state objects */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import {
  ChainIdToTxIdToDetails,
  FinalizedTransactionDetails,
  TransactionDetails,
  TransactionId,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export interface TransactionState {
  [address: Address]: ChainIdToTxIdToDetails
}

export const initialTransactionsState: TransactionState = {}

const slice = createSlice({
  name: 'transactions',
  initialState: initialTransactionsState,
  reducers: {
    addTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(
        !state?.[from]?.[chainId]?.[id],
        `addTransaction: Attempted to overwrite tx with id ${id}`
      )

      state[from] ??= {}
      state[from]![chainId] ??= {}
      state[from]![chainId]![id] = transaction
    },
    updateTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(
        state?.[from]?.[chainId]?.[id],
        `updateTransaction: Attempted to update a missing tx with id ${id}`
      )
      state[from]![chainId]![id] = transaction
    },
    finalizeTransaction: (
      state,
      { payload: transaction }: PayloadAction<FinalizedTransactionDetails>
    ) => {
      const { chainId, id, status, receipt, from } = transaction
      assert(
        state?.[from]?.[chainId]?.[id],
        `finalizeTransaction: Attempted to finalize a missing tx with id ${id}`
      )
      state[from]![chainId]![id]!.status = status
      if (receipt) state[from]![chainId]![id]!.receipt = receipt
    },
    cancelTransaction: (
      state,
      {
        payload: { chainId, id, address, cancelRequest },
      }: PayloadAction<
        TransactionId & { address: string; cancelRequest: providers.TransactionRequest }
      >
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `cancelTransaction: Attempted to cancel a tx that doesnt exist with id ${id}`
      )
      state[address]![chainId]![id]!.status = TransactionStatus.Cancelling
      state[address]![chainId]![id]!.cancelRequest = cancelRequest
    },
    replaceTransaction: (
      state,
      {
        payload: { chainId, id, address },
      }: PayloadAction<
        TransactionId & {
          newTxParams: providers.TransactionRequest
        } & { address: string }
      >
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `replaceTransaction: Attempted to replace a tx that doesnt exist with id ${id}`
      )
      state[address]![chainId]![id]!.status = TransactionStatus.Replacing
    },
    resetTransactions: () => initialTransactionsState,
    // fiat onramp transactions re-use this slice to store (off-chain) pending txs
    // this action removes the transaction from store
    upsertFiatOnRampTransaction: (
      state,
      { payload: transaction }: PayloadAction<TransactionDetails>
    ) => {
      const {
        chainId,
        id,
        from,
        status,
        typeInfo: { type },
      } = transaction

      assert(type === TransactionType.FiatPurchase, `only fiat purchases can be upserted`)

      switch (status) {
        case TransactionStatus.Success:
        case TransactionStatus.Unknown:
          // treat canceled as tx never sent to Moonpay
          // on success, tx should be reflected on chain
          // in both caes, safe to stop tracking this tx
          delete state[from]?.[chainId]?.[id]
          break
        case TransactionStatus.Failed:
        case TransactionStatus.Pending:
          state[from] ??= {}
          state[from]![chainId] ??= {}
          state[from]![chainId]![id] = transaction
          break
      }
    },
  },
})

export const {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  replaceTransaction,
  resetTransactions,
  upsertFiatOnRampTransaction,
  updateTransaction,
} = slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice