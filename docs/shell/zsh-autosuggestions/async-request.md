---
title: "候補の取得を裏の処理に任せて、結果の受け口を作る"
description: "前の要求が残っていれば取り消し、新しい入力に対する候補を子プロセスで取りに行かせ、結果を読むための fd と処理を用意する関数。"
language: shell
project: "zsh-autosuggestions"
repo: https://github.com/zsh-users/zsh-autosuggestions
license: "MIT"
copyright: "Copyright (c) 2013 Thiago de Arruda; Copyright (c) 2016-2021 Eric Freese"
commit: "85919cd1ffa7d2d5412f6d3fe437ebdbeeec4fc5"
file: "src/async.zsh"
lines: [6, 55]
function: "_zsh_autosuggest_async_request"
difficulty: 3
format: 2
tags: [並行処理, CLI, 設計パターン]
---
## ひとことで

`_zsh_autosuggest_async_request` は、**候補の取得を裏の子プロセスに任せ、結果を受け取る窓口を作る** 関数です。入力が変わるたびに呼ばれます。

候補を探す処理が遅いと、入力のたびに画面が固まります。そこで、探す仕事を別プロセスへ移し、結果が届いたときだけ画面を更新します。

## コード

::: code-group

```zsh:line-numbers=6 [日本語訳]
_zsh_autosuggest_async_request() {
	zmodload zsh/system 2>/dev/null # zsh/system は、子プロセスの pid を得るために使います。

	typeset -g _ZSH_AUTOSUGGEST_ASYNC_FD _ZSH_AUTOSUGGEST_CHILD_PID

	# 未完了の要求があれば、取り消します。
	if [[ -n "$_ZSH_AUTOSUGGEST_ASYNC_FD" ]] && { true <&$_ZSH_AUTOSUGGEST_ASYNC_FD } 2>/dev/null; then
		# fd を閉じて、受け取りの登録を外します。
		builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}<&-
		zle -F $_ZSH_AUTOSUGGEST_ASYNC_FD

		# zsh/system が無いと pid は分からないので、ここでは止められません。
		if [[ -n "$_ZSH_AUTOSUGGEST_CHILD_PID" ]]; then
			# ジョブ制御が有効なときだけ、zsh は子プロセス用の新しいプロセスグループを作ります。
			# ジョブ制御（MONITOR オプション）が有効かを調べます。
			if [[ -o MONITOR ]]; then
				# プロセスグループ全体へ終了の信号を送り、子の子も止めます。
				# 候補の取得で派生したプロセスも対象です。
				kill -TERM -$_ZSH_AUTOSUGGEST_CHILD_PID 2>/dev/null
			else
				# プロセスグループが無いときは、子プロセスだけを止めます。
				# 候補の取得が派生させたプロセスは、残る可能性があります。
				# 取り残されることがあります。
				kill -TERM $_ZSH_AUTOSUGGEST_CHILD_PID 2>/dev/null
			fi
		fi
	fi

	# 候補を取得する子プロセスを作り、その出力を読む fd を開きます。
	builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}< <(
		# 親プロセスへ、自分の pid を伝えます。
		echo $sysparams[pid]

		# 候補を取得して、表示します。
		local suggestion
		_zsh_autosuggest_fetch_suggestion "$1"
		echo -nE "$suggestion"
	)

	# ^C が効かなくなる不具合を避けるため、強制的に fork させます。
	# 参考の issue です。
	autoload -Uz is-at-least
	is-at-least 5.8 || command true

	# 子プロセスの pid を読み取ります。
	read _ZSH_AUTOSUGGEST_CHILD_PID <&$_ZSH_AUTOSUGGEST_ASYNC_FD

	# fd が読めるようになったら、応答の処理を呼びます。
	zle -F "$_ZSH_AUTOSUGGEST_ASYNC_FD" _zsh_autosuggest_async_response
}
```

```zsh:line-numbers=6 [原文]
_zsh_autosuggest_async_request() {
	zmodload zsh/system 2>/dev/null # For `$sysparams`

	typeset -g _ZSH_AUTOSUGGEST_ASYNC_FD _ZSH_AUTOSUGGEST_CHILD_PID

	# If we've got a pending request, cancel it
	if [[ -n "$_ZSH_AUTOSUGGEST_ASYNC_FD" ]] && { true <&$_ZSH_AUTOSUGGEST_ASYNC_FD } 2>/dev/null; then
		# Close the file descriptor and remove the handler
		builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}<&-
		zle -F $_ZSH_AUTOSUGGEST_ASYNC_FD

		# We won't know the pid unless the user has zsh/system module installed
		if [[ -n "$_ZSH_AUTOSUGGEST_CHILD_PID" ]]; then
			# Zsh will make a new process group for the child process only if job
			# control is enabled (MONITOR option)
			if [[ -o MONITOR ]]; then
				# Send the signal to the process group to kill any processes that may
				# have been forked by the suggestion strategy
				kill -TERM -$_ZSH_AUTOSUGGEST_CHILD_PID 2>/dev/null
			else
				# Kill just the child process since it wasn't placed in a new process
				# group. If the suggestion strategy forked any child processes they may
				# be orphaned and left behind.
				kill -TERM $_ZSH_AUTOSUGGEST_CHILD_PID 2>/dev/null
			fi
		fi
	fi

	# Fork a process to fetch a suggestion and open a pipe to read from it
	builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}< <(
		# Tell parent process our pid
		echo $sysparams[pid]

		# Fetch and print the suggestion
		local suggestion
		_zsh_autosuggest_fetch_suggestion "$1"
		echo -nE "$suggestion"
	)

	# There's a weird bug here where ^C stops working unless we force a fork
	# See https://github.com/zsh-users/zsh-autosuggestions/issues/364
	autoload -Uz is-at-least
	is-at-least 5.8 || command true

	# Read the pid from the child process
	read _ZSH_AUTOSUGGEST_CHILD_PID <&$_ZSH_AUTOSUGGEST_ASYNC_FD

	# When the fd is readable, call the response handler
	zle -F "$_ZSH_AUTOSUGGEST_ASYNC_FD" _zsh_autosuggest_async_response
}
```

