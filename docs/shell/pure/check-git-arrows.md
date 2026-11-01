---
title: "進みと遅れを、矢印の記号に変えてプロンプトに出す"
description: "上流より先行・遅延しているコミット数から、下向きと上向きの矢印を組み立てる関数。数が 0 の矢印は出さない。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [727, 736]
function: "prompt_pure_check_git_arrows"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`prompt_pure_check_git_arrows` は、ブランチの **先行と遅延の数** を、プロンプトに出す矢印の記号に変える関数です。遅れていれば `⇣`、先行していれば `⇡` を出します。どちらも 0 なら、何も出しません。

前の記事で扱った関数は、数の組を取り出していました。この関数は、その数を人が一目で分かる記号に変えます。表示の方法だけを担当し、数の計算は別の関数に任せています。

## コード

```zsh:line-numbers=727
prompt_pure_check_git_arrows() {
	setopt localoptions noshwordsplit
	local arrows left=${1:-0} right=${2:-0}

	(( right > 0 )) && arrows+=${PURE_GIT_DOWN_ARROW:-⇣}
	(( left > 0 )) && arrows+=${PURE_GIT_UP_ARROW:-⇡}

	[[ -n $arrows ]] || return
	typeset -g REPLY=$arrows
}
```

## 前提知識

- **`typeset -g REPLY=値`**: 結果を、グローバルな `REPLY` という変数に入れます。zsh の関数では、結果を返す慣習として使われています。
- **`arrows+=値`**: 変数に文字列を連結します。
- **`(( 式 ))`**: 算術の比較を行い、真なら成功します。
- **`${変数:-既定値}`**: 変数が無いとき、既定値を使います。ここでは矢印の記号をユーザーが変えられるようにするために使われています。
- **`return`**: 関数を途中で終わらせます。

## 何をしているか

### 1. 引数を受け取る

```zsh:line-numbers=728
	setopt localoptions noshwordsplit
	local arrows left=${1:-0} right=${2:-0}
```

先行の数を `left`、遅延の数を `right` として受け取ります。引数が無いときは 0 として扱います。

### 2. 遅れと先行に矢印を付ける

```zsh:line-numbers=731
	(( right > 0 )) && arrows+=${PURE_GIT_DOWN_ARROW:-⇣}
	(( left > 0 )) && arrows+=${PURE_GIT_UP_ARROW:-⇡}
```

遅れが 1 以上なら `⇣` を、先行が 1 以上なら `⇡` を、`arrows` に追加します。記号は `PURE_GIT_DOWN_ARROW` や `PURE_GIT_UP_ARROW` で変えられます。

### 3. 何も無ければ終わり、あれば返す

```zsh:line-numbers=734
	[[ -n $arrows ]] || return
	typeset -g REPLY=$arrows
```

矢印が 1 つも無ければ、何も返さずに終わります。あれば、`REPLY` に入れて返します。

## ここがすごい

- **表示の判断を 1 か所に**: 「数が 0 なら出さない」という判断を、この関数だけが持っています。呼ぶ側は、結果があるかどうかを見るだけで済みます。
- **記号を変えられる**: 既定の記号は、ユーザーの設定で変えられます。見た目の好みに合わせられる作りです。
- **計算と表示を分けている**: 数を数える処理と、記号にする処理を別々の関数にしているので、どちらも単独で読めます。

## まとめ

- 数の結果は、人が読みやすい記号に変えてから表示する。
- 0 の項目は出さないと、プロンプトがすっきりする。
- 記号は既定値を持たせて、ユーザーが変えられるようにすると使いやすい。
