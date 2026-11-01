---
title: "裏で動くプロセスの優先度を、わざと下げる"
description: "Pure が非同期で行う git の処理が、作業中のシェルを重くしないように、nice と ionice で優先度を下げる関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [526, 536]
function: "prompt_pure_async_renice"
difficulty: 2
format: 2
tags: [並行処理, CLI, 最適化]
---
## ひとことで

`prompt_pure_async_renice` は、Pure が裏で動かしている処理の **優先度を下げる** 関数です。CPU の優先度を下げる `renice` と、ディスクの優先度を下げる `ionice` を、使えるものだけ使います。

プロンプトのための git の処理は、ユーザーが入力している間も裏で動きます。この処理が重いと、ユーザーのコマンドの実行が遅くなってしまいます。そこで、裏側の処理が「余った時間だけ使う」ようにしています。

## コード

```zsh:line-numbers=526
prompt_pure_async_renice() {
	setopt localoptions noshwordsplit

	if command -v renice >/dev/null; then
		command renice +15 -p $$
	fi

	if command -v ionice >/dev/null; then
		command ionice -c 3 -p $$
	fi
}
```

## 前提知識

- **優先度（nice 値）**: CPU を使う順番を決める数値です。値が大きいほど優先度が低くなり、他のプロセスに譲ります。
- **`renice +15 -p PID`**: 指定したプロセスの nice 値を 15 に上げる（優先度を下げる）コマンドです。
- **`ionice -c 3 -p PID`**: ディスクの入出力の優先度を、「アイドルのときだけ」に設定するコマンドです。`-c 3` がその指定です。
- **`$$`**: 今動いているシェル自身のプロセス ID です。
- **`command -v 名前 >/dev/null`**: コマンドがあるかを、出力を捨てて調べます。
- **`command`**: 関数やエイリアスを飛ばして、本物のコマンドを実行します。

## 何をしているか

### 1. CPU の優先度を下げる

```zsh:line-numbers=529
	if command -v renice >/dev/null; then
		command renice +15 -p $$
	fi
```

`renice` があれば、今のシェル（`$$`）の nice 値を 15 に上げます。ほかのプロセスが CPU を使いたいときに、譲りやすくなります。

### 2. ディスクの優先度を下げる

```zsh:line-numbers=533
	if command -v ionice >/dev/null; then
		command ionice -c 3 -p $$
	fi
```

`ionice` があれば、今のシェルのディスク入出力を、アイドル時だけに限定します。ほかの作業がディスクを使っているときは、待つようになります。

どちらも、コマンドが無い環境ではスキップされます。そのため、Linux 以外の環境でも安全に呼べます。

## ここがすごい

- **使えるものだけを使う**: 両方のコマンドが無い環境でも、エラーにならずに何もせず終わります。環境の違いを吸収しています。
- **`$$` で自分自身だけを対象にする**: 優先度を変えるのは、この関数を呼んだシェルの子に限られ、ユーザーの他のプロセスには影響しません。
- **ユーザーの作業を優先する**: プロンプトの裏側の処理は、いつでも後回しにできる作業です。その性質に合わせて、優先度を下げるという割り切りをしています。

## まとめ

- 裏で動く補助的な処理は、優先度を下げておくと本来の作業を妨げない。
- `command -v` で、そのコマンドが使えるかを確かめてから呼ぶ。
- `$$` を使うと、変更の対象を自分のプロセスに限定できる。
