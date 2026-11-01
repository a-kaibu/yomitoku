---
title: "コマンドが遅かったときだけ、プロンプトに所要時間を出す"
description: "直前のコマンドが一定秒数を超えたときだけ、その所要時間をプロンプト用の変数に入れる。zsh の算術式だけで経過時間を計算している。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [47, 54]
function: "prompt_pure_check_cmd_exec_time"
difficulty: 2
format: 2
tags: [CLI, 日時, イディオム]
---
## ひとことで

`prompt_pure_check_cmd_exec_time` は、直前に実行したコマンドにどれだけ時間がかかったかを調べ、**5 秒を超えていた場合だけ** 時間を表示用の変数に入れる関数です。

プロンプトは、コマンドが終わるたびに表示し直されます。そのとき短いコマンドの時間まで毎回表示すると、画面がうるさくなります。そこで、待たされたと感じるほど長かったコマンドだけに、時間を添えています。

## コード

```zsh:line-numbers=47
prompt_pure_check_cmd_exec_time() {
	integer elapsed
	(( elapsed = EPOCHSECONDS - ${prompt_pure_cmd_timestamp:-$EPOCHSECONDS} ))
	typeset -g prompt_pure_cmd_exec_time=
	(( elapsed > ${PURE_CMD_MAX_EXEC_TIME:-5} )) && {
		prompt_pure_human_time_to_var $elapsed "prompt_pure_cmd_exec_time"
	}
}
```

## 前提知識

- **プロンプト**: ターミナルで入力を待つときに表示される文字列です。Pure は、それを見やすく整えるテーマです。
- **`EPOCHSECONDS`**: zsh が用意している特殊変数で、1970 年 1 月 1 日からの経過秒数が入っています。
- **`integer 変数`**: zsh で、変数を整数として扱うよう宣言します。
- **`typeset -g`**: 関数の中でも、グローバルな変数として定義します。`-g` がないと、関数を抜けると消えてしまいます。
- **`(( 式 ))`**: 算術式を評価します。結果が 0 以外なら成功になります。
- **`${変数:-既定値}`**: 変数が空や未定義のとき、既定値を使います。

## 何をしているか

### 1. 経過秒数を計算する

```zsh:line-numbers=49
	(( elapsed = EPOCHSECONDS - ${prompt_pure_cmd_timestamp:-$EPOCHSECONDS} ))
```

現在の時刻から、コマンドを始めた時刻（`prompt_pure_cmd_timestamp`）を引いて、経過秒数を `elapsed` に入れます。時刻の記録がない場合は、差が 0 になるように既定値を使います。

### 2. 表示用の変数を空にする

```zsh:line-numbers=50
	typeset -g prompt_pure_cmd_exec_time=
```

前回の結果が残らないように、表示用の変数を空にしておきます。

### 3. 閾値を超えたときだけ時間を作る

```zsh:line-numbers=51
	(( elapsed > ${PURE_CMD_MAX_EXEC_TIME:-5} )) && {
		prompt_pure_human_time_to_var $elapsed "prompt_pure_cmd_exec_time"
	}
```

経過秒数が `PURE_CMD_MAX_EXEC_TIME`（既定で 5 秒）を超えたときだけ、`prompt_pure_human_time_to_var` を呼んで、「1m 20s」のような読みやすい形にします。閾値は、ユーザーが環境変数で変えられます。

## ここがすごい

- **表示の判断を 1 か所にまとめている**: 「遅いときだけ出す」という判断を、この関数だけが持っています。表示する側は、変数が空かどうかを見るだけで済みます。
- **外部コマンドを使わない**: 時刻の取得に `date` を呼ばず、`EPOCHSECONDS` を使うので、プロンプトの表示のたびに余計なプロセスが生まれません。
- **閾値をユーザーが変えられる**: 値に既定値を使っているので、設定しなくても動き、必要なら書き換えられます。

## まとめ

- 「遅いときだけ知らせる」は、閾値との比較で実装できる。
- zsh の `EPOCHSECONDS` で、外部コマンドなしに秒単位の時間が得られる。
- 表示用の変数は毎回初期化すると、古い値が残らない。
