---
title: "元のキー動作を、引数付きで呼び出す"
description: "割り当てる前の元の動作があれば、引数を渡して呼び出す関数。元の動作が無ければ何もしない。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/bind.zsh"
lines: [95, 106]
function: "_zsh_autosuggest_invoke_original_widget"
difficulty: 2
format: 2
tags: [設計パターン, CLI, イディオム]
---
## ひとことで

`_zsh_autosuggest_invoke_original_widget` は、**キーに割り当てる前の元の動作を、引数を付けて呼び出す** 関数です。候補の仕組みが、キーの本来の働きを壊さないようにするための橋渡しです。

候補の仕組みは、キーの動作をかぶせて書き換えます。元の動作を呼ぶ窓口が無いと、キーが効かなくなってしまいます。この関数が、その窓口になります。

## コード

::: code-group

```zsh:line-numbers=95 [日本語訳]
_zsh_autosuggest_invoke_original_widget() {
	# 引数が 1 つも無いときは、何もしません。
	(( $# )) || return 0

	local original_widget_name="$1"

	shift

	if (( ${+widgets[$original_widget_name]} )); then
		zle $original_widget_name -- $@
	fi
}
```

```zsh:line-numbers=95 [原文]
_zsh_autosuggest_invoke_original_widget() {
	# Do nothing unless called with at least one arg
	(( $# )) || return 0

	local original_widget_name="$1"

	shift

	if (( ${+widgets[$original_widget_name]} )); then
		zle $original_widget_name -- $@
	fi
}
```

:::

## 前提知識

- **ウィジェット**: zsh のラインエディタで、キーに割り当てられた動作です。
- **`widgets` 連想配列**: 今ある全てのウィジェットを、名前から調べられる zsh の変数です。
- **`zle`**: ラインエディタの動作を呼び出す命令です。`zle 名前 -- 引数` の形で使います。
- **`(( $# ))`**: 引数の数が 0 でなければ真になる、算術の判定です。

## 何をしているか

### 1. 引数が無ければ何もしない

```zsh:line-numbers=97
	(( $# )) || return 0

```

引数が 1 つも無ければ、何もせずに戻ります。動作の名前が無いと、呼び出せないためです。

### 2. 名前を取り出す

```zsh:line-numbers=100

	shift

```

最初の引数を、元の動作の名前として取っておき、残りの引数を一つずらして、動作に渡せる形にします。

### 3. 存在するときだけ呼ぶ

```zsh:line-numbers=104
		zle $original_widget_name -- $@
	fi
```

`widgets` の中にその名前があれば、`zle` で元の動作を呼び出します。残りの引数は、そのまま渡します。

## ここがすごい

- **存在を確かめてから呼ぶ**: 元の動作が無いときは、何もしません。エラーで止まるのを防ぎます。
- **引数を素通しする**: キーの動作に必要な情報を、加工せずに渡します。
- **名前と引数を分ける**: 最初の引数を名前として使い、残りを動作に渡します。役割の境界がはっきりします。

## まとめ

- 元の動作を呼ぶときは、存在を確かめてから呼ぶと安全。
- 引数は加工せずに渡すと、動作が本来どおりに働く。
- 名前と引数を分けて扱うと、呼び出しの形が統一される。
