---
title: "候補の先頭から、カーソルの位置までだけ受け入れる"
description: "表示中の候補のうち、カーソルの動きに合わせた部分だけを入力へ取り込み、残りは薄い表示のまま残す関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [162, 194]
function: "_zsh_autosuggest_partial_accept"
difficulty: 4
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_partial_accept` は、**薄い候補のうち、カーソルが進んだ分だけを入力に取り込む** 関数です。候補を一度に全部受け入れる代わりに、単語などの単位で少しずつ確定できます。

たとえば候補が `git commit -m "fix"` のとき、途中まで確定し、残りは薄い表示として残します。長い候補を、必要なところだけ使うための操作です。

## コード

::: code-group

```zsh:line-numbers=162 [日本語訳]
_zsh_autosuggest_partial_accept() {
	local -i retval cursor_loc

	# 元の入力を保存して、後で戻せるようにします。
	local original_buffer="$BUFFER"

	# 一時的に候補を入力へ確定させます。
	BUFFER="$BUFFER$POSTDISPLAY"

	# 元のキー動作でカーソルを動かします。
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	# vi と emacs のモードの位置を揃えます。
	cursor_loc=$CURSOR
	if [[ "$KEYMAP" = "vicmd" ]]; then
		cursor_loc=$((cursor_loc + 1))
	fi

	# 元の入力の末尾より先にカーソルがあるとき
	if (( $cursor_loc > $#original_buffer )); then
		# カーソルより右の部分を、薄い候補として残します。
		POSTDISPLAY="${BUFFER[$(($cursor_loc + 1)),$#BUFFER]}"

		# 入力はカーソルの位置で切ります。
		BUFFER="${BUFFER[1,$cursor_loc]}"
	else
		# 元の入力に戻します。
		BUFFER="$original_buffer"
	fi

	return $retval
}
```

```zsh:line-numbers=162 [原文]
_zsh_autosuggest_partial_accept() {
	local -i retval cursor_loc

	# Save the contents of the buffer so we can restore later if needed
	local original_buffer="$BUFFER"

	# Temporarily accept the suggestion.
	BUFFER="$BUFFER$POSTDISPLAY"

	# Original widget moves the cursor
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	# Normalize cursor location across vi/emacs modes
	cursor_loc=$CURSOR
	if [[ "$KEYMAP" = "vicmd" ]]; then
		cursor_loc=$((cursor_loc + 1))
	fi

	# If we've moved past the end of the original buffer
	if (( $cursor_loc > $#original_buffer )); then
		# Set POSTDISPLAY to text right of the cursor
		POSTDISPLAY="${BUFFER[$(($cursor_loc + 1)),$#BUFFER]}"

		# Clip the buffer at the cursor
		BUFFER="${BUFFER[1,$cursor_loc]}"
	else
		# Restore the original buffer
		BUFFER="$original_buffer"
	fi

	return $retval
}
```

:::

## 前提知識

- **部分的な受け入れ**: 候補の一部だけを入力に取り込むことです。残りは、そのまま薄く表示されます。
- **`CURSOR`**: 入力行の中で、カーソルの位置を数で表す変数です。
- **`${BUFFER[a,b]}`**: 文字列の a 文字目から b 文字目までを切り出す zsh の書き方です。1 から数えます。
- **vi のコマンドモード**: 末尾の位置が、ほかのモードより 1 つ手前になる状態です。位置を揃える必要があります。
- **元のウィジェット**: 単語単位で進むなど、キーに割り当てられた本来の動作です。この関数の中で呼ばれ、カーソルを動かします。

## 何をしているか

### 1. 候補を一時的に入力へ足す

```zsh:line-numbers=166
	local original_buffer="$BUFFER"

	# 一時的に候補を入力へ確定させます。
	BUFFER="$BUFFER$POSTDISPLAY"

```

元の入力を保存してから、候補を入力の末尾へつなげます。カーソルを動かしてもらうため、仮に確定させるのです。

### 2. 元の動作でカーソルを動かす

```zsh:line-numbers=172
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	# vi と emacs のモードの位置を揃えます。
```

キーの本来の動作を実行します。これで、カーソルが「どこまで進むか」が決まります。位置は、vi のモードに合わせて揃えます。

### 3. カーソルが元の入力の先にあれば、切り分ける

```zsh:line-numbers=180

	# 元の入力の末尾より先にカーソルがあるとき
	if (( $cursor_loc > $#original_buffer )); then
		# カーソルより右の部分を、薄い候補として残します。
		POSTDISPLAY="${BUFFER[$(($cursor_loc + 1)),$#BUFFER]}"
```

カーソルが元の入力より先に進んでいれば、カーソルより右側を薄い候補として残し、左側だけを入力にします。

### 4. 進んでいなければ元に戻す

```zsh:line-numbers=185

		# 入力はカーソルの位置で切ります。
		BUFFER="${BUFFER[1,$cursor_loc]}"
```

カーソルが元の入力の中にとどまっていれば、入力を元の状態へ戻します。候補の確定は行いません。

## ここがすごい

- **仮に確定して、動きを借りる**: 候補を入力に足してから元の動作を使うので、単語の区切りなどを既存の動作に任せられます。新しく区切りの規則を作る必要がありません。
- **残りを捨てない**: カーソルより右の部分は、薄い候補として残します。続けて受け入れられます。
- **モードの差を吸収する**: vi と emacs のモードで位置がずれても、同じ判断ができるように補正しています。

## まとめ

- 部分的な確定は、仮に入力へ足して既存の動作に位置を決めてもらうと簡単。
- 残りを表示に戻せば、続けて使える。
- 異なるモードの位置差は、先に揃えてから比べる。
