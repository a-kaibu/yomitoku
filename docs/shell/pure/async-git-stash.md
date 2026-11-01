---
title: "退避しているスタッシュの数を数える"
description: "非同期で、Git のスタッシュの参照から件数を数えて表示する関数。プロンプトに出す情報を、裏で集めるための一つ。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [509, 512]
function: "prompt_pure_async_git_stash"
difficulty: 2
format: 2
tags: [CLI, 並行処理, 設計パターン]
---
## ひとことで

`prompt_pure_async_git_stash` は、**退避されているスタッシュの数を、裏で数える** 関数です。プロンプトに、退避の有無を示すために使われます。

Git のスタッシュは、作業を一時的に退避させる仕組みです。その件数をプロンプトに出すと、戻し忘れに気づけます。数える処理は少し時間がかかることがあるため、非同期で行います。

## コード

```zsh:line-numbers=509
prompt_pure_async_git_stash() {
	prompt_pure_async_print_generation
	command git rev-list --walk-reflogs --count refs/stash
}
```

## 前提知識

- **スタッシュ**: 作業中の変更を、一時的に退避しておく Git の仕組みです。`refs/stash` という参照で管理されます。
- **`--walk-reflogs`**: 参照の履歴（リフログ）をたどって数える指定です。スタッシュの履歴が件数になります。
- **非同期の処理**: プロンプトの表示を待たせず、裏で値を求める仕組みです。pure では、その仕組みの一部として使われます。
- **`prompt_pure_async_print_generation`**: 非同期の結果が、どの世代のものかを示す印を出す関数です。結果の取り違えを防ぎます。

## 何をしているか

### 1. 世代の印を出す

```zsh:line-numbers=510
	prompt_pure_async_print_generation
```

非同期の結果がどの世代かを、先に表示します。古い結果が新しい表示を上書きしないためです。

### 2. スタッシュの件数を数える

```zsh:line-numbers=511
	command git rev-list --walk-reflogs --count refs/stash
```

`git rev-list` に `--walk-reflogs` と `--count` を付けて、`refs/stash` の履歴の件数を数えます。その数が表示されます。

## ここがすごい

- **Git の機能をそのまま使う**: スタッシュの履歴を自分で読まず、リフログの機能で数えます。
- **世代の印で取り違えを防ぐ**: 非同期の結果を、いつのものかで区別します。表示が古くなる問題を避けられます。
- **短く書ける**: 2 行の中で、世代の印と件数を出しています。役割が明快です。

## まとめ

- 件数の取得は、Git の機能に任せると正確で短く書ける。
- 非同期の結果には、世代の印を付けて取り違えを防ぐ。
- 表示の情報は、必要な時だけ裏で集めると入力が重くならない。
