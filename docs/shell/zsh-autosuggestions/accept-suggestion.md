---
title: "薄い候補を、カーソルが末尾にあるときだけ受け入れる"
description: "表示中の候補を入力へ確定させる関数。カーソルが末尾にあり候補がある時だけ取り込み、それ以外は元の動作に任せる。vi モードの位置ずれも補正する。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [110, 146]
function: "_zsh_autosuggest_accept"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_accept` は、**薄く出ている候補を入力に確定させる** 関数です。右矢印などのキーで、候補を受け入れるときに使われます。

ただし、いつでも受け入れるわけではありません。カーソルが行の末尾にあり、候補が本当に出ているときだけ確定します。それ以外は、キーの元の動作にそのまま任せます。

## コード

::: code-group

```zsh:line-numbers=110 [日本語訳]
_zsh_autosuggest_accept() {
	local -i retval max_cursor_pos=$#BUFFER

	# vicmd キーマップのときは、カーソルが末尾まで行けません。
	# 末尾の 1 つ手前までになります。
	if [[ "$KEYMAP" = "vicmd" ]]; then
		max_cursor_pos=$((max_cursor_pos - 1))
	fi

	# 候補を受け入れられない状態なら、
	# 元の動作を実行して終わります。
	if (( $CURSOR != $max_cursor_pos || !$#POSTDISPLAY )); then
		_zsh_autosuggest_invoke_original_widget $@
		return
	fi

	# カーソルが末尾にあるときだけ受け入れます。
	# 候補を入力の末尾へつなげます。
	BUFFER="$BUFFER$POSTDISPLAY"

	# 候補の表示を消します。
	POSTDISPLAY=

	# 元の動作を先に実行してから、カーソルを動かします。
	# 先に動かすと、動作が想定外になるためです。
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	# カーソルを入力の末尾へ動かします。
	if [[ "$KEYMAP" = "vicmd" ]]; then
		CURSOR=$(($#BUFFER - 1))
	else
		CURSOR=$#BUFFER
	fi

	return $retval
}
```

```zsh:line-numbers=110 [原文]
_zsh_autosuggest_accept() {
	local -i retval max_cursor_pos=$#BUFFER

	# When vicmd keymap is active, the cursor can't move all the way
	# to the end of the buffer
	if [[ "$KEYMAP" = "vicmd" ]]; then
		max_cursor_pos=$((max_cursor_pos - 1))
	fi

	# If we're not in a valid state to accept a suggestion, just run the
	# original widget and bail out
	if (( $CURSOR != $max_cursor_pos || !$#POSTDISPLAY )); then
		_zsh_autosuggest_invoke_original_widget $@
		return
	fi

	# Only accept if the cursor is at the end of the buffer
	# Add the suggestion to the buffer
	BUFFER="$BUFFER$POSTDISPLAY"

	# Remove the suggestion
	POSTDISPLAY=

	# Run the original widget before manually moving the cursor so that the
	# cursor movement doesn't make the widget do something unexpected
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	# Move the cursor to the end of the buffer
	if [[ "$KEYMAP" = "vicmd" ]]; then
		CURSOR=$(($#BUFFER - 1))
	else
		CURSOR=$#BUFFER
	fi

	return $retval
}
```

:::

## 前提知識

- **`CURSOR`**: 入力行の中で、カーソルがある位置を数で表す変数です。0 から数えます。
- **`KEYMAP`**: zsh の vi モードなどで、今使っているキーの設定の名前です。`vicmd` は vi のコマンドモードを表します。
- **vi のコマンドモード**: vi 風の操作では、カーソルが行の最後の文字の上に止まります。末尾の位置がずれるので、補正が必要です。
- **`$#POSTDISPLAY`**: 表示中の候補の長さです。0 なら、候補はありません。

## 何をしているか

### 1. 末尾の位置を決める

```zsh:line-numbers=113
	# vicmd キーマップのときは、カーソルが末尾まで行けません。
	# 末尾の 1 つ手前までになります。
	if [[ "$KEYMAP" = "vicmd" ]]; then
		max_cursor_pos=$((max_cursor_pos - 1))
	fi
```

通常は入力の長さが末尾の位置です。vi のコマンドモードのときは、末尾の位置が 1 つ手前になるので、それに合わせて値を減らします。

### 2. 受け入れられない状態なら元の動作へ

```zsh:line-numbers=121
	if (( $CURSOR != $max_cursor_pos || !$#POSTDISPLAY )); then
		_zsh_autosuggest_invoke_original_widget $@
		return
	fi

```

カーソルが末尾にない、または候補が無いときは、元のキーの動作だけを実行して終わります。候補を勝手に確定しないためです。

### 3. 候補を入力に確定させる

```zsh:line-numbers=128
	BUFFER="$BUFFER$POSTDISPLAY"

	# 候補の表示を消します。
	POSTDISPLAY=

```

候補を `BUFFER` の後ろへつなげて、表示は空にします。ここで、薄い表示が本物の入力になります。

### 4. 元の動作を実行し、カーソルを末尾へ

```zsh:line-numbers=136
	retval=$?

	# カーソルを入力の末尾へ動かします。
	if [[ "$KEYMAP" = "vicmd" ]]; then
		CURSOR=$(($#BUFFER - 1))
	else
		CURSOR=$#BUFFER
	fi

	return $retval
```

元のキーの動作を先に実行してから、カーソルを入力の末尾へ動かします。先に動かすと、元の動作が想定外に働くことがあるからです。vi のコマンドモードでは、末尾の 1 つ手前へ置きます。

## ここがすごい

- **条件に合わないときは黙って戻る**: 候補が無い、またはカーソルが途中にあるときは、何もせず元の動作に任せます。キーが壊れないための、慎重な作りです。
- **モードの違いを吸収する**: vi のモードでは、末尾の位置が 1 つずれます。`KEYMAP` を見て補正するので、どの操作でも自然に確定します。
- **処理の順番に意味がある**: カーソルを動かすのは、元の動作を実行した後です。順番を入れ替えると、動作の結果が変わってしまいます。

## まとめ

- 候補の受け入れは、末尾にカーソルがあるときだけに限ると安全。
- 操作のモードごとに位置がずれるなら、先に補正する。
- 元の動作を先に実行し、そのあとで位置を整えると、思わぬ副作用を防げる。
