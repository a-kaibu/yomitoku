---
title: "秒数を「1d 2h 3m 4s」のような表記に変える"
description: "経過秒数を日・時・分・秒に分け、0 の単位を省いた読みやすい文字列にして、指定された変数へ入れる関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [30, 43]
function: "prompt_pure_human_time_to_var"
difficulty: 2
format: 2
tags: [文字列処理, 数値計算, イディオム]
---
## ひとことで

`prompt_pure_human_time_to_var` は、**秒の数を「1d 2h 3m 4s」のような読みやすい表記に変える** 関数です。結果は、呼び出し側が指定した変数の中に入ります。

プロンプトに「このコマンドは 1 分 12 秒かかった」と出すときに使われます。生の秒数のままでは読みにくいので、単位をつけて整えています。

## コード

::: code-group

```zsh:line-numbers=30 [日本語訳]
prompt_pure_human_time_to_var() {
	local human total_seconds=$1 var=$2
	local days=$(( total_seconds / 60 / 60 / 24 ))
	local hours=$(( total_seconds / 60 / 60 % 24 ))
	local minutes=$(( total_seconds / 60 % 60 ))
	local seconds=$(( total_seconds % 60 ))
	(( days > 0 )) && human+="${days}d "
	(( hours > 0 )) && human+="${hours}h "
	(( minutes > 0 )) && human+="${minutes}m "
	human+="${seconds}s"

	# 呼び出し側が指定した変数に、人が読む形の時間を入れます。
	typeset -g "${var}"="${human}"
}
```

```zsh:line-numbers=30 [原文]
prompt_pure_human_time_to_var() {
	local human total_seconds=$1 var=$2
	local days=$(( total_seconds / 60 / 60 / 24 ))
	local hours=$(( total_seconds / 60 / 60 % 24 ))
	local minutes=$(( total_seconds / 60 % 60 ))
	local seconds=$(( total_seconds % 60 ))
	(( days > 0 )) && human+="${days}d "
	(( hours > 0 )) && human+="${hours}h "
	(( minutes > 0 )) && human+="${minutes}m "
	human+="${seconds}s"

	# Store human readable time in a variable as specified by the caller
	typeset -g "${var}"="${human}"
}
```

:::

## 前提知識

- **算術展開 `$(( ))`**: 数の計算をする書き方です。割り算の結果は、小数部分が切り捨てられます。
- **剰余 `%`**: 割り切れなかった余りを求める演算子です。時間の繰り上がりを表すのに使われています。
- **`typeset -g`**: 関数の外からも見える変数を作ります。`-g` が付くと、関数の中で作っても、呼び出し側に残ります。
- **間接参照 `"${var}"`**: 変数の名前を、別の変数に入れておく書き方です。ここでは、呼び出し側が指定した名前の変数に書き込みます。

## 何をしているか

### 1. 秒を日、時、分、秒に分ける

```zsh:line-numbers=32
	local days=$(( total_seconds / 60 / 60 / 24 ))
	local hours=$(( total_seconds / 60 / 60 % 24 ))
	local minutes=$(( total_seconds / 60 % 60 ))
	local seconds=$(( total_seconds % 60 ))
```

60 で割るごとに、単位が 1 つ上がります。日は 24 時間ごとに、時は 60 分ごとに、分は 60 秒ごとに数えます。`%` で、上の単位の分を取り除いています。

### 2. 0 でない単位だけを連ねる

```zsh:line-numbers=36
	(( days > 0 )) && human+="${days}d "
	(( hours > 0 )) && human+="${hours}h "
	(( minutes > 0 )) && human+="${minutes}m "
	human+="${seconds}s"
```

日、時、分は、0 より大きいときだけ文字列に足します。秒は必ず足します。そのため、「0s」や「5m 0s」のような、意味の無い 0 は出ません。

### 3. 呼び出し側の変数に入れる

```zsh:line-numbers=42
	typeset -g "${var}"="${human}"
```

`typeset -g` で、指定された名前の変数に結果を入れます。関数の中で作った変数は外から見えないので、この書き方で値を受け渡します。

## ここがすごい

- **単位の省略で読みやすくする**: 0 の単位を取るので、短く自然な表示になります。
- **結果の置き場所を選べる**: 関数は表示せず、どの変数に入れるかを呼び出し側に任せています。別の用途にも使い回せます。
- **桁の繰り上がりを式だけで表す**: 配列や分岐を使わず、割り算と余りだけで時間の単位を分けています。

## まとめ

- 数を人が読む形にするには、単位ごとに割り算と余りを使うと簡潔になる。
- 0 の単位を省くと、表示が自然になる。
- 結果を返す先を呼び出し側が決めると、関数を使い回しやすい。
