---
title: "ターミナルのウィンドウのタイトルを、状況に合わせて書き換える"
description: "端末に出力しているときだけ、ウィンドウのタイトルを表すエスケープを出す関数。SSH 接続中はホスト名も入れる。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [56, 89]
function: "prompt_pure_set_title"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`prompt_pure_set_title` は、**ターミナルのウィンドウのタイトルを、今の状況に合わせて書き換える** 関数です。タイトルには、コマンドの実行中はディレクトリ名とコマンドを、SSH 接続中はホスト名を含めます。

タイトルは、複数のタブを並べたときに、どのウィンドウが何をしているかを示す手がかりです。ただし、すべての環境で書き換えてよいわけではありません。そのため、いくつかの条件を先に調べます。

## コード

::: code-group

```zsh:line-numbers=56 [日本語訳]
prompt_pure_set_title() {
	setopt localoptions noshwordsplit

	# タイトルの管理を、利用者が止められるようにします。
	zstyle -T ":prompt:pure:title" show || return

	# Emacs の端末は、タイトルの設定に対応していません。
	(( ${+EMACS} || ${+INSIDE_EMACS} )) && return

	# 標準出力が端末のときだけ、エスケープを出します。ファイルやパイプに出力するスクリプトを壊さないためです。
	# $TTY では判断できません。端末から zsh script.zsh > out のように実行しても、TTY が空にならないためです。
	[[ -t 1 ]] || return

	case $TTY in
		# シリアルコンソールでは、タイトルを設定しません。
		/dev/ttyS[0-9]*) return;;
	esac

	# SSH 接続中で、ホストの表示が有効ならホスト名を表示します。
	local hostname=
	if (( psvar[13] )) && (( ${prompt_pure_state[show_host]:-1} )); then
		# ignore-escape を使う場合に備えて、その場で展開します。
		hostname="${(%):-(%m) }"
	fi

	local -a opts
	case $1 in
		expand-prompt) opts=(-P);;
		ignore-escape) opts=(-r);;
	esac

	# XTRACE が有効でも動くように、1 回の print でタイトルを設定します。
	print -n $opts $'\e]0;'${hostname}${2}$'\a'
}
```

```zsh:line-numbers=56 [原文]
prompt_pure_set_title() {
	setopt localoptions noshwordsplit

	# Allow disabling title management.
	zstyle -T ":prompt:pure:title" show || return

	# Emacs terminal does not support settings the title.
	(( ${+EMACS} || ${+INSIDE_EMACS} )) && return

	# Only write the escape when standard output is a terminal, or it would corrupt the output of a non-interactive script that sources Pure and redirects its stdout to a file or a pipe.
	# $TTY is not a substitute: zsh also sets it from a tty on stdin, so it stays non-empty for `zsh script.zsh > out` run from a terminal.
	[[ -t 1 ]] || return

	case $TTY in
		# Don't set title over serial console.
		/dev/ttyS[0-9]*) return;;
	esac

	# Show hostname if connected via SSH and host display is enabled.
	local hostname=
	if (( psvar[13] )) && (( ${prompt_pure_state[show_host]:-1} )); then
		# Expand in-place in case ignore-escape is used.
		hostname="${(%):-(%m) }"
	fi

	local -a opts
	case $1 in
		expand-prompt) opts=(-P);;
		ignore-escape) opts=(-r);;
	esac

	# Set title atomically in one print statement so that it works when XTRACE is enabled.
	print -n $opts $'\e]0;'${hostname}${2}$'\a'
}
```

:::

## 前提知識

- **エスケープシーケンス**: 端末に対する特別な命令を、文字列の形で送る仕組みです。`\e]0;` で始まるものは、タイトルを変える命令です。
- **`[[ -t 1 ]]`**: 標準出力が端末に接続されているかを調べる判定です。
- **`psvar`**: プロンプトで使う値を入れておく配列です。ここでは、SSH 接続かどうかの印を見ます。
- **`%m`**: プロンプトの特殊な書式で、ホスト名を表します。
- **`print -n`**: 改行を付けずに表示する命令です。

## 何をしているか

### 1. 設定と環境を確かめる

```zsh:line-numbers=60
	zstyle -T ":prompt:pure:title" show || return

	# Emacs の端末は、タイトルの設定に対応していません。
	(( ${+EMACS} || ${+INSIDE_EMACS} )) && return

	# 標準出力が端末のときだけ、エスケープを出します。ファイルやパイプに出力するスクリプトを壊さないためです。
```

利用者がタイトルの管理を止めていれば戻ります。Emacs の端末はタイトルを変えられないので、ここでも戻ります。

### 2. 出力先と端末の種類を確かめる

```zsh:line-numbers=69
	case $TTY in
		# シリアルコンソールでは、タイトルを設定しません。
		/dev/ttyS[0-9]*) return;;
	esac

	# SSH 接続中で、ホストの表示が有効ならホスト名を表示します。
	local hostname=
```

標準出力が端末でなければ、エスケープを出すと出力を壊すので、戻ります。シリアルコンソールの端末も、タイトルを変えずに戻ります。

### 3. SSH のときはホスト名を加える

```zsh:line-numbers=78
		hostname="${(%):-(%m) }"
	fi

	local -a opts
	case $1 in
```

SSH 接続中で、ホスト名の表示が有効なら、ホスト名を前に付けます。

### 4. 表示の形を選び、タイトルを出す

```zsh:line-numbers=84
		ignore-escape) opts=(-r);;
	esac

	# XTRACE が有効でも動くように、1 回の print でタイトルを設定します。
	print -n $opts $'\e]0;'${hostname}${2}$'\a'
}
```

引数に応じて、プロンプトの展開をするか、エスケープをそのまま扱うかを選びます。最後に、タイトルを表すエスケープを 1 回の `print` で出力します。

## ここがすごい

- **出力を壊さない**: 端末以外への出力では、エスケープを出しません。スクリプトの結果をファイルに書き出しても、乱れません。
- **環境ごとに例外を持つ**: Emacs やシリアルコンソールは、タイトルを変えると問題が起きるため、個別に除いています。
- **1 回の出力で書く**: タイトルの命令を 1 回の `print` にまとめているので、途中の状態が見えません。

## まとめ

- 端末の制御は、出力先が端末かを確かめてから行う。
- 環境ごとの例外は、先に戻る条件として並べると読みやすい。
- 出力の命令は、1 回にまとめると途中の状態が混ざらない。
