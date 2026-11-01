---
title: "起動時に、キーの割り当てを設定する"
description: "プロンプトの表示前ごとに、候補の仕組みのキー割り当てをつなぎ直す入り口の関数。手動の設定があれば、自動の再割り当てを外す。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/start.zsh"
lines: [7, 19]
function: "_zsh_autosuggest_start"
difficulty: 2
format: 2
tags: [設計パターン, CLI, イディオム]
---
## ひとことで

`_zsh_autosuggest_start` は、**候補の仕組みを使い始めるときの入り口** です。キーの割り当てを整えて、候補が正しく動くようにします。

ほかのプラグインも、キーの動作をかぶせて書き換えます。候補の仕組みが後から割り当てられると、順序が崩れて表示が壊れることがあります。この関数は、その順序を保つ役割を担います。

## コード

::: code-group

```zsh:line-numbers=7 [日本語訳]
_zsh_autosuggest_start() {
	# 既定では、プロンプトの表示前ごとにキーの割り当てを直し、他のラッパーの外側に入るようにします。
	# 特に、他のラッパーに包まれると、色付けが壊れるためです。
	# また、割り当ての一覧の変更は、次のプロンプトで反映されます。
	# ただし、毎回の割り当ては負担が大きいです。
	# そのため、ZSH_AUTOSUGGEST_MANUAL_REBIND を設定すると、自動の割り当て直しを止められます。
	# 自動での再割り当てを止めます。
	if (( ${+ZSH_AUTOSUGGEST_MANUAL_REBIND} )); then
		add-zsh-hook -d precmd _zsh_autosuggest_start
	fi

	_zsh_autosuggest_bind_widgets
}
```

```zsh:line-numbers=7 [原文]
_zsh_autosuggest_start() {
	# By default we re-bind widgets on every precmd to ensure we wrap other
	# wrappers. Specifically, highlighting breaks if our widgets are wrapped by
	# zsh-syntax-highlighting widgets. This also allows modifications to the
	# widget list variables to take effect on the next precmd. However this has
	# a decent performance hit, so users can set ZSH_AUTOSUGGEST_MANUAL_REBIND
	# to disable the automatic re-binding.
	if (( ${+ZSH_AUTOSUGGEST_MANUAL_REBIND} )); then
		add-zsh-hook -d precmd _zsh_autosuggest_start
	fi

	_zsh_autosuggest_bind_widgets
}
```

:::

## 前提知識

- **`precmd` フック**: プロンプトを表示する直前に、自動で呼ばれる処理の一覧です。`add-zsh-hook` で登録します。
- **`add-zsh-hook -d`**: 登録されたフックを外す命令です。
- **`${+変数名}`**: 変数が定義されているかを調べる書き方です。値の中身は見ません。
- **キーの割り当て**: どのキーで、どの動作をするかを結びつけることです。

## 何をしているか

### 1. 手動の設定があるか調べる

```zsh:line-numbers=12
	# そのため、ZSH_AUTOSUGGEST_MANUAL_REBIND を設定すると、自動の割り当て直しを止められます。
	# 自動での再割り当てを止めます。
	if (( ${+ZSH_AUTOSUGGEST_MANUAL_REBIND} )); then
		add-zsh-hook -d precmd _zsh_autosuggest_start
	fi
```

`ZSH_AUTOSUGGEST_MANUAL_REBIND` が定義されていれば、次のプロンプトで自動的に割り当て直す処理を外します。

### 2. キーの割り当てを行う

```zsh:line-numbers=18
	_zsh_autosuggest_bind_widgets
```

どの場合も、最後に `_zsh_autosuggest_bind_widgets` を呼んで、キーの割り当てを行います。

## ここがすごい

- **順序を保つために毎回やり直す**: 他のプラグインが後から書き換えても、プロンプトごとに割り当てを直すので、候補が正しく動きます。
- **遅さの代わりを用意する**: 毎回の割り当ては少し重いので、利用者が手動に切り替えられます。速さと正しさを、選ぶことができます。
- **設定の変更がすぐ効く**: 割り当ての一覧を書き換えると、次のプロンプトで反映されます。

## まとめ

- 他の仕組みと併用するときは、割り当ての順序が崩れないように毎回直す。
- 重い処理は、利用者が切り替えられる道を残す。
- 設定の変化は、次の節目で反映されるように作ると分かりやすい。
