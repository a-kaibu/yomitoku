---
title: "pull や fetch に当たる Git のエイリアスを探す"
description: "Git の設定からエイリアスの一覧を読み、pull か fetch を含むものの名前を、正規表現で使える形にまとめて表示する関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [317, 334]
function: "prompt_pure_async_git_aliases"
difficulty: 3
format: 2
tags: [CLI, 文字列処理, 正規表現]
---
## ひとことで

`prompt_pure_async_git_aliases` は、**pull や fetch を含む Git のエイリアスを探して、名前を一覧にする** 関数です。たとえば `git up` を `git pull --rebase` の別名として設定していれば、その `up` を見つけます。

エイリアスの名前は人によって違うので、決まった名前だけでは不十分です。この関数は、設定を読んで、取得の動きをするものを全部拾います。

## コード

::: code-group

```zsh:line-numbers=317 [日本語訳]
prompt_pure_async_git_aliases() {
	setopt localoptions noshwordsplit
	prompt_pure_async_print_generation
	local -a pullalias parts
	local gitalias

	# 全てのエイリアスを、NUL 区切りで一覧にします。値は複数行になることがあるためです。
	for gitalias in ${(0)"$(command git config -z --get-regexp "^alias\.")"}; do
		parts=(${=gitalias#*$'\n'})  # 値を空白で分けます。

		# pull か fetch を、完全に一致する単語として確かめます。
		if [[ $parts =~ ^(.*\ )?(pull|fetch)(\ .*)?$ ]]; then
			pullalias+=(${${gitalias%%$'\n'*}#alias.})
		fi
	done

	print -- ${(j:|:)pullalias}  # 正規表現で使うため、| で結んで表示します。
}
```

```zsh:line-numbers=317 [原文]
prompt_pure_async_git_aliases() {
	setopt localoptions noshwordsplit
	prompt_pure_async_print_generation
	local -a pullalias parts
	local gitalias

	# List all aliases, NUL-separated as `alias.[name]\n[value]`, since values can span multiple lines.
	for gitalias in ${(0)"$(command git config -z --get-regexp "^alias\.")"}; do
		parts=(${=gitalias#*$'\n'})  # Split the value on whitespace.

		# Check alias for pull or fetch. Must be exact match.
		if [[ $parts =~ ^(.*\ )?(pull|fetch)(\ .*)?$ ]]; then
			pullalias+=(${${gitalias%%$'\n'*}#alias.})
		fi
	done

	print -- ${(j:|:)pullalias}  # Join on pipe, for use in regex.
}
```

:::

## 前提知識

- **エイリアス**: Git の設定で、よく使う命令に別の短い名前を付ける仕組みです。
- **`git config --get-regexp`**: 設定の中から、正規表現に一致する項目を取り出すコマンドです。
- **`-z`**: 出力を、NUL 文字で区切る指定です。値に改行が含まれても、区切りを間違えません。
- **`(j:|:)`**: 配列の要素を、`|` で結んで 1 つの文字列にする zsh の書き方です。正規表現の選択肢に使えます。

## 何をしているか

### 1. エイリアスの一覧を読む

```zsh:line-numbers=320
	local -a pullalias parts
	local gitalias

	# 全てのエイリアスを、NUL 区切りで一覧にします。値は複数行になることがあるためです。
```

設定の中から、`alias.` で始まる項目を、NUL 区切りで取り出します。値が複数行でも、正しく分けられます。

### 2. 値を空白で分ける

```zsh:line-numbers=324
	for gitalias in ${(0)"$(command git config -z --get-regexp "^alias\.")"}; do
```

エイリアスの値を、空白で区切って配列にします。命令の単語を調べるためです。

### 3. pull か fetch を含むか調べる

```zsh:line-numbers=326

		# pull か fetch を、完全に一致する単語として確かめます。
		if [[ $parts =~ ^(.*\ )?(pull|fetch)(\ .*)?$ ]]; then
			pullalias+=(${${gitalias%%$'\n'*}#alias.})
```

正規表現で、単語として `pull` か `fetch` が含まれるかを調べます。完全に一致する単語だけを対象にします。

### 4. 名前を集める

```zsh:line-numbers=330
		fi
	done

```

一致したエイリアスの名前から、`alias.` の部分を取り除いて配列に加えます。

### 5. `|` で結んで表示する

```zsh:line-numbers=334
}
```

集めた名前を `|` で結んで表示します。後の処理で、正規表現の選択肢としてそのまま使えます。

## ここがすごい

- **利用者の設定を尊重する**: 名前を決め打ちせず、設定の中から探すので、どんな名前のエイリアスにも対応します。
- **区切りを安全に扱う**: NUL 区切りを使い、値に改行があっても壊れない読み方をしています。
- **完全一致で誤検出を防ぐ**: `pull` を含む別の単語を拾わないように、単語の境界を正規表現で確かめています。

## まとめ

- 利用者の設定は、決まった名前ではなく中身で探すと柔軟になる。
- 複数行の値を扱うときは、NUL 区切りで読むと安全。
- 一覧は、正規表現で使える形にまとめると後の処理が楽になる。
