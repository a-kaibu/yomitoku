---
title: "直前のコマンドの流れに合う履歴を、優先して候補にする"
description: "入力に前方一致する履歴のうち、直前に実行したコマンドの続きになっているものを優先して候補として返す戦略関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/strategies/match_prev_cmd.zsh"
lines: [23, 66]
function: "_zsh_autosuggest_strategy_match_prev_cmd"
difficulty: 3
format: 2
tags: [文字列処理, 設計パターン, CLI]
---
## ひとことで

`_zsh_autosuggest_strategy_match_prev_cmd` は、**入力に前方一致する履歴の中から、直前のコマンドと同じ流れで使われたものを優先する** 関数です。候補を探す方法の 1 つとして、`ZSH_AUTOSUGGEST_STRATEGY` に組み込まれます。

同じ文字で始まるコマンドは、履歴に何通りもあります。直前に打ったコマンドによって、次に使いたいものは変わります。この関数は、その流れを手がかりにします。

## コード

::: code-group

```zsh:line-numbers=23 [日本語訳]
_zsh_autosuggest_strategy_match_prev_cmd() {
	# 関数の中だけ、zsh の標準の設定に戻し、LOCAL_OPTIONS を有効にします。
	emulate -L zsh

	# (#m) などの拡張パターンを使うため、EXTENDED_GLOB を有効にします。
	setopt EXTENDED_GLOB

	# TODO: zsh 5.0.8 より古いものを切り捨てたら、(b) フラグを使います。
	local prefix="${1//(#m)[\\*?[\]<>()|^~#]/\\$MATCH}"

	# 入力に前方一致する履歴を取り出します。無視パターンに一致するものは除きます。
	# 無視パターンに一致するものは除きます。
	local pattern="$prefix*"
	if [[ -n $ZSH_AUTOSUGGEST_HISTORY_IGNORE ]]; then
		pattern="($pattern)~($ZSH_AUTOSUGGEST_HISTORY_IGNORE)"
	fi

	# パターンに一致する履歴の番号を、全部取り出します。
	# パターンに一致する履歴の項目です。
	local history_match_keys
	history_match_keys=(${(k)history[(R)$~pattern]})

	# 既定では、最初の履歴番号（最も新しい履歴）を使います。
	local histkey="${history_match_keys[1]}"

	# 直前に実行したコマンドを取り出します。
	local prev_cmd="$(_zsh_autosuggest_escape_command "${history[$((HISTCMD-1))]}")"

	# 一致する番号の先頭から最大 200 件まで調べます。
	for key in "${(@)history_match_keys[1,200]}"; do
		# 履歴が尽きたら止めます。
		[[ $key -gt 1 ]] || break

		# 候補の 1 つ前の履歴が、
		# 直前のコマンドと一致するなら、それを採用します。
		if [[ "${history[$((key - 1))]}" == "$prev_cmd" ]]; then
			histkey="$key"
			break
		fi
	done

	# 採用した履歴の内容を返します。
	typeset -g suggestion="$history[$histkey]"
}
```

```zsh:line-numbers=23 [原文]
_zsh_autosuggest_strategy_match_prev_cmd() {
	# Reset options to defaults and enable LOCAL_OPTIONS
	emulate -L zsh

	# Enable globbing flags so that we can use (#m) and (x~y) glob operator
	setopt EXTENDED_GLOB

	# TODO: Use (b) flag when we can drop support for zsh older than v5.0.8
	local prefix="${1//(#m)[\\*?[\]<>()|^~#]/\\$MATCH}"

	# Get the history items that match the prefix, excluding those that match
	# the ignore pattern
	local pattern="$prefix*"
	if [[ -n $ZSH_AUTOSUGGEST_HISTORY_IGNORE ]]; then
		pattern="($pattern)~($ZSH_AUTOSUGGEST_HISTORY_IGNORE)"
	fi

	# Get all history event numbers that correspond to history
	# entries that match the pattern
	local history_match_keys
	history_match_keys=(${(k)history[(R)$~pattern]})

	# By default we use the first history number (most recent history entry)
	local histkey="${history_match_keys[1]}"

	# Get the previously executed command
	local prev_cmd="$(_zsh_autosuggest_escape_command "${history[$((HISTCMD-1))]}")"

	# Iterate up to the first 200 history event numbers that match $prefix
	for key in "${(@)history_match_keys[1,200]}"; do
		# Stop if we ran out of history
		[[ $key -gt 1 ]] || break

		# See if the history entry preceding the suggestion matches the
		# previous command, and use it if it does
		if [[ "${history[$((key - 1))]}" == "$prev_cmd" ]]; then
			histkey="$key"
			break
		fi
	done

	# Give back the matched history entry
	typeset -g suggestion="$history[$histkey]"
}
```

