---
title: "1 つのキー動作を、候補の仕組みで包み直す"
description: "指定したキー動作の種類を調べ、元の動作を退避させたうえで、候補の処理を先に呼ぶ新しい動作に差し替える関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/bind.zsh"
lines: [12, 60]
function: "_zsh_autosuggest_bind_widget"
difficulty: 3
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`_zsh_autosuggest_bind_widget` は、**1 つのキー動作を、候補の仕組みで包み直す** 関数です。元の動作はそのまま残し、候補の処理を前に挟んだ新しい動作を割り当てます。

キーの動作には、組み込みのもの、利用者が作ったもの、補完のものなど、いくつかの種類があります。それぞれ、元の動作を保存する方法が違うので、種類を調べてから処理を分けています。

## コード

::: code-group

```zsh:line-numbers=12 [日本語訳]
_zsh_autosuggest_bind_widget() {
	typeset -gA _ZSH_AUTOSUGGEST_BIND_COUNTS

	local widget=$1
	local autosuggest_action=$2
	local prefix=$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX

	local -i bind_count

	# 元のウィジェットへの参照を保存します。
	case $widgets[$widget] in
		# すでに包まれている場合です。
		user:_zsh_autosuggest_(bound|orig)_*)
			bind_count=$((_ZSH_AUTOSUGGEST_BIND_COUNTS[$widget]))
			;;

		# 利用者が定義したウィジェットの場合です。
		user:*)
			_zsh_autosuggest_incr_bind_count $widget
			zle -N $prefix$bind_count-$widget ${widgets[$widget]#*:}
			;;

		# 組み込みのウィジェットの場合です。
		builtin)
			_zsh_autosuggest_incr_bind_count $widget
			eval "_zsh_autosuggest_orig_${(q)widget}() { zle .${(q)widget} }"
			zle -N $prefix$bind_count-$widget _zsh_autosuggest_orig_$widget
			;;

		# 補完のウィジェットの場合です。
		completion:*)
			_zsh_autosuggest_incr_bind_count $widget
			eval "zle -C $prefix$bind_count-${(q)widget} ${${(s.:.)widgets[$widget]}[2,3]}"
			;;
	esac

	# 包んだ新しい動作に、元の動作の名前を明示的に渡します。
	# その名前を使って元の動作を呼びます。
	# $WIDGET の値に頼らないためです。
	# $WIDGET は正しいとは限りません。
	# ほかのプラグインは、-w を付けずに zle を呼ぶことがあります。
	# 例: zle self-insert -w ではなく zle self-insert と呼ぶ場合です。
	eval "_zsh_autosuggest_bound_${bind_count}_${(q)widget}() {
		_zsh_autosuggest_widget_$autosuggest_action $prefix$bind_count-${(q)widget} \$@
	}"

	# 包んだ新しいウィジェットを作って、キーに割り当てます。
	zle -N -- $widget _zsh_autosuggest_bound_${bind_count}_$widget
}
```

```zsh:line-numbers=12 [原文]
_zsh_autosuggest_bind_widget() {
	typeset -gA _ZSH_AUTOSUGGEST_BIND_COUNTS

	local widget=$1
	local autosuggest_action=$2
	local prefix=$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX

	local -i bind_count

	# Save a reference to the original widget
	case $widgets[$widget] in
		# Already bound
		user:_zsh_autosuggest_(bound|orig)_*)
			bind_count=$((_ZSH_AUTOSUGGEST_BIND_COUNTS[$widget]))
			;;

		# User-defined widget
		user:*)
			_zsh_autosuggest_incr_bind_count $widget
			zle -N $prefix$bind_count-$widget ${widgets[$widget]#*:}
			;;

		# Built-in widget
		builtin)
			_zsh_autosuggest_incr_bind_count $widget
			eval "_zsh_autosuggest_orig_${(q)widget}() { zle .${(q)widget} }"
			zle -N $prefix$bind_count-$widget _zsh_autosuggest_orig_$widget
			;;

		# Completion widget
		completion:*)
			_zsh_autosuggest_incr_bind_count $widget
			eval "zle -C $prefix$bind_count-${(q)widget} ${${(s.:.)widgets[$widget]}[2,3]}"
			;;
	esac

	# Pass the original widget's name explicitly into the autosuggest
	# function. Use this passed in widget name to call the original
	# widget instead of relying on the $WIDGET variable being set
	# correctly. $WIDGET cannot be trusted because other plugins call
	# zle without the `-w` flag (e.g. `zle self-insert` instead of
	# `zle self-insert -w`).
	eval "_zsh_autosuggest_bound_${bind_count}_${(q)widget}() {
		_zsh_autosuggest_widget_$autosuggest_action $prefix$bind_count-${(q)widget} \$@
	}"

	# Create the bound widget
	zle -N -- $widget _zsh_autosuggest_bound_${bind_count}_$widget
}
```

