---
title: "表示中の候補を入力に含めて、そのまま実行する"
description: "Enter を押したとき、薄く表示している候補を入力の末尾へ足してから、元の accept-line を呼んで実行する関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [149, 159]
function: "_zsh_autosuggest_execute"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_zsh_autosuggest_execute` は、**Enter を押したときに、薄い候補を入力に足してから実行する** 関数です。画面に見えている候補が、そのまま実行されるコマンドになります。

候補は、通常は表示だけで、入力の一部ではありません。Enter で実行する直前にだけ、それを正式な入力へ取り込みます。

## コード

::: code-group

```zsh:line-numbers=149 [日本語訳]
_zsh_autosuggest_execute() {
	# 候補を入力の末尾へ足します。
	BUFFER="$BUFFER$POSTDISPLAY"

	# 表示は空にします。
	POSTDISPLAY=

	# 元の accept-line を呼びます。シンタックスの色付けなどに対応するためです。
	# 利用者が追加した動作も、ここで実行されます。
	_zsh_autosuggest_invoke_original_widget "accept-line"
}
```

```zsh:line-numbers=149 [原文]
_zsh_autosuggest_execute() {
	# Add the suggestion to the buffer
	BUFFER="$BUFFER$POSTDISPLAY"

	# Remove the suggestion
	POSTDISPLAY=

	# Call the original `accept-line` to handle syntax highlighting or
	# other potential custom behavior
	_zsh_autosuggest_invoke_original_widget "accept-line"
}
```

:::

## 前提知識

- **`POSTDISPLAY`**: カーソルの後ろに薄く出ている候補の文字列です。実行される文字には、まだ含まれていません。
- **`BUFFER`**: 入力中の行の文字列です。実際に実行されるのは、この中身です。
- **`accept-line`**: Enter に割り当てられた、zsh の元の動作です。入力を確定して、コマンドとして実行します。
- **ウィジェットの呼び出し**: 元の動作を、この関数の中から呼び直す仕組みです。

## 何をしているか

### 1. 候補を入力の末尾に足す

```zsh:line-numbers=151
	BUFFER="$BUFFER$POSTDISPLAY"
```

`POSTDISPLAY` の中身を `BUFFER` の後ろへつなげます。これで、表示されていた候補が、入力の一部になります。

### 2. 表示を消す

```zsh:line-numbers=153
	# 表示は空にします。
	POSTDISPLAY=
```

入力に取り込んだので、後ろに出ていた薄い表示は空にします。二重に見えないようにするためです。

### 3. 元の Enter の動作を呼ぶ

```zsh:line-numbers=156
	# 元の accept-line を呼びます。シンタックスの色付けなどに対応するためです。
	# 利用者が追加した動作も、ここで実行されます。
	_zsh_autosuggest_invoke_original_widget "accept-line"
```

最後に、元の `accept-line` を呼びます。シンタックスの色付けや、利用者が追加した動作も、ここで実行されます。

## ここがすごい

- **入力と表示を分けたままにする**: 普段は候補を入力に混ぜません。Enter のときだけ取り込むので、途中で候補を消しても、入力が汚れません。
- **元の動作を奪わない**: 自分で実行する代わりに、元の `accept-line` を呼びます。ほかの設定や色付けが、そのまま効きます。
- **順序が大切**: 入力に足してから表示を消し、そのあとで実行します。順番を変えると、実行される内容が意図とずれます。

## まとめ

- 表示だけの情報は、確定の直前に本体へ取り込むと安全。
- 実行は自分で行わず、元の動作へ任せると、他の仕組みと衝突しない。
- 取り込みと表示の後始末は、同じ場所にまとめて書く。
