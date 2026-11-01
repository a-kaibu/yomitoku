---
title: "入力を変えたあとに、候補を作り直すかを決める"
description: "キー入力で入力文字列が変わったとき、古い候補を流用するか、新しく候補を取りに行くかを判断する関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [39, 83]
function: "_zsh_autosuggest_modify"
difficulty: 3
format: 2
tags: [設計パターン, 並行処理, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_modify` は、**入力が変わったあとで、候補を作り直すかどうかを決める** 関数です。毎回取り直すと遅くなるので、使える候補はそのまま残します。

文字を 1 つ打つたびに、候補の検索を走らせると、入力が重くなります。この関数は、いくつかの条件を順に調べて、無駄な検索を省きます。

## コード

::: code-group

```zsh:line-numbers=39 [日本語訳]
_zsh_autosuggest_modify() {
	local -i retval

	# zsh 5.4 以降でだけ使えます。
	local -i KEYS_QUEUED_COUNT

	# 入力と表示中の候補を保存します。
	local orig_buffer="$BUFFER"
	local orig_postdisplay="$POSTDISPLAY"

	# 次の候補を待つ間は、表示を消します。
	POSTDISPLAY=

	# 元の動作が入力を書き換えることがあります。
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	emulate -L zsh

	# すぐ読み込める入力が残っていれば、候補は取りに行きません。
	if (( $PENDING > 0 || $KEYS_QUEUED_COUNT > 0 )); then
		POSTDISPLAY="$orig_postdisplay"
		return $retval
	fi

	# 手で候補を打ち進めた場合や、入力が変わっていない場合は、そのまま使います。
	if [[ "$BUFFER" = "$orig_buffer"* && "$orig_postdisplay" = "${BUFFER:$#orig_buffer}"* ]]; then
		POSTDISPLAY="${orig_postdisplay:$(($#BUFFER - $#orig_buffer))}"
		return $retval
	fi

	# 候補の表示が無効なら、取りに行きません。
	if (( ${+_ZSH_AUTOSUGGEST_DISABLED} )); then
		return $?
	fi

	# 変更後の入力が空でなければ、新しい候補を取りに行きます。
	if (( $#BUFFER > 0 )); then
		if [[ -z "$ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE" ]] || (( $#BUFFER <= $ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE )); then
			_zsh_autosuggest_fetch
		fi
	fi

	return $retval
}
```

```zsh:line-numbers=39 [原文]
_zsh_autosuggest_modify() {
	local -i retval

	# Only available in zsh >= 5.4
	local -i KEYS_QUEUED_COUNT

	# Save the contents of the buffer/postdisplay
	local orig_buffer="$BUFFER"
	local orig_postdisplay="$POSTDISPLAY"

	# Clear suggestion while waiting for next one
	POSTDISPLAY=

	# Original widget may modify the buffer
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	emulate -L zsh

	# Don't fetch a new suggestion if there's more input to be read immediately
	if (( $PENDING > 0 || $KEYS_QUEUED_COUNT > 0 )); then
		POSTDISPLAY="$orig_postdisplay"
		return $retval
	fi

	# Optimize if manually typing in the suggestion or if buffer hasn't changed
	if [[ "$BUFFER" = "$orig_buffer"* && "$orig_postdisplay" = "${BUFFER:$#orig_buffer}"* ]]; then
		POSTDISPLAY="${orig_postdisplay:$(($#BUFFER - $#orig_buffer))}"
		return $retval
	fi

	# Bail out if suggestions are disabled
	if (( ${+_ZSH_AUTOSUGGEST_DISABLED} )); then
		return $?
	fi

	# Get a new suggestion if the buffer is not empty after modification
	if (( $#BUFFER > 0 )); then
		if [[ -z "$ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE" ]] || (( $#BUFFER <= $ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE )); then
			_zsh_autosuggest_fetch
		fi
	fi

	return $retval
}
```

:::

## 前提知識

- **`PENDING`と`KEYS_QUEUED_COUNT`**: zsh のラインエディタで、まだ読み込まれていない入力がどれだけあるかを表す変数です。入力が続いているときは、途中の状態を処理しないために使います。
- **`emulate -L zsh`**: この関数の中だけ、zsh の標準の設定で動かします。
- **部分一致の判断**: 元の入力の後ろに、古い候補が続いているかを文字列で比べます。打ち込んだ文字が候補と一致していれば、候補をそのまま短くできます。
- **`ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE`**: 利用者が設定できる上限です。入力がこの長さより長いと、候補を取りに行きません。

## 何をしているか

### 1. 入力を保存して、候補を一度消す

```zsh:line-numbers=40
	local -i retval

	# zsh 5.4 以降でだけ使えます。
	local -i KEYS_QUEUED_COUNT

	# 入力と表示中の候補を保存します。
	local orig_buffer="$BUFFER"
	local orig_postdisplay="$POSTDISPLAY"
```

変更の前の入力と、表示中の候補を保存します。それから候補を空にして、元のキー動作を実行します。元の動作が入力を書き換えるかもしれないためです。

### 2. 入力が続いているなら、古い候補を残す

```zsh:line-numbers=53
	_zsh_autosuggest_invoke_original_widget $@
	retval=$?

	emulate -L zsh
```

まだ読み込んでいない入力があれば、候補は作り直しません。直前の候補を戻して、ここで終わります。

### 3. 打ち込んだ分だけ候補を短くする

```zsh:line-numbers=59
	if (( $PENDING > 0 || $KEYS_QUEUED_COUNT > 0 )); then
		POSTDISPLAY="$orig_postdisplay"
		return $retval
	fi

```

元の入力の後ろに、古い候補がそのまま続いていれば、打った分だけ候補の先頭を切り落とします。新しく検索しなくても、正しい候補が残せます。

### 4. 無効なら、取りに行かない

```zsh:line-numbers=66
		POSTDISPLAY="${orig_postdisplay:$(($#BUFFER - $#orig_buffer))}"
		return $retval
	fi
```

候補の表示が無効なら、ここで何もせずに戻ります。

### 5. 空でなければ、新しく取りに行く

```zsh:line-numbers=71
	if (( ${+_ZSH_AUTOSUGGEST_DISABLED} )); then
		return $?
	fi

	# 変更後の入力が空でなければ、新しい候補を取りに行きます。
	if (( $#BUFFER > 0 )); then
```

入力が空でなく、上限より短ければ、`_zsh_autosuggest_fetch` で新しい候補を取りに行きます。上限は、設定されていないときは無視します。

## ここがすごい

- **速い道を先に試す**: 入力が続いているか、部分一致で済むかを先に調べます。重い検索は、本当に必要なときだけ行います。
- **状態を保存して戻す**: 途中で止まっても、表示が壊れないように、元の候補を保存しておきます。
- **上限で守る**: 長い入力に対して検索を続けると、時間がかかります。上限を設けると、その場合だけ候補を省けます。

## まとめ

- 入力が変わったら、まず古い結果を流用できないかを調べる。
- 重い処理は、条件を全部通ったときだけ実行する。
- 利用者が決められる上限を用意すると、遅さを抑えられる。