:::

## 前提知識

- **子プロセス**: 親の処理から派生して、別に動く処理です。`<( ... )` の形で、出力を読める窓口を作れます。
- **fd（ファイルの記述子）**: 開いた入出力を、番号で表したものです。ここでは、子プロセスの出力を読む口として使われます。
- **`zle -F`**: fd にデータが届いたときに、関数を呼び出すように登録する命令です。
- **プロセスグループ**: 関連するプロセスをまとめた単位です。`kill -TERM -pid` で、まとめて終了させられます。
- **`MONITOR` オプション**: ジョブ制御が有効かどうかを表す設定です。有効なときだけ、子プロセスは別のプロセスグループを持ちます。

## 何をしているか

### 1. 古い要求があれば取り消す

```zsh:line-numbers=9
	typeset -g _ZSH_AUTOSUGGEST_ASYNC_FD _ZSH_AUTOSUGGEST_CHILD_PID

	# 未完了の要求があれば、取り消します。
	if [[ -n "$_ZSH_AUTOSUGGEST_ASYNC_FD" ]] && { true <&$_ZSH_AUTOSUGGEST_ASYNC_FD } 2>/dev/null; then
		# fd を閉じて、受け取りの登録を外します。
		builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}<&-
		zle -F $_ZSH_AUTOSUGGEST_ASYNC_FD

		# zsh/system が無いと pid は分からないので、ここでは止められません。
		if [[ -n "$_ZSH_AUTOSUGGEST_CHILD_PID" ]]; then
			# ジョブ制御が有効なときだけ、zsh は子プロセス用の新しいプロセスグループを作ります。
			# ジョブ制御（MONITOR オプション）が有効かを調べます。
			if [[ -o MONITOR ]]; then
				# プロセスグループ全体へ終了の信号を送り、子の子も止めます。
```

前の候補取得がまだ残っていれば、その fd を閉じて受け取りの登録を外します。続けて子プロセスを止めます。ジョブ制御が有効なら、プロセスグループ全体を止めます。

### 2. 子プロセスで候補を取りに行く

```zsh:line-numbers=33

	# 候補を取得する子プロセスを作り、その出力を読む fd を開きます。
	builtin exec {_ZSH_AUTOSUGGEST_ASYNC_FD}< <(
		# 親プロセスへ、自分の pid を伝えます。
		echo $sysparams[pid]

		# 候補を取得して、表示します。
		local suggestion
		_zsh_autosuggest_fetch_suggestion "$1"
		echo -nE "$suggestion"
	)

```

`<( ... )` の中で、子プロセスの pid を先に出し、候補の取得関数を呼んで結果を表示します。親はこの出力を、fd から読みます。

### 3. pid を読み、結果の受け口を登録する

```zsh:line-numbers=48
	is-at-least 5.8 || command true

	# 子プロセスの pid を読み取ります。
	read _ZSH_AUTOSUGGEST_CHILD_PID <&$_ZSH_AUTOSUGGEST_ASYNC_FD

	# fd が読めるようになったら、応答の処理を呼びます。
	zle -F "$_ZSH_AUTOSUGGEST_ASYNC_FD" _zsh_autosuggest_async_response
}
```

最初に届いた pid を読んで、後で止められるように記録します。そして、fd にデータが届いたときに `_zsh_autosuggest_async_response` が呼ばれるように登録します。

## ここがすごい

- **古い結果を捨てる**: 入力が変わったら、前の要求を確実に取り消します。遅れて届いた古い候補が、新しい入力を上書きしません。
- **プロセスの後始末に気を配る**: ジョブ制御の有無で、止める範囲を変えています。子の子まで止められるように工夫されています。
- **画面を止めない**: 候補の取得は裏で進み、届いたときだけ表示されます。入力の反応が保たれます。

## まとめ

- 遅い処理は、裏の子プロセスに任せて結果を受け取る窓口を作ると、入力を止めない。
- 古い要求は、新しい要求の前に必ず取り消す。
- プロセスを止めるときは、子の子までまとめて止められるかを確かめる。
