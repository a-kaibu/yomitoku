---
title: "候補の表示を止める"
description: "無効の印を立てて、表示中の候補を消す関数。以後は入力のたびに候補を取りに行かなくなる。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [7, 10]
function: "_zsh_autosuggest_disable"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_disable` は、**薄い候補の表示を止める** 関数です。無効の印を立てて、今表示されている候補も消します。

入力中に候補が邪魔なときや、一時的に候補を使わないときに使います。有効に戻すには、`_zsh_autosuggest_enable` を使います。

## コード

```zsh:line-numbers=7
_zsh_autosuggest_disable() {
	typeset -g _ZSH_AUTOSUGGEST_DISABLED
	_zsh_autosuggest_clear
}
```

## 前提知識

- **`typeset -g`**: 関数の外からも見える変数を作ります。値を指定しないと、空の変数として作られます。
- **印としての変数**: 値の中身ではなく、変数があるかどうかで状態を表す書き方です。
- **`_zsh_autosuggest_clear`**: 表示中の候補を消す関数です。ここでは、無効にしたあとに呼ばれます。

## 何をしているか

### 1. 無効の印を立てる

```zsh:line-numbers=8
	typeset -g _ZSH_AUTOSUGGEST_DISABLED
```

`typeset -g` で、`_ZSH_AUTOSUGGEST_DISABLED` という変数を作ります。値を入れないので、存在するかどうかだけが状態を表します。

### 2. 表示中の候補を消す

```zsh:line-numbers=9
	_zsh_autosuggest_clear
```

今出ている候補も、すぐに消します。無効にした直後から、画面に薄い文字が残らないようにするためです。

## ここがすごい

- **印だけで状態を表す**: 真偽の値を比べる代わりに、変数の有無で判断します。ほかの関数は、その有無だけを見れば十分です。
- **即座に反映する**: 無効にすると同時に表示を消すので、利用者はすぐに変化を確かめられます。
- **有効化と対になる**: `enable` は印を外し、この関数は印を立てます。対の関係が分かりやすい設計です。

## まとめ

- 状態を表すには、変数の有無を使うと簡潔になる。
- 状態を変えたら、表示にもすぐ反映させる。
- 切り替えの対になる関数は、同じ形で揃えると読みやすい。
