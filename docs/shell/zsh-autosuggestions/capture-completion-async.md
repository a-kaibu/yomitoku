---
title: "補完の候補を、非同期の編集画面の中で取り込む"
description: "補完の関数を一時的に差し替えて、編集用の画面で補完を走らせ、その結果を候補として取り込む関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/strategies/completion.zsh"
lines: [78, 94]
function: "_zsh_autosuggest_capture_completion_async"
difficulty: 3
format: 2
tags: [並行処理, 設計パターン, CLI]
---
## ひとことで

`_zsh_autosuggest_capture_completion_async` は、**補完の候補を、一時的な編集の画面の中で取り込む** 関数です。補完の関数を一時的に差し替えて、結果だけを受け取ります。

補完は、普通のコマンドの入力画面でなければ、正しく動かないことがあります。そこで、一時的な画面を開いて、その中で補完を走らせます。

## コード

::: code-group

```zsh:line-numbers=78 [日本語訳]
_zsh_autosuggest_capture_completion_async() {
	_zsh_autosuggest_capture_setup

	zmodload zsh/parameter 2>/dev/null || return # $functions を使うため。 zsh/parameter を読み込みます。 失敗したら戻ります。

	# 通常のコマンド入力と同じように、vared の補完が動くようにします。
	# 参考の回答です。
	autoload +X _complete
	functions[_original_complete]=$functions[_complete]
	function _complete() {
		unset 'compstate[vared]'
		_original_complete "$@"
	}

	# 補完の候補を取り込むため、バッファを設定した状態で編集の画面を開きます。
	vared 1
}
```

```zsh:line-numbers=78 [原文]
_zsh_autosuggest_capture_completion_async() {
	_zsh_autosuggest_capture_setup

	zmodload zsh/parameter 2>/dev/null || return # For `$functions`

	# Make vared completion work as if for a normal command line
	# https://stackoverflow.com/a/7057118/154703
	autoload +X _complete
	functions[_original_complete]=$functions[_complete]
	function _complete() {
		unset 'compstate[vared]'
		_original_complete "$@"
	}

	# Open zle with buffer set so we can capture completions for it
	vared 1
}
```

:::

## 前提知識

- **`vared`**: 変数の中身を、編集の画面で書き換えさせる zsh の命令です。ここでは、補完を走らせる場として使われます。
- **`functions` 連想配列**: 関数の定義を名前から取り出したり、書き換えたりできる zsh の変数です。
- **`_complete`**: 補完の本体となる関数の名前です。
- **`zmodload`**: zsh の追加の機能を読み込む命令です。ここでは、`functions` を使うために必要です。
- **`compstate[vared]`**: 補完が、`vared` の中で動いているかを表す状態です。

## 何をしているか

### 1. 準備をして、parameter モジュールを読む

```zsh:line-numbers=80

	zmodload zsh/parameter 2>/dev/null || return # $functions を使うため。 zsh/parameter を読み込みます。 失敗したら戻ります。

	# 通常のコマンド入力と同じように、vared の補完が動くようにします。
```

共通の準備を呼んだあと、`functions` を使うために、zsh のモジュールを読み込みます。失敗したら、ここで戻ります。

### 2. 補完の関数を差し替える

```zsh:line-numbers=85
	autoload +X _complete
	functions[_original_complete]=$functions[_complete]
	function _complete() {
		unset 'compstate[vared]'
		_original_complete "$@"
	}
```

元の `_complete` を保存してから、新しい `_complete` を定義します。新しい方は、`vared` の状態を消してから、元の関数を呼びます。

### 3. 編集の画面を開く

```zsh:line-numbers=93
	vared 1
}
```

`vared 1` で編集の画面を開きます。この中で補完が走り、結果が取り込まれます。

## ここがすごい

- **通常の入力と同じ条件にする**: 一時的な画面の中でも、補完が普通のコマンド入力のように動くよう、状態を調整しています。
- **差し替えを最小に保つ**: 補完の関数の動きは、`vared` の状態を消すだけ変えています。ほかの振る舞いは元のままです。
- **元の関数を保存して呼ぶ**: 差し替えた関数から、保存した元の関数を呼ぶので、補完の機能は失われません。

## まとめ

- 補完の動きを変えるときは、元の関数を保存してから包むと安全。
- 一時的な画面を使うと、通常の入力に近い条件で処理できる。
- 差し替えは、必要な状態だけを変えると副作用が少ない。
