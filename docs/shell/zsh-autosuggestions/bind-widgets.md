---
title: "登録されている全てのキー動作に、候補の仕組みをつなげる"
description: "zle で使える動作の一覧を調べ、除外されたもの以外を、候補の表示や確定の役割ごとに割り当て直す関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/bind.zsh"
lines: [63, 92]
function: "_zsh_autosuggest_bind_widgets"
difficulty: 4
format: 2
tags: [設計パターン, イディオム, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_bind_widgets` は、**zsh のキー動作の全てを調べて、候補の仕組みにつなぎ直す** 関数です。どの動作で候補を消すか、確定するか、実行するかを、一覧から振り分けます。

zsh にはたくさんのキー動作があります。その全てを手で書くのは大変なので、この関数が一覧を読んで、自動で割り当てます。

## コード

::: code-group

```zsh:line-numbers=63 [日本語訳]
_zsh_autosuggest_bind_widgets() {
	emulate -L zsh

 	local widget
	local ignore_widgets

	ignore_widgets=(
		.\*
		_\*
		${_ZSH_AUTOSUGGEST_BUILTIN_ACTIONS/#/autosuggest-}
		$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX\*
		$ZSH_AUTOSUGGEST_IGNORE_WIDGETS
	)

	# 割り当ての対象になりうる全ての動作を探し、適切に割り当てます。
	for widget in ${${(f)"$(builtin zle -la)"}:#${(j:|:)~ignore_widgets}}; do
		if [[ -n ${ZSH_AUTOSUGGEST_CLEAR_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget clear
		elif [[ -n ${ZSH_AUTOSUGGEST_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget accept
		elif [[ -n ${ZSH_AUTOSUGGEST_EXECUTE_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget execute
		elif [[ -n ${ZSH_AUTOSUGGEST_PARTIAL_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget partial_accept
		else
			# 役割が決まっていない動作は、入力を変えるかもしれないものとして扱います。
			_zsh_autosuggest_bind_widget $widget modify
		fi
	done
}
```

```zsh:line-numbers=63 [原文]
_zsh_autosuggest_bind_widgets() {
	emulate -L zsh

 	local widget
	local ignore_widgets

	ignore_widgets=(
		.\*
		_\*
		${_ZSH_AUTOSUGGEST_BUILTIN_ACTIONS/#/autosuggest-}
		$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX\*
		$ZSH_AUTOSUGGEST_IGNORE_WIDGETS
	)

	# Find every widget we might want to bind and bind it appropriately
	for widget in ${${(f)"$(builtin zle -la)"}:#${(j:|:)~ignore_widgets}}; do
		if [[ -n ${ZSH_AUTOSUGGEST_CLEAR_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget clear
		elif [[ -n ${ZSH_AUTOSUGGEST_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget accept
		elif [[ -n ${ZSH_AUTOSUGGEST_EXECUTE_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget execute
		elif [[ -n ${ZSH_AUTOSUGGEST_PARTIAL_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget partial_accept
		else
			# Assume any unspecified widget might modify the buffer
			_zsh_autosuggest_bind_widget $widget modify
		fi
	done
}
```

:::

## 前提知識

- **ウィジェット**: zsh のラインエディタで、キーに割り当てられた 1 つの動作です。
- **`zle -la`**: 使える全てのウィジェットの名前を一覧にするコマンドです。
- **`(f)` フラグ**: 文字列を改行で分けて、配列にする zsh の書き方です。
- **`${配列:#パターン}`**: 配列からパターンに一致する要素を取り除く書き方です。ここでは、除外する名前を省きます。
- **配列の添字検索 `[(r)...]`**: 配列の中から、一致する値を探す書き方です。見つからないと空になります。

## 何をしているか

### 1. 除外する動作の一覧を作る

```zsh:line-numbers=66
 	local widget
	local ignore_widgets

	ignore_widgets=(
		.\*
		_\*
		${_ZSH_AUTOSUGGEST_BUILTIN_ACTIONS/#/autosuggest-}
		$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX\*
```

対応しない名前のパターンを配列に集めます。内部用の名前、候補の仕組み自身の動作、利用者が除外を指定したものなどです。

### 2. 全ての動作を順に調べる

```zsh:line-numbers=76

```

`zle -la` の結果を改行で分けて、除外パターンに一致しないものだけを取り出し、順に繰り返します。

### 3. 役割ごとに割り当てる

```zsh:line-numbers=77
	# 割り当ての対象になりうる全ての動作を探し、適切に割り当てます。
	for widget in ${${(f)"$(builtin zle -la)"}:#${(j:|:)~ignore_widgets}}; do
		if [[ -n ${ZSH_AUTOSUGGEST_CLEAR_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget clear
		elif [[ -n ${ZSH_AUTOSUGGEST_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget accept
		elif [[ -n ${ZSH_AUTOSUGGEST_EXECUTE_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget execute
		elif [[ -n ${ZSH_AUTOSUGGEST_PARTIAL_ACCEPT_WIDGETS[(r)$widget]} ]]; then
			_zsh_autosuggest_bind_widget $widget partial_accept
```

その動作が、消す、確定する、実行する、部分的に確定する、のどの役割かを調べます。どれにも当たらなければ、「入力を変えるかもしれない動作」として扱います。

## ここがすごい

- **例外を一覧で管理する**: 除外の条件をパターンの配列にまとめているので、後から足すのが簡単です。
- **安全側に倒す**: どの役割にも当たらない動作は、入力を変えるものとして扱います。候補の表示を、常に更新できるように考えられています。
- **利用者の拡張に応える**: 利用者が役割の一覧を書き換えると、次の再設定で反映されます。

## まとめ

- 大量の動作は、一覧を読んで自動で割り当てると手間が減る。
- 除外の条件は、パターンの一覧にまとめると管理しやすい。
- 判断できないものは、安全な側の扱いにしておく。
