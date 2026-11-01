---
title: "入力のたびに候補を取りに行く、同期と非同期の分かれ目"
description: "入力された文字列から候補を探す入り口の関数。非同期の設定があれば裏で取りに行き、なければその場で探して表示する。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [86, 94]
function: "_zsh_autosuggest_fetch"
difficulty: 2
format: 2
tags: [並行処理, 設計パターン, CLI]
---
## ひとことで

`_zsh_autosuggest_fetch` は、入力中の文字列（`$BUFFER`）に対する **履歴の候補を取りに行く** 入り口の関数です。候補を探す方法を、設定によって 2 通りに切り替えます。

zsh-autosuggestions は、文字を打つたびに、薄く表示される候補を更新します。候補の検索に時間がかかると、入力が遅れて感じられます。そこで、非同期で裏に任せる選択肢も用意しています。この関数は、その分かれ目です。

## コード

```zsh:line-numbers=86
_zsh_autosuggest_fetch() {
	if (( ${+ZSH_AUTOSUGGEST_USE_ASYNC} )); then
		_zsh_autosuggest_async_request "$BUFFER"
	else
		local suggestion
		_zsh_autosuggest_fetch_suggestion "$BUFFER"
		_zsh_autosuggest_suggest "$suggestion"
	fi
}
```

## 前提知識

- **`$BUFFER`**: zsh のラインエディタで、今入力中の行の文字列が入る特殊変数です。
- **`${+変数名}`**: 変数が定義されていれば 1、そうでなければ 0 になる、zsh の書き方です。ここでは、設定変数の有無を調べるために使われています。
- **非同期処理**: 結果を待たずに、別の処理を裏で走らせる方法です。結果が出たら後から画面に反映します。
- **`local`**: 関数の中だけで使う変数を作ります。

## 何をしているか

### 1. 非同期の設定があるか調べる

```zsh:line-numbers=87
	if (( ${+ZSH_AUTOSUGGEST_USE_ASYNC} )); then
		_zsh_autosuggest_async_request "$BUFFER"
```

`ZSH_AUTOSUGGEST_USE_ASYNC` が定義されていれば、`_zsh_autosuggest_async_request` に現在の入力を渡して、裏で候補を取りに行かせます。

### 2. 同期の場合は、その場で探す

```zsh:line-numbers=90
		local suggestion
		_zsh_autosuggest_fetch_suggestion "$BUFFER"
		_zsh_autosuggest_suggest "$suggestion"
```

設定が無ければ、`local` で結果を受ける変数を作り、`_zsh_autosuggest_fetch_suggestion` で候補を探します。見つかった候補を、続けて `_zsh_autosuggest_suggest` に渡して表示します。

非同期の場合は、結果が出たあとで別の関数が表示を更新するので、この関数は依頼を出すだけで終わります。

## ここがすごい

- **速さを選べる**: 多くの環境では同期の方法で十分ですが、履歴が大きい人は非同期を選べます。同じ入り口から、2 つの方法を切り替えられるようにしています。
- **依頼と結果を分ける**: 非同期では、依頼と表示の処理を別々にしています。入力を止めずに、候補が見つかったときだけ画面を更新できます。
- **変数の有無で切り替え**: 設定の値を比べるのではなく、定義されているかだけで判断しています。ユーザーが設定を書いていなければ、既定の動きになります。

## まとめ

- 重い検索は、裏で行う選択肢を用意すると入力が止まらない。
- 同じ入り口で同期と非同期を切り替えると、使う人が選べる。
- 設定は「定義されているか」で判断すると、既定の動きを守りやすい。
