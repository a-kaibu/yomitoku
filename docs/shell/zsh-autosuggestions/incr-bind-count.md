---
title: "キーの割り当ての回数を 1 つ増やす"
description: "同じ動作を何回割り当てたかを記録する配列の値を 1 増やし、その値を変数に入れる関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/bind.zsh"
lines: [6, 9]
function: "_zsh_autosuggest_incr_bind_count"
difficulty: 1
format: 2
tags: [設計パターン, イディオム, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_incr_bind_count` は、**ある動作を割り当てた回数を 1 つ増やして記録する** 関数です。同じ名前の動作が、何度も割り当てられるのを追跡するために使われます。

割り当てを重ねると、元の動作を呼ぶ仕組みも重なります。回数を数えておけば、重なった動作の名前を、一意に作り分けられます。

## コード

```zsh:line-numbers=6
_zsh_autosuggest_incr_bind_count() {
	typeset -gi bind_count=$((_ZSH_AUTOSUGGEST_BIND_COUNTS[$1]+1))
	_ZSH_AUTOSUGGEST_BIND_COUNTS[$1]=$bind_count
}
```

## 前提知識

- **連想配列**: 文字の鍵に、値を結びつける型です。ここでは、動作の名前が鍵になります。
- **`typeset -gi`**: 関数の外からも見える、整数型の変数を作ります。
- **算術の `$(( ))`**: 数の計算をする書き方です。ここでは、回数に 1 を足しています。
- **割り当ての重なり**: 同じキーに動作をかぶせると、元の動作の上に新しい動作が乗る状態を指します。

## 何をしているか

### 1. 現在の回数に 1 を足す

```zsh:line-numbers=7
	typeset -gi bind_count=$((_ZSH_AUTOSUGGEST_BIND_COUNTS[$1]+1))
```

鍵に対応する現在の回数に 1 を足し、整数の変数 `bind_count` に入れます。最初の一回は、まだ記録が無いので 1 になります。

### 2. 新しい回数を記録する

```zsh:line-numbers=8
	_ZSH_AUTOSUGGEST_BIND_COUNTS[$1]=$bind_count
```

計算した値を、同じ鍵の記録に書き戻します。次の回には、この値から数えられます。

## ここがすごい

- **鍵ごとに数える**: 一つの変数で全ての動作を数えられるように、連想配列を使っています。
- **結果を変数に残す**: 更新した値を `bind_count` に入れて、呼び出し側でも使えるようにしています。
- **短く書ける**: 読み書きを 2 行で済ませ、関数の目的が一目で分かります。

## まとめ

- 回数の記録は、鍵ごとの連想配列にまとめると管理しやすい。
- 更新した値は、そのまま変数に残すと使い回しやすい。
- 小さな関数でも、役割を 1 つに絞ると読みやすい。