:::

## 前提知識

- **ウィジェットの種類**: zsh では `$widgets` で、動作が組み込みか、利用者の定義か、補完かを調べられます。
- **`zle -N`**: キーに使う動作を新しく登録する命令です。
- **`zle -C`**: 補完の動作を登録する命令です。補完の関数を、ウィジェットとして作ります。
- **`eval`**: 文字列として組み立てた命令を、その場で実行する命令です。関数の名前を動的に作るときに使われます。
- **`${(q)名前}`**: 文字列を、シェルで安全に扱える形にエスケープする書き方です。

## 何をしているか

### 1. 既に包んであるかを確かめる

```zsh:line-numbers=16
	local autosuggest_action=$2
	local prefix=$ZSH_AUTOSUGGEST_ORIGINAL_WIDGET_PREFIX

```

すでに候補の仕組みで包まれた動作なら、以前の番号を使うだけです。新しく作り直しません。

### 2. 利用者の定義の動作を退避する

```zsh:line-numbers=20

	# 元のウィジェットへの参照を保存します。
	case $widgets[$widget] in
		# すでに包まれている場合です。
		user:_zsh_autosuggest_(bound|orig)_*)
```

利用者が作った動作なら、番号を増やして、元の動作を新しい名前で登録します。元の動作は、この名前で後から呼べます。

### 3. 組み込みの動作を退避する

```zsh:line-numbers=25
			bind_count=$((_ZSH_AUTOSUGGEST_BIND_COUNTS[$widget]))
			;;

		# 利用者が定義したウィジェットの場合です。
		user:*)
			_zsh_autosuggest_incr_bind_count $widget
```

組み込みの動作は、`zle .名前` を呼ぶ関数を作って登録します。`.` は、ほかの仕組みを通さない本来の動作を指す印です。

### 4. 補完の動作を退避する

```zsh:line-numbers=31
			zle -N $prefix$bind_count-$widget ${widgets[$widget]#*:}
			;;

		# 組み込みのウィジェットの場合です。
		builtin)
```

補完の動作は、元の定義から必要な部分を取り出して、補完のウィジェットとして作り直します。

### 5. 候補の処理を先に呼ぶ新しい動作を作る

```zsh:line-numbers=42
		completion:*)
			_zsh_autosuggest_incr_bind_count $widget
			eval "zle -C $prefix$bind_count-${(q)widget} ${${(s.:.)widgets[$widget]}[2,3]}"
			;;
```

キーに割り当てる関数を、番号付きの名前で作ります。中では、候補の処理を呼び、その後で元の動作を呼ぶ流れになります。元の動作の名前は、引数として明示的に渡します。

### 6. キーに割り当てる

```zsh:line-numbers=48
	# 包んだ新しい動作に、元の動作の名前を明示的に渡します。
```

最後に、キーの動作を、新しく作った関数に差し替えます。

## ここがすごい

- **元の動作を消さない**: 元の動作を別の名前で保存してから包むので、包みを外せば元に戻せます。
- **動作の種類ごとに手当てする**: 組み込み、利用者の定義、補完のそれぞれに、適した方法で退避しています。
- **名前を明示的に渡す**: 元の動作の名前を、`$WIDGET` に頼らず引数で渡しています。ほかのプラグインが `zle` を直接呼んでも、正しい動作を呼べます。
- **番号で衝突を避ける**: 同じ動作を何度包んでも、番号で名前が区別されます。

## まとめ

- 既存の動作を包むときは、元の動作を別の名前で保存してから差し替える。
- 種類が違う対象は、種類ごとに処理を分けると安全。
- 状態に頼らず、必要な情報は引数で明示的に渡すと、他の仕組みと衝突しにくい。
