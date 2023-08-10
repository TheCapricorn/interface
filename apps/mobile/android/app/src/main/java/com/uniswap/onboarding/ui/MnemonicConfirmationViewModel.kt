package com.uniswap.onboarding.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.ui.model.MnemonicWordBankCellUiState
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

class MnemonicConfirmationViewModel(
  private val ethersRs: RnEthersRs, // Move to repository layer if app gets more complex
) : ViewModel() {

  private var sourceWords = emptyList<String>()
  private var shuffledWords = emptyList<String>()
  private val focusedIndex = MutableStateFlow(0)
  private val selectedWords = MutableStateFlow<List<String?>>(emptyList())

  val displayWords: StateFlow<List<MnemonicWordUiState>> = combine(focusedIndex, selectedWords) { focusedIndexValue, words ->
    words.mapIndexed { index, word ->
      MnemonicWordUiState(
        text = word ?: "",
        focused = index == focusedIndexValue,
        hasError = word != null && word != sourceWords[index],
      )
    }
  }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  val wordBankList: StateFlow<List<MnemonicWordBankCellUiState>> = combine(focusedIndex, selectedWords) { focusedIndexValue, words ->
    shuffledWords.map { shuffledWord ->
      MnemonicWordBankCellUiState(
        text = shuffledWord,
        used = words.contains(shuffledWord),
      )
    }
  }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  private val _completed = MutableStateFlow(false)
  val completed = _completed.asStateFlow()

  private var currentMnemonicId = ""

  fun setup(mnemonicId: String) {
    if (mnemonicId.isNotEmpty() && mnemonicId != currentMnemonicId) {
      currentMnemonicId = mnemonicId

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        val words = mnemonic.split(" ")
        sourceWords = words
        shuffledWords = words.shuffled()
        focusedIndex.update { 0 }
        selectedWords.update { List(words.size) { null } }
      }
    }
  }

  fun handleWordRowClick(word: MnemonicWordUiState) {
    val index = displayWords.value.indexOf(word)
    focusedIndex.update { index }
  }

  fun handleWordBankClick(state: MnemonicWordBankCellUiState) {
    if (!state.used) {
      val focusedIndexValue = focusedIndex.value
      selectedWords.update { words ->
        val updated = words.mapIndexed { index, word ->
          if (index == focusedIndexValue) {
            if (state.text == sourceWords[focusedIndexValue]) {
              focusedIndex.update { focusedIndexValue + 1 }
            }
            state.text
          } else {
            word
          }
        }

        checkIfCompleted(updated)
        updated
      }
    }
  }

  private fun checkIfCompleted(words: List<String?>) {
    if (sourceWords == words) {
      _completed.update { true }
    }
  }
}
