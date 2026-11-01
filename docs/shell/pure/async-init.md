---
title: "非同期の作業係を、一度だけ起動する"
description: "非同期の作業係を起動し、結果を受け取る処理と優先度の調整を設定する関数。起動に失敗したら、非同期の処理を諦めて戻る。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [553, 566]
function: "prompt_pure_async_init"
difficulty: 3
format: 2
tags: [並行処理, 設計パターン, CLI]
---
## ひとことで

`prompt_pure_async_init` は、**裏で動く作業係（ワーカー）を、一度だけ起動する** 関数です。作業係が無いと、Git の情報を裏で集められません。

起動は何度も行うと無駄なので、一度だけに限ります。起動できない環境では、非同期の処理を諦めて、表示を続けます。

## コード

::: code-group

```zsh:line-numbers=553 [日本語訳]
prompt_pure_async_init() {
	typeset -g prompt_pure_async_inited
	if ((${prompt_pure_async_inited:-0})); then
		return
	fi
	if ! async_start_worker "prompt_pure" -u -n 2>/dev/null; then
		# ワーカーの起動に失敗しました（例: zpty の権限が無い）。
		# 非同期の Git の処理を省いて、安全に戻ります。
		return 1
	fi
	prompt_pure_async_inited=1
	async_register_callback "prompt_pure" prompt_pure_async_callback
	async_worker_eval "prompt_pure" prompt_pure_async_renice
}
```

```zsh:line-numbers=553 [原文]
prompt_pure_async_init() {
	typeset -g prompt_pure_async_inited
	if ((${prompt_pure_async_inited:-0})); then
		return
	fi
	if ! async_start_worker "prompt_pure" -u -n 2>/dev/null; then
		# Worker failed to start (e.g. zpty permission denied).
		# Degrade gracefully by skipping async git operations.
		return 1
	fi
	prompt_pure_async_inited=1
	async_register_callback "prompt_pure" prompt_pure_async_callback
	async_worker_eval "prompt_pure" prompt_pure_async_renice
}
```

:::

## 前提知識

- **ワーカー**: 別の仕事を裏で受け持つ、常駐の処理です。ここでは、Git の情報を集める役目です。
- **`async_start_worker`**: 非同期の作業係を起動する、非同期の仕組みの命令です。
- **zpty**: zsh が疑似端末を作るための仕組みです。権限が無いと、作業係の起動に失敗します。
- **`renice`**: 処理の優先度を変える命令です。作業係の優先度を下げて、入力の反応を守ります。

## 何をしているか

### 1. 起動済みなら戻る

```zsh:line-numbers=554
	typeset -g prompt_pure_async_inited
	if ((${prompt_pure_async_inited:-0})); then
		return
	fi
```

すでに起動されていれば、何もせずに戻ります。二重に起動しないためです。

### 2. 作業係を起動する

```zsh:line-numbers=558
	if ! async_start_worker "prompt_pure" -u -n 2>/dev/null; then
		# ワーカーの起動に失敗しました（例: zpty の権限が無い）。
		# 非同期の Git の処理を省いて、安全に戻ります。
		return 1
	fi
```

作業係を起動します。失敗したら、理由をコメントに残して、非同期の処理を諦めて終わります。

### 3. 起動済みの印を立てる

```zsh:line-numbers=563
	prompt_pure_async_inited=1
	async_register_callback "prompt_pure" prompt_pure_async_callback
```

起動に成功したら、印を立てます。次回からは、ここで戻れます。

### 4. 結果の受け取りと優先度を設定する

```zsh:line-numbers=565
	async_worker_eval "prompt_pure" prompt_pure_async_renice
}
```

結果を受け取る処理を登録します。さらに、作業係の優先度を下げる設定を、作業係の中で実行します。

## ここがすごい

- **一度だけ起動する**: 印で二重起動を防ぐので、プロンプトの表示のたびに作業係を作りません。
- **失敗を前提にしている**: 作業係が起動できない環境でも、表示が壊れません。非同期の機能だけを諦めて、残りを動かします。
- **入力の反応を守る**: 優先度を下げて、作業係が画面の操作を邪魔しないようにしています。

## まとめ

- 常駐する処理は、起動を一度だけに限ると無駄が無い。
- 失敗を想定して、機能の一部を諦める道を用意しておく。
- 裏の処理は、優先度を下げて表の操作を守る。
