---
title: "補完を取り込むための、環境の下準備をする"
description: "古い zsh の不具合に備える終了時の処理を用意し、補完の候補を絞る設定を入れ、Tab キーを取り込み用の動作に結びつける関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/strategies/completion.zsh"
lines: [47, 70]
function: "_zsh_autosuggest_capture_setup"
difficulty: 3
format: 2
tags: [設計パターン, CLI, イディオム]
---
## ひとことで

`_zsh_autosuggest_capture_setup` は、**補完の候補を取り込むための、環境の下準備を行う** 関数です。補完の設定を絞り、Tab キーを取り込み用の動作に結びつけます。

補完の候補を取り込むには、補完の仕組みを一時的に作り変える必要があります。この関数は、その準備を 1 か所にまとめています。

## コード

::: code-group

```zsh:line-numbers=47 [日本語訳]
_zsh_autosuggest_capture_setup() {
	# 古い zsh の zpty には不具合があり、終了した zpty が、それより前に作られた他の zpty をすべて止めてしまうことがあります。
	# そこで、古いバージョンでは、終了時に zpty のプロセスを直ちに止める処理を登録します。
	# これは、ほかの zpty を止める前に行われます。
	# 終了時の処理を登録し、
	# 他の zpty が止まらないようにします。
	if ! is-at-least 5.4; then
		zshexit() {
			# 古いバージョンでは、組み込みの kill が失敗することがあるため、外部の kill を使います。
			# 参考の回答です。
			kill -KILL $$ 2>&- || command kill -KILL $$

			# 信号が届くまで、少し待ちます。
			sleep 1
		}
	fi

	# 接頭辞に一致しない候補は、試さないようにします。
	zstyle ':completion:*' matcher-list ''
	zstyle ':completion:*' path-completion false
	zstyle ':completion:*' max-errors 0 not-numeric

	bindkey '^I' autosuggest-capture-completion
}
```

```zsh:line-numbers=47 [原文]
_zsh_autosuggest_capture_setup() {
	# There is a bug in zpty module in older zsh versions by which a
	# zpty that exits will kill all zpty processes that were forked
	# before it. Here we set up a zsh exit hook to SIGKILL the zpty
	# process immediately, before it has a chance to kill any other
	# zpty processes.
	if ! is-at-least 5.4; then
		zshexit() {
			# The zsh builtin `kill` fails sometimes in older versions
			# https://unix.stackexchange.com/a/477647/156673
			kill -KILL $$ 2>&- || command kill -KILL $$

			# Block for long enough for the signal to come through
			sleep 1
		}
	fi

	# Try to avoid any suggestions that wouldn't match the prefix
	zstyle ':completion:*' matcher-list ''
	zstyle ':completion:*' path-completion false
	zstyle ':completion:*' max-errors 0 not-numeric

	bindkey '^I' autosuggest-capture-completion
}
```

:::

## 前提知識

- **`zpty`**: zsh で疑似端末を扱う仕組みです。候補の取り込みは、この中で行われることがあります。
- **`is-at-least`**: zsh のバージョンが指定以上かを調べる関数です。
- **`zshexit`**: zsh が終わるときに呼ばれる関数です。
- **`zstyle`**: 補完の設定を書く仕組みです。`matcher-list` や `path-completion` などを変えられます。
- **`bindkey`**: キーに動作を割り当てる命令です。`^I` は Tab キーを表します。

## 何をしているか

### 1. 古い zsh の不具合に備える

```zsh:line-numbers=48
	# 古い zsh の zpty には不具合があり、終了した zpty が、それより前に作られた他の zpty をすべて止めてしまうことがあります。
	# そこで、古いバージョンでは、終了時に zpty のプロセスを直ちに止める処理を登録します。
	# これは、ほかの zpty を止める前に行われます。
	# 終了時の処理を登録し、
```

古い zsh では、終了用の処理が、他の仕事を道連れにすることがあります。そのため、バージョンが 5.4 より古ければ、終了時に子プロセスを直ちに止める処理を登録します。

### 2. 候補を絞る設定を入れる

```zsh:line-numbers=62
	fi

	# 接頭辞に一致しない候補は、試さないようにします。
```

接頭辞が一致しない候補を出さないように、補完の照合の規則や、パスの補完を調整します。エラーも、数えないように設定します。

### 3. Tab キーを取り込み用の動作にする

```zsh:line-numbers=66
	zstyle ':completion:*' path-completion false
	zstyle ':completion:*' max-errors 0 not-numeric

```

Tab キーを、補完を取り込むための動作に割り当てます。これで、取り込みの処理が、補完の入り口に組み込まれます。

## ここがすごい

- **古い環境への配慮**: バージョンごとの不具合を、条件分岐で避けています。新しい zsh では余計な処理を省きます。
- **候補の質を上げる**: 接頭辞に合わない候補を、最初から出さないようにしています。後で捨てるより効率的です。
- **準備が 1 か所にある**: 取り込みに必要な設定がまとまっているので、何を変えているかが一目で分かります。

## まとめ

- 環境の差による不具合は、バージョンで分岐して避ける。
- 候補の条件は、出す前に絞ると効率がよい。
- 一時的な設定変更は、準備の関数に集めると全体が見渡せる。
