---
title: "候補の残りだけを、入力の後ろに薄く表示する"
description: "入力文字列の先頭が候補と一致するとき、候補の続きの部分だけを POSTDISPLAY に入れて、カーソルの後ろに薄く表示する関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/widgets.zsh"
lines: [97, 107]
function: "_zsh_autosuggest_suggest"
difficulty: 2
format: 2
tags: [文字列処理, CLI, 設計パターン]
---
## ひとことで

`_zsh_autosuggest_suggest` は、見つかった候補の **入力の続きの部分だけ** を取り出して、画面に薄く表示する関数です。たとえば入力が `git st` で候補が `git status` なら、後ろに `atus` を薄く出します。

表示は、zsh のラインエディタの `POSTDISPLAY` という場所を使います。この変数に入れた文字列は、カーソルの後ろに表示されますが、入力行の一部にはなりません。そのため、Enter を押さない限り、実際のコマンドには混ざりません。

## コード

```zsh:line-numbers=97
_zsh_autosuggest_suggest() {
	emulate -L zsh

	local suggestion="$1"

	if [[ -n "$suggestion" ]] && (( $#BUFFER )); then
		POSTDISPLAY="${suggestion#$BUFFER}"
	else
		POSTDISPLAY=
	fi
}
```

## 前提知識

- **`POSTDISPLAY`**: zsh のラインエディタで、カーソルの後ろに表示される文字列です。入力そのものではなく、表示だけに使われます。
- **`${suggestion#$BUFFER}`**: 候補の先頭から、入力文字列と一致する部分を取り除きます。残りが続きの部分です。
- **`$#BUFFER`**: 入力文字列の長さです。0 でなければ、何か入力されています。
- **`emulate -L zsh`**: この関数の中だけ、zsh の標準の設定で動かします。
- **`local suggestion="$1"`**: 引数で渡された候補を、関数の中の変数に入れます。

## 何をしているか

### 1. 候補があり、入力もあるか調べる

```zsh:line-numbers=100
	local suggestion="$1"

	if [[ -n "$suggestion" ]] && (( $#BUFFER )); then
```

候補の文字列が空でなく、入力も空でないときだけ、続きを表示する準備をします。

### 2. 続きの部分を表示用に入れる

```zsh:line-numbers=103
		POSTDISPLAY="${suggestion#$BUFFER}"
```

候補から、入力された部分を取り除いた残りを `POSTDISPLAY` に入れます。これがカーソルの後ろの薄い表示になります。

### 3. 何も表示しない場合

```zsh:line-numbers=105
		POSTDISPLAY=
```

候補が無い、または入力が空のときは、`POSTDISPLAY` を空にして、表示を消します。

## ここがすごい

- **入力を壊さない表示**: 続きの部分は `POSTDISPLAY` にだけ入るので、Tab や → キーで受け入れるまで、コマンドは変わりません。
- **先頭一致だけを扱う**: 候補が入力の続きでない場合は、表示しません。途中まで違う候補を薄く出さずに済みます。
- **空のときに消す**: 入力を消したときに、古い候補が残らないように、必ず表示を空にしています。

## まとめ

- 補完の候補は、入力の続きだけを表示すると、画面を散らかさない。
- 表示用の場所と、入力の場所を分けると、誤って実行される事故を防げる。
- 表示を消す処理を必ず書くと、古い表示が残らない。
