---
title: "パスの区切りだけを薄く表示する"
description: "カレントディレクトリのパスを表示するとき、スラッシュの部分だけを薄い色にし、先頭の / は明るいままにする関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [147, 162]
function: "prompt_pure_render_dimmed_path"
difficulty: 3
format: 2
tags: [文字列処理, CLI, 設計パターン]
---
## ひとことで

`prompt_pure_render_dimmed_path` は、**パスの中の区切り文字 `/` だけを薄い色で表示する** 関数です。たとえば `~/src/app` と出すとき、`/` だけを控えめに見せます。

ディレクトリの名前は目立たせ、区切りは背景に溶け込ませます。見た目を整えるための、小さな工夫です。

## コード

::: code-group

```zsh:line-numbers=147 [日本語訳]
prompt_pure_render_dimmed_path() {
	setopt localoptions noshwordsplit

	# PROMPT_SUBST から呼ばれるので、ディレクトリを移動して reset-prompt で描き直すときも、正しく表示されます。
	local current_path=${1:-${(%):-%~}}
	current_path=${current_path//\%/%%}

	local separator=$'%{\e[2m%}/%{\e[22m%}'
	# 絶対パスの先頭の / は、明るいままにします。
	local prefix=
	if [[ $current_path == /* ]]; then
		prefix=/
		current_path=${current_path:1}
	fi
	print -n -r -- "%F{${prompt_pure_colors[path]}}${prefix}${current_path//\//$separator}%f"
}
```

```zsh:line-numbers=147 [原文]
prompt_pure_render_dimmed_path() {
	setopt localoptions noshwordsplit

	# This runs from PROMPT_SUBST so directory changes followed by reset-prompt redraw correctly without precmd.
	local current_path=${1:-${(%):-%~}}
	current_path=${current_path//\%/%%}

	local separator=$'%{\e[2m%}/%{\e[22m%}'
	# Keep the leading / on absolute paths at full brightness.
	local prefix=
	if [[ $current_path == /* ]]; then
		prefix=/
		current_path=${current_path:1}
	fi
	print -n -r -- "%F{${prompt_pure_colors[path]}}${prefix}${current_path//\//$separator}%f"
}
```

:::

## 前提知識

- **`PROMPT_SUBST`**: zsh のプロンプトで、`%` や `$` を含む文字列を展開して表示する仕組みです。この関数は、その中から呼ばれます。
- **`%~`**: 現在のディレクトリを、ホームを `~` にした形で表す、プロンプトの特殊な書き方です。
- **`%{...%}`**: 中に書いた文字を、表示の幅に数えないための囲みです。色の指定などを入れるときに使われます。
- **`print -n -r --`**: 改行を付けず、バックスラッシュの解釈もしないで表示します。

## 何をしているか

### 1. 表示するパスを決める

```zsh:line-numbers=149

	# PROMPT_SUBST から呼ばれるので、ディレクトリを移動して reset-prompt で描き直すときも、正しく表示されます。
	local current_path=${1:-${(%):-%~}}
	current_path=${current_path//\%/%%}
```

引数が無ければ `%~` で現在のディレクトリを取ります。`%` は、プロンプトの特殊文字として解釈されないように、`%%` に直しておきます。

### 2. 先頭の / を分けておく

```zsh:line-numbers=155
	# 絶対パスの先頭の / は、明るいままにします。
	local prefix=
	if [[ $current_path == /* ]]; then
		prefix=/
		current_path=${current_path:1}
	fi
```

パスが `/` から始まるときは、先頭の `/` を別に取り出します。取り出した部分は、薄くせずに明るいまま表示するためです。

### 3. 区切りだけを薄く描いて表示する

```zsh:line-numbers=161
	print -n -r -- "%F{${prompt_pure_colors[path]}}${prefix}${current_path//\//$separator}%f"
}
```

残りのパスの `/` を、薄い色の区切りに置き換えて表示します。色はパスの色の設定から取り、最後に色を戻しています。

## ここがすごい

- **表示だけを加工する**: パスの実際の値は変えず、見た目だけを変えています。コマンドの実行には影響しません。
- **先頭の / の特別扱い**: 絶対パスの先頭だけは、目立つままにしています。どこから始まるかが、一目で分かります。
- **プロンプトの仕組みに合わせる**: `PROMPT_SUBST` から呼ばれるので、ディレクトリを移動したあとも、表示が正しく更新されます。

## まとめ

- 表示の区切りを薄くすると、名前が目立って読みやすくなる。
- 先頭の特別な記号は、別に扱うと意味が保てる。
- プロンプトの中で呼ばれる関数は、表示の特殊文字を必ずエスケープする。
