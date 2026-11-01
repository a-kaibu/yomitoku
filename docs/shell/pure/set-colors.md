---
title: "色の設定を、ユーザーの zstyle と既定値から決める"
description: "プロンプトの色の一覧を、ユーザーが zstyle で指定した値、または既定の値で埋める関数。最後にパスの区切りの設定も更新する。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [118, 135]
function: "prompt_pure_set_colors"
difficulty: 3
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`prompt_pure_set_colors` は、**プロンプトで使う色の一覧を、利用者の設定と既定値から組み立てる** 関数です。利用者は `zstyle` という仕組みで、好きな色を指定できます。

色の指定がなければ、既定の色を使います。指定があれば、それを優先します。どちらの場合も、最後は同じ一覧に色が入るようになっています。

## コード

::: code-group

```zsh:line-numbers=118 [日本語訳]
prompt_pure_set_colors() {
	local color_temp key value
	# 空の色の値があっても、鍵と値の組がずれず、一覧が壊れないように引用符で囲みます。
	for key value in "${(@kv)prompt_pure_colors}"; do
		zstyle -t ":prompt:pure:$key" color "$value" && continue
		case $? in
			1) # 1) 設定は存在するが、値が違うときです。
				zstyle -s ":prompt:pure:$key" color color_temp
				prompt_pure_colors[${key}]=$color_temp ;;
			2) # 2) 設定がまったく無いときです。
				prompt_pure_colors[${key}]=${prompt_pure_colors_default[${key}]} ;;
		esac
	done

	prompt_pure_set_path_separator

	return 0
}
```

```zsh:line-numbers=118 [原文]
prompt_pure_set_colors() {
	local color_temp key value
	# Quote the expansion so an empty color value does not shift the key/value pairs and corrupt the palette.
	for key value in "${(@kv)prompt_pure_colors}"; do
		zstyle -t ":prompt:pure:$key" color "$value" && continue
		case $? in
			1) # The current style is different from the one from zstyle.
				zstyle -s ":prompt:pure:$key" color color_temp
				prompt_pure_colors[${key}]=$color_temp ;;
			2) # No style is defined.
				prompt_pure_colors[${key}]=${prompt_pure_colors_default[${key}]} ;;
		esac
	done

	prompt_pure_set_path_separator

	return 0
}
```

:::

## 前提知識

- **`zstyle`**: zsh で、設定値を名前の組み合わせで保存する仕組みです。`:prompt:pure:path` のような階層で、色などを指定できます。
- **`zstyle -t` と `zstyle -s`**: `-t` は値が一致するかを調べ、`-s` は値を変数に受け取ります。
- **連想配列**: 文字の鍵に値を結びつける型です。ここでは、色の名前と色の値の組を持ちます。
- **`${(@kv)...}`**: 連想配列の鍵と値を、順に取り出す zsh の書き方です。

## 何をしているか

### 1. 色の一覧を順に調べる

```zsh:line-numbers=119
	local color_temp key value
	# 空の色の値があっても、鍵と値の組がずれず、一覧が壊れないように引用符で囲みます。
	for key value in "${(@kv)prompt_pure_colors}"; do
```

色の一覧の鍵と値を、1 組ずつ取り出して繰り返します。値は引用符で囲んで、空の値があっても組がずれないようにしています。

### 2. 利用者の設定と比べる

```zsh:line-numbers=122
		zstyle -t ":prompt:pure:$key" color "$value" && continue
		case $? in
```

`zstyle -t` で、利用者の設定がこの値と一致するかを調べます。一致すれば、何もせず次へ進みます。

### 3. 違う設定なら、それを採用する

```zsh:line-numbers=124
			1) # 1) 設定は存在するが、値が違うときです。
				zstyle -s ":prompt:pure:$key" color color_temp
				prompt_pure_colors[${key}]=$color_temp ;;
			2) # 2) 設定がまったく無いときです。
```

`zstyle -t` の戻り値が 1 なら、設定は存在するが値が違うという意味です。そこで、`zstyle -s` で設定の値を受け取り、一覧に入れます。

### 4. 設定が無ければ既定値を使う

```zsh:line-numbers=128
				prompt_pure_colors[${key}]=${prompt_pure_colors_default[${key}]} ;;
		esac
	done
```

戻り値が 2 なら、その設定は存在しません。既定の色を一覧に入れます。

### 5. 区切りの設定を更新する

```zsh:line-numbers=133

	return 0
}
```

最後に、パスの区切りの色を決める関数を呼び、正常終了を返します。

## ここがすごい

- **利用者の好みを優先する**: 設定があればそれを使い、無ければ既定を使う、という 2 段階になっています。
- **戻り値で状態を区別する**: 一致、不一致、未設定の 3 つを戻り値だけで分けています。余計な変数を増やさずに済みます。
- **空の値に備える**: 値を引用符で囲んでいるので、空の色があっても一覧がずれません。コメントにも理由が書かれています。

## まとめ

- 利用者の設定と既定値を分けて扱うと、どちらでも動く。
- 戻り値で状態を分けると、分岐が読みやすい。
- 繰り返す値は、空でも崩れないように必ず引用符で囲む。
