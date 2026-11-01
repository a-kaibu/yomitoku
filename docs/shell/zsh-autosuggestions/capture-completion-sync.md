---
title: "補完の候補を、その場で同期的に取り込む"
description: "補完の準備をしたあとで、補完を取り込むためのウィジェットを呼んで、結果を待つ関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/strategies/completion.zsh"
lines: [72, 76]
function: "_zsh_autosuggest_capture_completion_sync"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_capture_completion_sync` は、**補完の候補を、その場で同じ流れの中で取り込む** 関数です。結果を裏で待たずに、順番に処理します。

同期の方法は、非同期の方法より単純です。候補がすぐに得られる場面では、この方法で十分です。

## コード

```zsh:line-numbers=72
_zsh_autosuggest_capture_completion_sync() {
	_zsh_autosuggest_capture_setup

	zle autosuggest-capture-completion
}
```

## 前提知識

- **同期と非同期**: 同期は、結果が出るまで次の処理を待つ方法です。非同期は、裏で処理して後から結果を受け取る方法です。
- **`_zsh_autosuggest_capture_setup`**: 補完を取り込むための準備をする関数です。ほかの取り込み方でも共通して使われます。
- **`zle autosuggest-capture-completion`**: 補完の結果を取り込むための、内部のウィジェットを呼ぶ命令です。

## 何をしているか

### 1. 取り込みの準備をする

```zsh:line-numbers=73
	_zsh_autosuggest_capture_setup
```

補完の状態を整えるための、共通の準備を呼びます。

### 2. 取り込みのウィジェットを呼ぶ

```zsh:line-numbers=75
	zle autosuggest-capture-completion
```

内部のウィジェットを呼び、補完の結果を取り込みます。この処理が終わるまで、次には進みません。

## ここがすごい

- **準備を共通化する**: 同期と非同期の両方で、同じ準備の関数を使います。処理の重複がありません。
- **単純な流れ**: 呼び出す順番がそのまま実行の順番になるので、読んでも動きが追えます。
- **役割の分離**: 準備と取り込みを別の関数にしているので、取り込み方だけを差し替えることもできます。

## まとめ

- 結果がすぐ得られる処理は、同期にすると単純で読みやすい。
- 準備の処理は、複数の方法で共有すると重複が減る。
- 同期と非同期の準備を分けると、後から方法を選びやすい。
