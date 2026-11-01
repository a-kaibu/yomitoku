---
title: "Node.js の主要なバージョン番号だけを取り出す"
description: "node --version の出力から、先頭の v と、ピリオド以降の部分を取り除き、メジャーのバージョン番号だけを表示する関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [514, 522]
function: "prompt_pure_check_node_version"
difficulty: 2
format: 2
tags: [文字列処理, CLI, 設計パターン]
---
## ひとことで

`prompt_pure_check_node_version` は、**Node.js のバージョンから、メジャーの番号だけを取り出す** 関数です。`v20.11.0` のような表記から、`20` だけを表示します。

プロンプトには、Node.js の大きなバージョンだけを出せば十分です。細かい版数は、長くて邪魔になるため、ここで取り除いています。

## コード

::: code-group

```zsh:line-numbers=514 [日本語訳]
prompt_pure_check_node_version() {
	setopt localoptions noshwordsplit

	local version
	version=$(command node --version 2>/dev/null) || version=
	# 解析の前に空白を取り除きます。一部のバージョン管理ツールの shim は、先頭に改行を出すため、v が残らないようにします。
	version=${version//[[:space:]]/}
	print -r -- "${${version#v}%%.*}"
}
```

```zsh:line-numbers=514 [原文]
prompt_pure_check_node_version() {
	setopt localoptions noshwordsplit

	local version
	version=$(command node --version 2>/dev/null) || version=
	# Strip whitespace before parsing, so a leading newline (some version-manager shims emit one) does not leave the `v` in the version.
	version=${version//[[:space:]]/}
	print -r -- "${${version#v}%%.*}"
}
```

:::

## 前提知識

- **`node --version`**: Node.js の版数を表示するコマンドです。先頭に `v` が付きます。
- **`setopt localoptions noshwordsplit`**: この関数の中だけ、単語の分割の動きを zsh の既定に寄せる設定です。
- **`${var//[[:space:]]/}`**: 空白の文字をすべて取り除く書き方です。
- **`${var#v}` と `${var%%.*}`**: 先頭の `v` を取り除く書き方と、最初のピリオド以降を取り除く書き方です。

## 何をしているか

### 1. バージョンを取得する

```zsh:line-numbers=517
	local version
```

`node --version` の結果を変数に入れます。失敗したら、空の値にします。

### 2. 空白を取り除く

```zsh:line-numbers=519
	# 解析の前に空白を取り除きます。一部のバージョン管理ツールの shim は、先頭に改行を出すため、v が残らないようにします。
	version=${version//[[:space:]]/}
```

改行や空白が含まれていると、先頭の `v` が取れないことがあります。先に、すべての空白を消しておきます。

### 3. メジャーの番号を表示する

```zsh:line-numbers=521
	print -r -- "${${version#v}%%.*}"
```

先頭の `v` を取り除き、最初のピリオドより後ろを捨てて、残った数字を表示します。

## ここがすごい

- **失敗に強い**: `node` が無い環境でも、空の値を返すだけで、プロンプトが壊れません。
- **表示を短く保つ**: 大きなバージョンだけを出すので、プロンプトの幅を取りすぎません。
- **空白の混入に備える**: バージョン管理ツールの中には、先頭に改行を出すものがあります。先に空白を消す処理は、その事故を防ぎます。

## まとめ

- 外部コマンドの出力は、空白や改行が混じる前提で整える。
- 表示に必要な部分だけを取り出すと、画面が簡潔になる。
- 失敗しても表示が壊れない値を返すと、プロンプト全体が安定する。