:::

## 前提知識

- **履歴番号**: zsh が履歴の各項目に付ける番号です。`history` という連想配列で、番号から中身を引けます。
- **`HISTCMD`**: 今の入力が何番目の履歴になるかを表す変数です。1 つ前が直前のコマンドになります。
- **`(R)` の添字**: 配列や連想配列の値の中から、パターンに一致するものを探す zsh の書き方です。
- **`(k)` フラグ**: 連想配列の鍵（ここでは履歴番号）だけを取り出す指定です。
- **`EXTENDED_GLOB`**: `(#m)` や `~` を使った高度なパターンを有効にする設定です。

## 何をしているか

### 1. 入力を安全なパターンにする

```zsh:line-numbers=27
	# (#m) などの拡張パターンを使うため、EXTENDED_GLOB を有効にします。
	setopt EXTENDED_GLOB
```

入力に含まれるワイルドカードの記号を、`\` でエスケープします。そのうえで、前方一致のパターンを作ります。

### 2. 一致する履歴番号を集める

```zsh:line-numbers=31
	local prefix="${1//(#m)[\\*?[\]<>()|^~#]/\\$MATCH}"

	# 入力に前方一致する履歴を取り出します。無視パターンに一致するものは除きます。
	# 無視パターンに一致するものは除きます。
	local pattern="$prefix*"
	if [[ -n $ZSH_AUTOSUGGEST_HISTORY_IGNORE ]]; then
		pattern="($pattern)~($ZSH_AUTOSUGGEST_HISTORY_IGNORE)"
	fi

	# パターンに一致する履歴の番号を、全部取り出します。
```

除外のパターンがあれば、それも加えます。そして、そのパターンに一致する履歴の番号を、全部集めます。

### 3. 既定の候補を決める

```zsh:line-numbers=42
	local history_match_keys
	history_match_keys=(${(k)history[(R)$~pattern]})

	# 既定では、最初の履歴番号（最も新しい履歴）を使います。
```

集めた番号の先頭を、まず既定の候補にします。直前のコマンドも、同じく取り出しておきます。

### 4. 直前のコマンドが合う履歴を探す

```zsh:line-numbers=47

	# 直前に実行したコマンドを取り出します。
	local prev_cmd="$(_zsh_autosuggest_escape_command "${history[$((HISTCMD-1))]}")"

	# 一致する番号の先頭から最大 200 件まで調べます。
	for key in "${(@)history_match_keys[1,200]}"; do
		# 履歴が尽きたら止めます。
		[[ $key -gt 1 ]] || break

		# 候補の 1 つ前の履歴が、
		# 直前のコマンドと一致するなら、それを採用します。
		if [[ "${history[$((key - 1))]}" == "$prev_cmd" ]]; then
			histkey="$key"
			break
```

先頭から最大 200 件まで見ていきます。ある番号の 1 つ前の履歴が、直前のコマンドと同じなら、その番号を採用して止めます。

### 5. 候補を結果として残す

```zsh:line-numbers=63

	# 採用した履歴の内容を返します。
	typeset -g suggestion="$history[$histkey]"
```

採用した番号の履歴の内容を、`suggestion` に入れます。これが戦略の結果になります。

## ここがすごい

- **文脈で選び直す**: 同じ前方一致でも、直前の流れに合うものを選びます。`git` と打つにしても、直前の作業に応じた候補が出ます。
- **探す数に上限を付ける**: 200 件で打ち切るので、履歴が長くても一定の時間で終わります。
- **既定に戻れる**: 合うものが無ければ、最初の候補を使います。結果が無くなることはありません。
- **入力の記号を無効化する**: 入力をエスケープしてからパターンにするので、利用者の入力が意図しない解釈をされません。

## まとめ

- 候補を絞るときは、直前の操作など文脈の情報を使うと精度が上がる。
- 探索には上限を付けると、大きな履歴でも速さが保てる。
- 合う候補が無い場合の既定の動きを、必ず決めておく。
