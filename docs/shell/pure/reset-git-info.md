---
title: "Git の情報を空にして、古いブランチ名を表示しないようにする"
description: "プロンプトが保持している Git の状態（ブランチ、ダーティ状態、矢印など）をまとめて消し、初期の空の状態に戻す関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [539, 545]
function: "prompt_pure_reset_git_info"
difficulty: 2
format: 2
tags: [イディオム, 状態機械, CLI]
---
## ひとことで

`prompt_pure_reset_git_info` は、プロンプトが覚えている **Git の情報をすべて消して、空の状態に戻す** 関数です。ブランチ名、変更の有無、先行や遅延の記号などが、まとめて対象になります。

Pure は、Git の情報を裏で少しずつ集めて表示します。別のディレクトリに移ったときに古い情報が残っていると、違うブランチ名が表示されてしまいます。そこで、リポジトリの外に出たときなどに、この関数で一度まっさらにします。

## コード

```zsh:line-numbers=539
prompt_pure_reset_git_info() {
	unset prompt_pure_git_dirty prompt_pure_git_last_dirty_check_timestamp prompt_pure_git_arrows prompt_pure_git_stash prompt_pure_git_fetch_pattern
	typeset -gA prompt_pure_vcs_info
	prompt_pure_vcs_info[branch]=
	prompt_pure_vcs_info[top]=
	prompt_pure_vcs_info[action]=
}
```

## 前提知識

- **`unset 変数名`**: 変数を削除します。変数が存在しなくなるので、次に参照したとき空として扱われます。
- **`typeset -gA 名前`**: グローバルな連想配列を作ります。`-A` は、文字列をキーとする連想配列という意味です。
- **連想配列**: `vcs[branch]` のように、キーで値を取り出せる配列です。
- **`prompt_pure_vcs_info`**: Pure が Git の情報を保存する連想配列です。ブランチ名、先頭のディレクトリ、作業の状態などを入れます。

## 何をしているか

### 1. 個別の状態変数を消す

```zsh:line-numbers=540
	unset prompt_pure_git_dirty prompt_pure_git_last_dirty_check_timestamp prompt_pure_git_arrows prompt_pure_git_stash prompt_pure_git_fetch_pattern
```

ダーティ状態、最終確認の時刻、矢印、stash の数、フェッチのパターンなど、個別に保存している変数を `unset` で消します。

### 2. 連想配列を作り直す

```zsh:line-numbers=541
	typeset -gA prompt_pure_vcs_info
```

`typeset -gA` で、Git の情報の連想配列を用意します。すでに存在していれば、中身は残ったまま参照されます。

### 3. 表示に使う項目を空にする

```zsh:line-numbers=542
	prompt_pure_vcs_info[branch]=
	prompt_pure_vcs_info[top]=
	prompt_pure_vcs_info[action]=
```

ブランチ名、リポジトリの先頭のパス、作業中の状態（action）を空にします。プロンプトは、空の項目を表示しません。

## ここがすごい

- **状態をまとめて初期化**: 散らばった変数を 1 つの関数でまとめて消すので、消し忘れによる表示の不具合を防げます。
- **消すものを明示**: どの情報を保存しているかが、1 行にまとめて書かれています。後で項目を増やしたときに、ここを直せば済みます。
- **表示と状態を分ける**: 状態の初期化は、表示の処理とは独立した関数にまとめられています。呼ぶ側は、いつ初期化するかだけを決めれば十分です。

## まとめ

- 裏で集めた状態は、場所が変わったときにまとめて消す。
- 初期化は、保存している項目を一覧にして漏れを防ぐ。
- 連想配列は、関連する情報を 1 つの変数にまとめるのに便利。
