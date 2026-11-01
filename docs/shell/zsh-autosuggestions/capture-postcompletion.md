---
title: "補完の結果を、最初の 1 件だけ入力に入れる"
description: "補完の候補を集めるときに、最初の候補を入力へ入れ、候補の一覧は表示しないように設定する関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/strategies/completion.zsh"
lines: [8, 14]
function: "_zsh_autosuggest_capture_postcompletion"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_capture_postcompletion` は、**補完が終わったあとの状態を整える** 関数です。最初の候補を入力へ入れ、候補の一覧は出さないようにします。

補完の候補を、候補の仕組みに取り込むための準備として使われます。一覧を表示すると、画面が乱れるため、ここで止めています。

## コード

::: code-group

```zsh:line-numbers=8 [日本語訳]
_zsh_autosuggest_capture_postcompletion() {
	# 最初の候補を、必ず入力に入れます。
	compstate[insert]=1

	# 候補の一覧は表示しません。
	unset 'compstate[list]'
}
```

```zsh:line-numbers=8 [原文]
_zsh_autosuggest_capture_postcompletion() {
	# Always insert the first completion into the buffer
	compstate[insert]=1

	# Don't list completions
	unset 'compstate[list]'
}
```

:::

## 前提知識

- **`compstate`**: zsh の補完の状態を表す連想配列です。`insert` や `list` の値を変えると、補完の動きが変わります。
- **`compstate[insert]=1`**: 最初の候補を、入力へ自動で入れるように指定します。
- **`unset 'compstate[list]'`**: 候補の一覧を表示しない指定です。値を消すことで、一覧を出さなくなります。
- **補完の後処理**: 補完が候補を決めたあとに、zsh が呼ぶ仕組みです。

## 何をしているか

### 1. 最初の候補を入力に入れる

```zsh:line-numbers=9
	# 最初の候補を、必ず入力に入れます。
	compstate[insert]=1
```

`compstate[insert]` に 1 を入れて、最初の候補を入力の行に入れるように指定します。

### 2. 候補の一覧を表示させない

```zsh:line-numbers=13
	unset 'compstate[list]'
```

`compstate[list]` を消して、候補の一覧が画面に出ないようにします。

## ここがすごい

- **補完の仕組みの内部を使う**: 補完の状態を直接変えて、動きを調整しています。外から見える操作ではなく、内側の設定で制御しています。
- **必要な動きだけを変える**: 入れる動きと、一覧を出さない動きだけを変えています。他の補完の仕組みには触れません。
- **目的がはっきりしている**: 2 つの指定だけで、候補を取り込むための動きが完成します。

## まとめ

- 補完の動きを変えるときは、状態の値を直接指定すると簡潔になる。
- 目的に必要な指定だけに絞ると、副作用が少ない。
- 画面の表示は、一覧を出すかどうかで大きく変わる。
