---
title: "コマンドを実行する直前に、状態をそろえる"
description: "コマンドの実行前に、Git の取得処理との衝突を避け、開始時刻と端末のタイトルを記録し、Python の仮想環境の表示を抑える関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [91, 115]
function: "prompt_pure_preexec"
difficulty: 3
format: 2
tags: [設計パターン, 並行処理, CLI]
---
## ひとことで

`prompt_pure_preexec` は、**利用者がコマンドを実行する直前に、表示の状態を整える** 関数です。実行時間の計測、タイトルの更新、非同期の取得の停止などを行います。

プロンプトは、コマンドの実行の前後で、いくつもの情報を更新する必要があります。そのための準備を、ひとまとめにした関数です。

## コード

::: code-group

```zsh:line-numbers=91 [日本語訳]
prompt_pure_preexec() {
	if [[ -n $prompt_pure_git_fetch_pattern ]]; then
		# Git の pull や fetch を行っているかを、エイリアスも含めて調べます。
		# エイリアスの名前は大文字小文字を区別せず、git config は小文字で一覧します。
		local -H MATCH MBEGIN MEND match mbegin mend
		# 後ろには空白か区切り文字か行末が続きます。パターンを変数に入れるのは、] が [[ ]] の判定を閉じてしまうためです。
		local fetch_re="(git|hub)\ (.*\ )?($prompt_pure_git_fetch_pattern)([);&|[:space:]].*)?$"
		if [[ ${(L)2} =~ $fetch_re ]]; then
			# 利用者の pull や fetch と衝突しないように、
			# 裏で走っている取得の非同期の作業を、先に止めます。
			async_flush_jobs 'prompt_pure'
		fi
	fi

	typeset -g prompt_pure_cmd_timestamp=$EPOCHSECONDS

	# 処理が動いている間、タイトルにディレクトリ名とコマンドを表示します。
	# ルートディレクトリは名前が無いので、/ と表示します。
	prompt_pure_set_title 'ignore-escape' "${${PWD:t}:-/}: $2"

	# Python の仮想環境が、プロンプトを書き換えないようにします。
	# 利用者が値を決めていなければ、Pure が変更したことを示すために 20 を入れます。
	# ここでは、psvar で使う値と同じ 20 を使います。
	export VIRTUAL_ENV_DISABLE_PROMPT=${VIRTUAL_ENV_DISABLE_PROMPT:-20}
}
```

```zsh:line-numbers=91 [原文]
prompt_pure_preexec() {
	if [[ -n $prompt_pure_git_fetch_pattern ]]; then
		# Detect when Git is performing pull/fetch, including Git aliases.
		# Alias names are case-insensitive, and `git config` lists them in lowercase.
		local -H MATCH MBEGIN MEND match mbegin mend
		# The subcommand is followed by a space, a shell delimiter (`;`, `&`, `|`, `)`, a newline) or the end of the command line. The pattern lives in a variable because its `]]` would otherwise close the `[[ ]]` test.
		local fetch_re="(git|hub)\ (.*\ )?($prompt_pure_git_fetch_pattern)([);&|[:space:]].*)?$"
		if [[ ${(L)2} =~ $fetch_re ]]; then
			# We must flush the async jobs to cancel our git fetch in order
			# to avoid conflicts with the user issued pull / fetch.
			async_flush_jobs 'prompt_pure'
		fi
	fi

	typeset -g prompt_pure_cmd_timestamp=$EPOCHSECONDS

	# Shows the current directory and executed command in the title while a process is active.
	# The root directory has no name, so show `/`.
	prompt_pure_set_title 'ignore-escape' "${${PWD:t}:-/}: $2"

	# Disallow Python virtualenv from updating the prompt. Set it to 20 if
	# untouched by the user to indicate that Pure modified it. Here we use
	# the magic number 20, same as in `psvar`.
	export VIRTUAL_ENV_DISABLE_PROMPT=${VIRTUAL_ENV_DISABLE_PROMPT:-20}
}
```

:::

## 前提知識

- **`preexec` フック**: コマンドが実行される直前に、自動で呼ばれる処理です。
- **`EPOCHSECONDS`**: 1970 年からの秒数を表す zsh の変数です。実行時間の計測に使います。
- **`VIRTUAL_ENV_DISABLE_PROMPT`**: Python の仮想環境が、プロンプトを書き換えるかを決める環境変数です。
- **`async_flush_jobs`**: 非同期の作業を取り消す命令です。作業係の仕事を止めます。
- **`MATCH` と `MBEGIN`**: 正規表現の一致した位置を記録する zsh の変数です。ここでは、一致の情報を使わないように、ローカルに宣言しています。

## 何をしているか

### 1. Git の取得との衝突を避ける

```zsh:line-numbers=93
		# Git の pull や fetch を行っているかを、エイリアスも含めて調べます。
		# エイリアスの名前は大文字小文字を区別せず、git config は小文字で一覧します。
		local -H MATCH MBEGIN MEND match mbegin mend
		# 後ろには空白か区切り文字か行末が続きます。パターンを変数に入れるのは、] が [[ ]] の判定を閉じてしまうためです。
		local fetch_re="(git|hub)\ (.*\ )?($prompt_pure_git_fetch_pattern)([);&|[:space:]].*)?$"
		if [[ ${(L)2} =~ $fetch_re ]]; then
			# 利用者の pull や fetch と衝突しないように、
			# 裏で走っている取得の非同期の作業を、先に止めます。
			async_flush_jobs 'prompt_pure'
```

コマンドが `git` や `hub` の `fetch` か `pull` なら、非同期で走っている取得を止めます。利用者の操作と、裏の取得が競合するのを防ぐためです。

### 2. 実行の開始時刻を記録する

```zsh:line-numbers=104

```

コマンドを始めた時刻を記録します。終わったあとで、かかった時間を計算するために使います。

### 3. 端末のタイトルを更新する

```zsh:line-numbers=106

	# 処理が動いている間、タイトルにディレクトリ名とコマンドを表示します。
	# ルートディレクトリは名前が無いので、/ と表示します。
```

タイトルに、今のディレクトリ名とコマンドを入れます。ルートディレクトリは名前が無いので、`/` と表示します。

### 4. 仮想環境の表示を抑える

```zsh:line-numbers=112
	# 利用者が値を決めていなければ、Pure が変更したことを示すために 20 を入れます。
	# ここでは、psvar で使う値と同じ 20 を使います。
	export VIRTUAL_ENV_DISABLE_PROMPT=${VIRTUAL_ENV_DISABLE_PROMPT:-20}
```

Python の仮想環境が、プロンプトを勝手に書き換えないように設定します。利用者がすでに値を決めていれば、その値を尊重します。

## ここがすごい

- **競合を防ぐ**: 裏で動く取得を、利用者の `fetch` や `pull` の前に止めるので、Git のロックなどの衝突を避けられます。
- **既存の設定を尊重する**: 仮想環境の値は、利用者が決めていればそのまま使います。上書きしません。
- **準備を 1 か所に集める**: 実行前に必要な処理が、この関数にまとまっています。

## まとめ

- 裏の処理と利用者の操作が競合しうる場面では、先に裏の処理を止める。
- 他のツールの設定は、既に値があれば尊重する。
- 実行前の準備は、関数に集めると全体の流れが見えやすい。
