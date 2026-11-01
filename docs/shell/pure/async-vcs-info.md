---
title: "作業係の中で、Git のブランチの情報を集める"
description: "非同期の作業係の中で vcs_info を設定し、ブランチ名、リポジトリの場所、進行中の操作を取り出して表示する関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [336, 362]
function: "prompt_pure_async_vcs_info"
difficulty: 3
format: 2
tags: [並行処理, CLI, 設計パターン]
---
## ひとことで

`prompt_pure_async_vcs_info` は、**裏の作業係の中で、Git のブランチなどの情報を集める** 関数です。集めた情報は、プロンプトの表示に使われます。

Git の情報を集める処理は、入力のたびに行うと重くなります。そこで、作業係に任せます。ただし、作業係は本体の複製なので、利用者の設定を外して、動きを一定にしています。

## コード

::: code-group

```zsh:line-numbers=336 [日本語訳]
prompt_pure_async_vcs_info() {
	setopt localoptions noshwordsplit
	prompt_pure_async_print_generation

	# 非同期の作業係の中で vcs_info を設定します。これで、本体の vcs_info は利用者が自由に使えます。
	# 利用者が設定を変えられるように、本体の vcs_info には触れません。
	# 作業係は本体の複製なので、まず利用者の設定を消します。vcs_info の形式やフック、余分なチェックは、表示を変えたり、遅い Git の処理を走らせたりするためです。pure の処理は、設定を引数で受け取ります。
	zstyle -d
	zstyle ':vcs_info:*' enable git
	zstyle ':vcs_info:*' use-simple true
	# vcs_info から、3 つの値だけを出力します。
	zstyle ':vcs_info:*' max-exports 3
	# ブランチ（%b）、Git の最上位（%R）、操作（rebase や cherry-pick など）（%a）を出力します。
	zstyle ':vcs_info:git*' formats '%b' '%R' '%a'
	zstyle ':vcs_info:git*' actionformats '%b' '%R' '%a'

	vcs_info

	local -A info
	info[pwd]=$PWD
	# %14v で表示するため、ブランチ名は % の処理なしにそのまま描画されます。
	info[branch]=$vcs_info_msg_0_
	info[top]=$vcs_info_msg_1_
	info[action]=$vcs_info_msg_2_

	print -r - ${(@kvq)info}
}
```

```zsh:line-numbers=336 [原文]
prompt_pure_async_vcs_info() {
	setopt localoptions noshwordsplit
	prompt_pure_async_print_generation

	# Configure `vcs_info` inside an async task. This frees up `vcs_info`
	# to be used or configured as the user pleases.
	# The worker is a copy of the shell, so first delete the user's styles in it. Their `vcs_info` formats, hooks, and extra checks would change the messages or run slow Git commands. Pure's own jobs get their settings as arguments.
	zstyle -d
	zstyle ':vcs_info:*' enable git
	zstyle ':vcs_info:*' use-simple true
	# Only export three message variables from `vcs_info`.
	zstyle ':vcs_info:*' max-exports 3
	# Export branch (%b), Git toplevel (%R), action (rebase/cherry-pick) (%a)
	zstyle ':vcs_info:git*' formats '%b' '%R' '%a'
	zstyle ':vcs_info:git*' actionformats '%b' '%R' '%a'

	vcs_info

	local -A info
	info[pwd]=$PWD
	# No `%` escaping needed, the branch is rendered literally through `%14v`.
	info[branch]=$vcs_info_msg_0_
	info[top]=$vcs_info_msg_1_
	info[action]=$vcs_info_msg_2_

	print -r - ${(@kvq)info}
}
```

:::

## 前提知識

- **`vcs_info`**: zsh で、バージョン管理システムの情報を取り出す仕組みです。ブランチ名などを得られます。
- **`zstyle`**: zsh の設定の仕組みです。`vcs_info` の表示の形も、ここで決められます。
- **作業係の複製**: 非同期の作業係は、シェルのコピーとして動きます。そのため、本体の設定が引き継がれます。
- **`%b`、`%R`、`%a`**: それぞれ、ブランチ名、リポジトリの最上位の場所、進行中の操作を表す書式です。

## 何をしているか

### 1. 利用者の設定を外す

```zsh:line-numbers=340
	# 非同期の作業係の中で vcs_info を設定します。これで、本体の vcs_info は利用者が自由に使えます。
	# 利用者が設定を変えられるように、本体の vcs_info には触れません。
	# 作業係は本体の複製なので、まず利用者の設定を消します。vcs_info の形式やフック、余分なチェックは、表示を変えたり、遅い Git の処理を走らせたりするためです。pure の処理は、設定を引数で受け取ります。
```

作業係は本体の複製なので、利用者が設定した `vcs_info` の形式や処理を、いったん消します。そうしないと、表示が変わったり、遅い Git の処理が走ったりします。

### 2. 必要な設定だけを入れる

```zsh:line-numbers=343
	zstyle -d
	zstyle ':vcs_info:*' enable git
	zstyle ':vcs_info:*' use-simple true
	# vcs_info から、3 つの値だけを出力します。
	zstyle ':vcs_info:*' max-exports 3
	# ブランチ（%b）、Git の最上位（%R）、操作（rebase や cherry-pick など）（%a）を出力します。
	zstyle ':vcs_info:git*' formats '%b' '%R' '%a'
```

Git だけを対象にし、簡易の表示を使います。取り出す値の数を 3 つに絞り、ブランチ、リポジトリの場所、進行中の操作を書式で指定します。

### 3. 情報を集めて保存する

```zsh:line-numbers=351

	vcs_info

	local -A info
	info[pwd]=$PWD
	# %14v で表示するため、ブランチ名は % の処理なしにそのまま描画されます。
	info[branch]=$vcs_info_msg_0_
```

`vcs_info` を実行し、その結果を連想配列に入れます。場所も、今のディレクトリとして記録します。

### 4. 結果を出力する

```zsh:line-numbers=360

	print -r - ${(@kvq)info}
```

連想配列の内容を、作業係の結果として表示します。本体は、この出力を受け取って使います。

## ここがすごい

- **複製の影響を消す**: 作業係が本体の設定を引き継いでも、表示が乱れないように、設定を外してから必要なものだけ入れています。
- **取り出す値を絞る**: 3 つの値だけに限るので、処理が軽く、結果も読みやすくなっています。
- **利用者の設定と分ける**: `vcs_info` を利用者が自由に使えるように、作業係の中だけで設定を変えています。

## まとめ

- 裏の処理が本体の複製として動くなら、設定の引き継ぎを意識して必要なものだけに絞る。
- 取り出す値は、必要な分だけに限ると軽くなる。
- 裏の処理の設定は、表の利用者の設定と分けて扱う。
