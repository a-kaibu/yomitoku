---
title: "候補のコマンドに、特殊文字の \\ を付けて安全にする"
description: "文字列の中にある、シェルで特別な意味を持つ記号の前にバックスラッシュを付けて、そのまま表示や比較に使えるようにする関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/util.zsh"
lines: [6, 11]
function: "_zsh_autosuggest_escape_command"
difficulty: 3
format: 2
tags: [文字列処理, CLI, 正規表現]
---
## ひとことで

`_zsh_autosuggest_escape_command` は、**文字列の中のシェルで特別な意味をもつ記号の前に `\` を付ける** 関数です。`*` や `(` などが、そのまま文字として扱われるようにします。

候補を表示や検索に使うとき、記号が glob（ワイルドカード）や括弧として解釈されると、意図しない結果になります。この関数は、その事故を防ぎます。

## コード

::: code-group

```zsh:line-numbers=6 [日本語訳]
_zsh_autosuggest_escape_command() {
	setopt localoptions EXTENDED_GLOB

	# 文字列の中の特殊な記号を、拡張パターンを使ってエスケープします。
	echo -E "${1//(#m)[\"\'\\()\[\]|*?~]/\\$MATCH}"
}
```

```zsh:line-numbers=6 [原文]
_zsh_autosuggest_escape_command() {
	setopt localoptions EXTENDED_GLOB

	# Escape special chars in the string (requires EXTENDED_GLOB)
	echo -E "${1//(#m)[\"\'\\()\[\]|*?~]/\\$MATCH}"
}
```

:::

## 前提知識

- **glob（グロブ）**: `*` や `?` を使って、ファイル名などのパターンを表す仕組みです。zsh では、文字列の中でも解釈されることがあります。
- **`EXTENDED_GLOB`**: zsh の拡張されたパターン機能を有効にする設定です。`(#m)` のような書き方を使うために必要です。
- **`(#m)` と `$MATCH`**: パターンに一致した部分を `$MATCH` に入れる、zsh の書き方です。一致した文字を、置き換え先で再利用できます。
- **`echo -E`**: 引数を、バックスラッシュの解釈をせずに表示します。

## 何をしているか

### 1. 拡張パターンを有効にする

```zsh:line-numbers=7
	setopt localoptions EXTENDED_GLOB
```

この関数の中だけ、`EXTENDED_GLOB` を有効にします。`setopt localoptions` を使うので、関数を抜けると元の設定に戻ります。

### 2. 特殊な記号の前に \ を付ける

```zsh:line-numbers=9
	# 文字列の中の特殊な記号を、拡張パターンを使ってエスケープします。
	echo -E "${1//(#m)[\"\'\\()\[\]|*?~]/\\$MATCH}"
```

`"` や `'`、`\`、括弧、`|`、`*`、`?`、`~` などを一覧にして、見つけたら `\` を前に付けます。`$MATCH` が見つかった記号そのものを表します。

## ここがすごい

- **1 回の置き換えで済ませる**: 記号を 1 文字ずつ調べる代わりに、パターンで一度に置き換えています。短く読みやすい書き方です。
- **元の設定を汚さない**: `localoptions` を使い、拡張パターンの設定を関数の中だけに限っています。
- **`-E` で二重の解釈を避ける**: 結果を表示するとき、`echo -E` で余計なエスケープを解釈させません。

## まとめ

- 文字列を安全に扱うには、特殊な記号を前もって無効化する。
- 設定の変更は関数の中だけにとどめると、他に影響しない。
- 置き換えは、一致した部分を `$MATCH` で再利用すると簡潔になる。
