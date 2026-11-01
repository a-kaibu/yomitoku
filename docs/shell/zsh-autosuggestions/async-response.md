---
title: "裏で取った候補を、結果が届いたときに表示する"
description: "非同期で候補を取りに行った処理から結果が届いたとき、ファイルの記述子から読み取って候補として表示し、受け取り用の処理を後片付けする関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/async.zsh"
lines: [60, 77]
function: "_zsh_autosuggest_async_response"
difficulty: 3
format: 2
tags: [並行処理, 設計パターン, CLI]
---
## ひとことで

`_zsh_autosuggest_async_response` は、**裏で候補を取りに行った処理から結果が届いたとき、それを候補として表示する** 関数です。結果を受け取る窓口は、ファイルの記述子（fd）です。

非同期の候補取得では、入力を止めずに、結果が出たときだけ画面を更新します。この関数は、その結果が届いた瞬間に呼ばれます。

## コード

::: code-group

```zsh:line-numbers=60 [日本語訳]
_zsh_autosuggest_async_response() {
	emulate -L zsh

	local suggestion

	if [[ -z "$2" || "$2" == "hup" ]]; then
		# fd から結果を全部読み、候補として渡します。
		IFS='' read -rd '' -u $1 suggestion
		zle autosuggest-suggest -- "$suggestion"

		# 読み終わった fd を閉じます。
		builtin exec {1}<&-
	fi

	# 必ず受け取りの登録を外します。
	zle -F "$1"
	_ZSH_AUTOSUGGEST_ASYNC_FD=
}
```

```zsh:line-numbers=60 [原文]
_zsh_autosuggest_async_response() {
	emulate -L zsh

	local suggestion

	if [[ -z "$2" || "$2" == "hup" ]]; then
		# Read everything from the fd and give it as a suggestion
		IFS='' read -rd '' -u $1 suggestion
		zle autosuggest-suggest -- "$suggestion"

		# Close the fd
		builtin exec {1}<&-
	fi

	# Always remove the handler
	zle -F "$1"
	_ZSH_AUTOSUGGEST_ASYNC_FD=
}
```

:::

## 前提知識

- **ファイルの記述子（fd）**: 開いているファイルや、パイプのような入出力の先を、番号で表したものです。
- **`zle -F`**: 指定した fd に、データが届いたときに呼ぶ関数を登録する zsh の命令です。`zle -F fd` で、その登録を外します。
- **`read -rd ''`**: 区切り文字を NUL に指定して、入力の終わりまで読む書き方です。
- **`zle autosuggest-suggest`**: 候補を表示するための、内部のウィジェットを呼ぶ命令です。
- **`emulate -L zsh`**: この関数の中だけ、zsh の標準の設定で動かします。

## 何をしているか

### 1. 正常な結果か調べる

```zsh:line-numbers=63
	local suggestion
```

第 2 引数が空か、`hup` であれば、結果を読み取ります。どちらも、正常に結果が届いた場合を表します。

### 2. fd から候補を読んで表示する

```zsh:line-numbers=64

	if [[ -z "$2" || "$2" == "hup" ]]; then
		# fd から結果を全部読み、候補として渡します。
```

fd から入力の終わりまで読み取って、候補の文字列に入れます。続けて、その候補を表示するウィジェットを呼びます。

### 3. fd を閉じる

```zsh:line-numbers=68
		zle autosuggest-suggest -- "$suggestion"

		# 読み終わった fd を閉じます。
```

読み終わった fd を閉じます。閉じないと、番号が使われたままになります。

### 4. 受け取り用の登録を外す

```zsh:line-numbers=73

	# 必ず受け取りの登録を外します。
	zle -F "$1"
	_ZSH_AUTOSUGGEST_ASYNC_FD=
```

`zle -F` で、この fd の受け取りを外します。そのあとで、非同期の fd の記録を空にします。

## ここがすごい

- **結果が届いた時だけ動く**: 入力を待たせずに、結果が届いた瞬間だけ画面が更新されます。
- **後片付けを必ず行う**: 結果が無くても、登録と記録を外します。古い fd が残ると、次の非同期処理と混ざるためです。
- **終了の合図を使う**: `hup` という合図は、処理が切れたことを表します。その場合も、同じ後片付けで締めくくれます。

## まとめ

- 非同期の結果は、届いた時点で受け取る仕組みにすると、入力を止めない。
- 受け取りの登録は、必ず外して後片付けする。
- 途中で切れた場合も、同じ経路で締めくくると扱いが単純になる。
