---
title: "候補の取得方法を順番に試して、最初に見つかったものを使う"
description: "ZSH_AUTOSUGGEST_STRATEGY に並んだ方法を順に試し、入力と先頭が一致する候補が見つかった時点で止める関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/fetch.zsh"
lines: [9, 27]
function: "_zsh_autosuggest_fetch_suggestion"
difficulty: 2
format: 2
tags: [設計パターン, 文字列処理, イディオム]
---
## ひとことで

`_zsh_autosuggest_fetch_suggestion` は、**候補を探す方法を順番に試し、最初に当たったものを採用する** 関数です。方法は利用者が `ZSH_AUTOSUGGEST_STRATEGY` で並べられます。

たとえば「履歴から探す」「補完から探す」を並べておくと、履歴で見つからなければ補完を試します。複数の探し方を、1 つの入り口にまとめた形です。

## コード

::: code-group

```zsh:line-numbers=9 [日本語訳]
_zsh_autosuggest_fetch_suggestion() {
	typeset -g suggestion
	local -a strategies
	local strategy

	# 配列として扱えるように分けます。
	strategies=(${=ZSH_AUTOSUGGEST_STRATEGY})

	for strategy in $strategies; do
		# 候補の取得方法を 1 つ試します。
		_zsh_autosuggest_strategy_$strategy "$1"

		# 候補が入力の先頭と一致しなければ、捨てます。
		[[ "$suggestion" != "$1"* ]] && unset suggestion

		# 候補が残ったら、そこで繰り返しを止めます。
		[[ -n "$suggestion" ]] && break
	done
}
```

```zsh:line-numbers=9 [原文]
_zsh_autosuggest_fetch_suggestion() {
	typeset -g suggestion
	local -a strategies
	local strategy

	# Ensure we are working with an array
	strategies=(${=ZSH_AUTOSUGGEST_STRATEGY})

	for strategy in $strategies; do
		# Try to get a suggestion from this strategy
		_zsh_autosuggest_strategy_$strategy "$1"

		# Ensure the suggestion matches the prefix
		[[ "$suggestion" != "$1"* ]] && unset suggestion

		# Break once we've found a valid suggestion
		[[ -n "$suggestion" ]] && break
	done
}
```

:::

## 前提知識

- **ストラテジー**: 候補を探す方法の 1 つです。`_zsh_autosuggest_strategy_履歴` のように、名前の規則で関数が用意されています。
- **`${=変数}`**: 空白で区切られた文字列を、配列に分けて展開する zsh の書き方です。
- **`typeset -g`**: 関数の外からも見える変数を作ります。ここでは候補の結果を外へ返すために使います。
- **前方一致**: 入力の文字列が、候補の先頭と一致することです。候補が入力の続きでなければ、表示する意味がありません。

## 何をしているか

### 1. 方法の一覧を配列にする

```zsh:line-numbers=12
	local strategy

	# 配列として扱えるように分けます。
	strategies=(${=ZSH_AUTOSUGGEST_STRATEGY})

```

設定の文字列を、空白で区切って配列に分けます。これで、方法を 1 つずつ取り出せます。

### 2. 方法を順に実行する

```zsh:line-numbers=18
		# 候補の取得方法を 1 つ試します。
		_zsh_autosuggest_strategy_$strategy "$1"
```

それぞれの方法を、入力の文字列を渡して呼び出します。方法の名前は、設定の値に `_zsh_autosuggest_strategy_` を付けたものです。

### 3. 前方一致しなければ捨てる

```zsh:line-numbers=21
		# 候補が入力の先頭と一致しなければ、捨てます。
		[[ "$suggestion" != "$1"* ]] && unset suggestion
```

見つかった候補が、入力の先頭と一致しなければ、候補を消します。入力の続きとして使えないものは、表示しないという判断です。

### 4. 見つかったら止める

```zsh:line-numbers=24
		# 候補が残ったら、そこで繰り返しを止めます。
		[[ -n "$suggestion" ]] && break
	done
```

候補が残っていれば、そこで繰り返しを終わります。後ろの方法は試しません。

## ここがすごい

- **利用者が順番を決められる**: 設定の並び順で、探す優先順位が決まります。コードを書き換えずに、好みに合わせられます。
- **早く止まる**: 当たった時点で残りを試さないので、無駄な検索を省けます。
- **不正な結果を持ち越さない**: 一致しない候補はすぐ消すので、次の方法で誤った値が残りません。

## まとめ

- 複数の探し方は、順番のある一覧にして試すと、設定で差し替えやすい。
- 結果は、条件に合った時点で採用して止める。
- 中間の結果が条件を満たさなければ、必ず捨てる。
