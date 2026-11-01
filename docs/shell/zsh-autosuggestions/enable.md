---
title: "無効にした候補の表示を、再び有効にする"
description: "無効の印を外して候補の表示を再開する関数。入力が既にあれば、その場で候補を取りに行く。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [13, 19]
function: "_zsh_autosuggest_enable"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_enable` は、**止めていた候補の表示を再開する** 関数です。無効の印を外し、入力が既にあれば、その時点の候補を取りに行きます。

候補を無効にしたあとで有効に戻しても、入力中の文字に対する候補がすぐ出るようにしています。戻した直後に画面が空っぽになるのを防ぐ工夫です。

## コード

```zsh:line-numbers=13
_zsh_autosuggest_enable() {
	unset _ZSH_AUTOSUGGEST_DISABLED

	if (( $#BUFFER )); then
		_zsh_autosuggest_fetch
	fi
}
```

## 前提知識

- **`unset`**: 変数を消す命令です。ここでは、無効の印を消して、無効の状態を解除します。
- **`$#BUFFER`**: 入力中の文字列の長さです。0 より大きければ、何か打ち込まれています。
- **`_zsh_autosuggest_fetch`**: 入力に対する候補を取りに行く関数です。有効になったあとで、続けて候補を用意するために呼ばれます。

## 何をしているか

### 1. 無効の印を外す

```zsh:line-numbers=14
	unset _ZSH_AUTOSUGGEST_DISABLED
```

`unset` で `_ZSH_AUTOSUGGEST_DISABLED` を消すと、無効の状態が解除されます。この後は、候補の表示が再び動くようになります。

### 2. 入力があれば候補を取りに行く

```zsh:line-numbers=16
	if (( $#BUFFER )); then
		_zsh_autosuggest_fetch
	fi
```

`$BUFFER` が空でなければ、打ち込み途中の文字があるということです。そのときは `_zsh_autosuggest_fetch` を呼んで、その文字に対する候補を取りに行きます。空なら何もしません。

## ここがすごい

- **状態の変化と後始末を一度に行う**: 印を外す処理と、候補を取り直す処理を、同じ関数で続けて行います。有効に戻した直後から、正しい表示になります。
- **条件を付けて無駄を省く**: 入力が空のときは、候補を取りに行きません。空の入力に候補を出しても意味がないためです。
- **切り替えの相手と対になる**: 無効にする関数と対になっています。無効にすると表示を消し、有効にすると取り直す、という組み合わせです。

## まとめ

- 状態を戻すときは、印を外すだけでなく、表示も取り直すと抜けが無い。
- 空の入力には候補を出さないよう、先に条件を調べる。
- 対になる「無効にする」と組にすると、動きが読みやすい。
