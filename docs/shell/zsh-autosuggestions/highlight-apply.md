---
title: "薄い候補の範囲に、色の指定を付ける"
description: "表示中の候補の範囲を region_highlight に登録して色を付け、候補が無いときは記録を消す関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/highlight.zsh"
lines: [17, 26]
function: "_zsh_autosuggest_highlight_apply"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_highlight_apply` は、**薄く表示している候補の範囲に、色の指定を付ける** 関数です。候補の文字だけ、ほかの入力と違う色で見せます。

候補は入力の続きとして表示されますが、それが入力なのか候補なのかは、見た目で区別したいものです。この関数は、その区別のために色を登録します。

## コード

```zsh:line-numbers=17
_zsh_autosuggest_highlight_apply() {
	typeset -g _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT

	if (( $#POSTDISPLAY )); then
		typeset -g _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT="$#BUFFER $(($#BUFFER + $#POSTDISPLAY)) $ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE"
		region_highlight+=("$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT")
	else
		unset _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT
	fi
}
```

## 前提知識

- **`region_highlight`**: zsh のラインエディタで、文字の範囲ごとに色を指定する配列です。`開始 終了 スタイル` の形で書きます。
- **`POSTDISPLAY`**: カーソルの後ろに出ている候補の文字列です。ここが空でなければ、色を付ける対象があります。
- **`$ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE`**: 候補に使う色の指定です。利用者が設定でき、その値がそのまま登録されます。
- **`typeset -g`**: 関数の外からも参照できる変数を作ります。前回登録した範囲を覚えておくために使います。

## 何をしているか

### 1. 候補があるか調べる

```zsh:line-numbers=19

```

`POSTDISPLAY` の長さが 0 より大きければ、表示中の候補があります。

### 2. 範囲と色を記録して登録する

```zsh:line-numbers=20
	if (( $#POSTDISPLAY )); then
		typeset -g _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT="$#BUFFER $(($#BUFFER + $#POSTDISPLAY)) $ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE"
		region_highlight+=("$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT")
```

入力の末尾から、候補の末尾までの範囲を計算します。その範囲と色の指定を、後で消せるように変数へ記録します。そして `region_highlight` に登録して、色を付けます。

### 3. 候補が無ければ記録を消す

```zsh:line-numbers=23
	else
		unset _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT
	fi
```

候補が無いときは、前回の記録を `unset` で消します。古い色の指定を残さないためです。

## ここがすごい

- **後で消せるように記録する**: 登録した範囲を覚えておくので、次に色を消すとき、正確に同じ範囲を外せます。
- **範囲は数だけで表す**: 文字の位置を数で表すので、単純な計算だけで色の範囲が決まります。
- **状態を残さない分岐**: 候補が無ければ記録も消すので、色と表示が必ず一致します。

## まとめ

- 色の範囲は、後で消せるように必ず記録しておく。
- 表示と色の状態は、同じ条件で一緒に切り替える。
- 範囲は位置の数で表すと、計算が単純になる。
