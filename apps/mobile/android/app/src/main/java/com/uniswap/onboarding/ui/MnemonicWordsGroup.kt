package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * View used to display mnemonic words for wallet seed phrase
 */
@Composable
fun MnemonicWordsGroup(
  modifier: Modifier = Modifier,
  words: List<MnemonicWordUiState>,
  columnCount: Int = DEFAULT_COLUMN_COUNT,
  onClick: (word: MnemonicWordUiState) -> Unit = {},
) {
  Row(
    modifier = modifier
      .fillMaxWidth()
      .wrapContentHeight(),
    horizontalArrangement = Arrangement.spacedBy(
      UniswapTheme.spacing.spacing12
    )
  ) {
    val size = words.size / columnCount
    for (i in 0 until columnCount) {
      val starting = i * size
      val ending = (i + 1) * size
      MnemonicWordsColumn(
        modifier = Modifier.weight(1f),
        words = words.subList(starting, ending),
        numberOffset = starting + 1,
        onClick = onClick,
      )
    }
  }
}

private const val DEFAULT_COLUMN_COUNT = 2
