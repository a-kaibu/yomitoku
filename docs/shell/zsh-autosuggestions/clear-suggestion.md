---
title: "薄く表示している候補を消して、元の操作を続ける"
description: "候補の表示を消す関数。表示に使っている POSTDISPLAY を空にしてから、ユーザーが押したキーの元の動作を呼び出す。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [31, 36]
function: "_zsh_autosuggest_clear"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_clear` は、**薄く表示している候補を消す** 関数です。候補を消したあとで、押されたキーが本来もつ動作も実行します。

zsh-autosuggestions は、キーを押すたびに、ほかの処理の前後へ割り込みます。候補を消す場面でも、キーの本来の働きを止めないことが大事です。この関数は、その 2 つを両立させています。

## コード

::: code-group

```zsh:line-numbers=31 [日本語訳]
_zsh_autosuggest_clear() {
	# 候補の表示を消します。
	POSTDISPLAY=

	_zsh_autosuggest_invoke_original_widget $@
}
```

```zsh:line-numbers=31 [原文]
_zsh_autosuggest_clear() {
	# Remove the suggestion
	POSTDISPLAY=

	_zsh_autosuggest_invoke_original_widget $@
}
```

:::

## 前提知識

- **`POSTDISPLAY`**: zsh のラインエディタで、カーソルの後ろに表示される文字列です。空にすると、薄い候補が消えます。
- **ウィジェット**: zsh のラインエディタで、キーに割り当てられた 1 つの動作のことです。
- **`$@`**: 関数に渡された引数の全体です。ここでは、元のウィジェットに、そのまま渡すために使われています。
- **`_zsh_autosuggest_invoke_original_widget`**: 元のキーの動作を呼び出す補助関数です。この関数を経由して、ほかの処理が壊れないようにしています。

## 何をしているか

### 1. 候補の表示を空にする

```zsh:line-numbers=33
	POSTDISPLAY=

```

`POSTDISPLAY` を空にすると、カーソルの後ろの薄い文字が消えます。入力そのものは変わりません。

### 2. 元の動作を呼び出す

```zsh:line-numbers=36
}
```

消したあとで、押されたキーの本来の動作を、引数を添えて呼び出します。候補を消すだけでは、キーが効かなくなってしまうからです。

## ここがすごい

- **消すことと、動かすことを分ける**: 候補を消す処理と、キーの動作は別の仕事です。この関数は、消してから元の動作へ渡すだけに絞っています。
- **引数をそのまま渡す**: `$@` で受け取った引数を、元の動作へそのまま渡します。キーごとに違う動きを、この関数が勝手に変えることはありません。
- **補助関数を経由する**: 直接呼ばず、補助関数に任せています。元の動作が無いときの扱いなどを、1 か所にまとめられます。

## まとめ

- 表示を消す処理は、表示用の変数を空にするだけで済む。
- キーの本来の動作を奪わないように、元の動作を必ず呼び直す。
- 引数は加工せずに渡すと、他の仕組みと衝突しにくい。
