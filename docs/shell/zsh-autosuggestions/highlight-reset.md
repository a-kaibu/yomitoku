---
title: "候補の色付けを、前回の範囲だけ取り消す"
description: "前回登録した候補の色付けの範囲を、region_highlight の一覧から取り除き、記録を消す関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/highlight.zsh"
lines: [7, 14]
function: "_zsh_autosuggest_highlight_reset"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`_zsh_autosuggest_highlight_reset` は、**前回付けた候補の色の範囲だけを取り消す** 関数です。ほかの色の指定は、そのまま残します。

候補の色は、入力が変わるたびに付け直されます。古い色が残ると、表示がずれてしまいます。この関数は、前回の分だけを正確に消します。

## コード

```zsh:line-numbers=7
_zsh_autosuggest_highlight_reset() {
	typeset -g _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT

	if [[ -n "$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT" ]]; then
		region_highlight=("${(@)region_highlight:#$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT}")
		unset _ZSH_AUTOSUGGEST_LAST_HIGHLIGHT
	fi
}
```

## 前提知識

- **`region_highlight`**: 文字の範囲ごとに色を指定する、zsh の配列です。
- **`_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT`**: 前回登録した色の指定を覚えておく変数です。`highlight_apply` が記録します。
- **`(@)` と `:#` の組み合わせ**: 配列から、指定した値に一致する要素を取り除く書き方です。
- **`unset`**: 変数を消して、記録を空にします。

## 何をしているか

### 1. 記録があるか確かめる

```zsh:line-numbers=9

```

前回の色の記録が残っていれば、取り消す対象があります。

### 2. 一致する範囲を一覧から取り除く

```zsh:line-numbers=10
	if [[ -n "$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT" ]]; then
```

`region_highlight` から、記録と同じ値の要素だけを取り除きます。ほかの色の指定は、残ります。

### 3. 記録を消す

```zsh:line-numbers=11
		region_highlight=("${(@)region_highlight:#$_ZSH_AUTOSUGGEST_LAST_HIGHLIGHT}")
```

取り消したあとで、記録の変数を消します。次に候補が無いとき、同じ処理を繰り返さないようにするためです。

## ここがすごい

- **対象を正確に絞る**: 範囲の値そのもので照合するので、ほかの色を誤って消しません。
- **記録と表示を連動させる**: 色を付けた関数が記録を残し、この関数が同じ値で消すので、対になっています。
- **処理を最小に保つ**: 記録が無ければ何もしません。不要な書き換えを避けられます。

## まとめ

- 表示の上に重ねた色は、付けたときの値を覚えておくと正確に消せる。
- 一覧の中から一部だけを消すときは、値で照合すると安全。
- 付けると消すを対にして書くと、取り残しが起きにくい。
