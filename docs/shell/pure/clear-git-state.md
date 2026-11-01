---
title: "表示していた Git の情報を、まとめて消す"
description: "Git の情報を初期化し、非同期の作業係の環境と、保存していたカレントディレクトリの記録を空にする関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [547, 551]
function: "prompt_pure_clear_git_state"
difficulty: 1
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`prompt_pure_clear_git_state` は、**プロンプトに表示していた Git の情報を、まとめて消す** 関数です。Git のリポジトリの外に出たときなどに呼ばれます。

Git の情報は、いくつもの変数に分かれて保存されています。消し忘れがあると、古い情報が表示に残ります。この関数は、その後始末を一箇所にまとめています。

## コード

```zsh:line-numbers=547
prompt_pure_clear_git_state() {
	prompt_pure_reset_git_info
	typeset -gA prompt_pure_worker_env=()
	prompt_pure_vcs_info[pwd]=
}
```

## 前提知識

- **`typeset -gA`**: 関数の外からも見える連想配列を作る命令です。`=()` を付けると、空にできます。
- **`prompt_pure_worker_env`**: 非同期の作業係に渡す環境を保存する連想配列です。
- **`prompt_pure_vcs_info`**: 現在の Git の情報を保存する連想配列です。`pwd` は、その情報がどのディレクトリのものかを表します。
- **`prompt_pure_reset_git_info`**: Git の表示の情報を初期化する関数です。同じファイル内で定義されています。

## 何をしているか

### 1. 表示用の Git の情報を初期化する

```zsh:line-numbers=548
	prompt_pure_reset_git_info
```

`prompt_pure_reset_git_info` を呼んで、表示に使う情報を消します。

### 2. 作業係の環境を空にする

```zsh:line-numbers=549
	typeset -gA prompt_pure_worker_env=()
```

`typeset -gA` で、非同期の作業係の環境を空の連想配列にします。

### 3. 記録したディレクトリを消す

```zsh:line-numbers=550
	prompt_pure_vcs_info[pwd]=
```

`pwd` の記録を空にします。次に表示するとき、古い場所の情報が使われないようにします。

## ここがすごい

- **後始末を一か所にまとめる**: 呼び出し側は 1 つの関数を呼ぶだけで、関連するすべての状態が消えます。
- **古い情報を残さない**: 場所の記録も消すので、別のディレクトリの Git の情報が表示されることを防ぎます。
- **状態の分担が見える**: 表示の情報、作業係の環境、場所の記録、と何を消しているかが一行ずつ読めます。

## まとめ

- 複数の状態を持つときは、消す処理を 1 つの関数にまとめると消し忘れを防げる。
- 場所の記録も消すと、古い情報が別の場所に出る事故を防げる。
- 初期化の命令は、役割ごとに分けて書くと読みやすい。
