import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionListData } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { selectRecipientsByRecency } from 'src/features/transactions/selectors'
import { selectInactiveAccounts } from 'src/features/wallet/selectors'
import { parseAddress } from 'src/utils/addresses'

const MAX_RECENT_RECIPIENTS = 15

export function useFullAddressRecipient(searchTerm: string | null) {
  const { loading, address: ensAddress, name } = useENS(ChainId.Mainnet, searchTerm, true)
  return useMemo(() => {
    const address = parseAddress(searchTerm) || parseAddress(ensAddress)
    const validatedRecipient = address ? { address, name } : null
    const recipient = validatedRecipient ? [validatedRecipient] : []
    return { recipient, loading }
  }, [name, loading, searchTerm, ensAddress])
}

export function useRecipients() {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState<string | null>(null)

  const inactiveLocalAccounts = useAppSelector(selectInactiveAccounts) as SearchableRecipient[]
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const { recipient: validatedAddressRecipient, loading } = useFullAddressRecipient(pattern)

  const sections = useMemo(
    () =>
      [
        ...(validatedAddressRecipient.length > 0
          ? [
              {
                title: t('Search Results'),
                data: validatedAddressRecipient,
              },
            ]
          : []),
        ...(recentRecipients.length > 0
          ? [
              {
                title: t('Recent'),
                data: recentRecipients,
              },
            ]
          : []),
        ...(inactiveLocalAccounts.length > 0
          ? [
              {
                title: t('Your Wallets'),
                data: inactiveLocalAccounts,
              },
            ]
          : []),
      ] as SectionListData<SearchableRecipient>[],
    [validatedAddressRecipient, recentRecipients, t, inactiveLocalAccounts]
  )

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([
        ...validatedAddressRecipient,
        ...inactiveLocalAccounts,
        ...recentRecipients,
      ] as SearchableRecipient[]).map((item) => ({ data: item, key: item.address })),
    [recentRecipients, validatedAddressRecipient, inactiveLocalAccounts]
  )

  const onChangePattern = useCallback((newPattern) => setPattern(newPattern), [])

  return useMemo(
    () => ({
      sections,
      searchableRecipientOptions,
      pattern,
      onChangePattern,
      loading,
    }),
    [pattern, onChangePattern, searchableRecipientOptions, sections, loading]
  )
}
