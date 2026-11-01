---
title: "候補の表示を、オンとオフで切り替える"
description: "候補の表示が無効かどうかを変数で調べ、無効なら有効に、有効なら無効にする関数。キーに割り当てて使う操作の入り口になる。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [22, 28]
function: "_zsh_autosuggest_toggle"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_toggle` は、**薄い候補の表示をオンとオフで入れ替える** 関数です。今が無効なら有効にし、有効なら無効にします。

入力中に候補が邪魔に感じるときや、逆に候補がほしいときに、同じ操作を繰り返せます。キーにこの関数を割り当てれば、1 回押すたびに状態が切り替わります。

## コード

```zsh:line-numbers=22
_zsh_autosuggest_toggle() {
	if (( ${+_ZSH_AUTOSUGGEST_DISABLED} )); then
		_zsh_autosuggest_enable
	else
		_zsh_autosuggest_disable
	fi
}
```

## 前提知識

- **`${+変数名}`**: 変数が定義されていれば 1、定義されていなければ 0 になる、zsh の書き方です。値の中身は見ません。
- **`if ... else ... fi`**: 条件によって、2 つのどちらかの処理を選ぶ書き方です。
- **有効と無効の印**: この実装では、無効になっているときだけ `_ZSH_AUTOSUGGEST_DISABLED` という変数を作ります。変数があるかどうかが、そのまま状態を表します。

## 何をしているか

### 1. 無効の印があるか調べる

```zsh:line-numbers=23
	if (( ${+_ZSH_AUTOSUGGEST_DISABLED} )); then
		_zsh_autosuggest_enable
```

`${+_ZSH_AUTOSUGGEST_DISABLED}` が 1 なら、無効の印が立っています。そのときは、有効にする関数を呼びます。

### 2. 無効でなければ、無効にする

```zsh:line-numbers=25
	else
		_zsh_autosuggest_disable
	fi
```

印が無ければ、今は有効です。そこで、無効にする関数を呼びます。切り替えの本体は、他の 2 つの関数に任せています。

## ここがすごい

- **状態を値ではなく印で持つ**: 有効なら何も無く、無効なら変数がある、という形です。`true` や `false` の値を比べる書き方より、単純に済みます。
- **中身を自分で持たない**: この関数は、表示を消すとか、候補を取り直すといった細かい処理をしません。それは有効と無効の関数の仕事です。切り替えだけに集中しています。
- **同じ操作を繰り返せる**: 押すたびに反対の状態へ進むので、利用者は今どちらか覚えていなくても使えます。

## まとめ

- 2 つの状態の切り替えは、印の有無で表すと簡潔になる。
- 切り替えの関数は、状態を変える処理を別の関数に任せると読みやすい。
- 同じ操作で状態が入れ替わるので、キーに割り当てやすい。
