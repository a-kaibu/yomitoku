---
title: "「何コミット先か遅れか」を 1 回の git コマンドで数える"
description: "現在のブランチが上流より何コミット進んでいて、何コミット遅れているかを、git rev-list の --left-right --count で一度に取得する関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [501, 507]
function: "prompt_pure_async_git_arrows"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`prompt_pure_async_git_arrows` は、今のブランチが **リモートの上流ブランチと比べて、どれだけ進んでいて、どれだけ遅れているか** を数えて返す関数です。結果は、`3	1` のような 2 つの数字になります。

Pure は、この数字を矢印の記号に変えてプロンプトに表示します。プロンプトを見るだけで、push や pull が必要かがわかります。

## コード

```zsh:line-numbers=501
prompt_pure_async_git_arrows() {
	setopt localoptions noshwordsplit
	if (( ${1:-1} )); then
		prompt_pure_async_print_generation
	fi
	command git rev-list --left-right --count HEAD...@'{u}'
}
```

## 前提知識

- **上流ブランチ（upstream）**: ローカルのブランチが追いかけているリモートのブランチです。`@{u}` という書き方で指せます。
- **`git rev-list A...B`**: A と B のどちらか一方にだけあるコミットを表示します。
- **`--left-right`**: 結果の各コミットに、左（A 側）か右（B 側）かの印を付けます。
- **`--count`**: 一覧を表示せずに、数だけを表示します。左と右の数が、タブで区切られて出てきます。
- **`setopt localoptions noshwordsplit`**: この関数の中だけ、変数の値を空白で分けないように設定します。
- **`$1`**: 1 番目の引数です。`${1:-1}` は、引数がないときは 1 として扱います。

## 何をしているか

### 1. 必要なら生成の印を出す

```zsh:line-numbers=502
	setopt localoptions noshwordsplit
	if (( ${1:-1} )); then
		prompt_pure_async_print_generation
	fi
```

`setopt` で、関数の中だけ単語分割を止めます。引数が 1（または省略）のときは、`prompt_pure_async_print_generation` を先に呼びます。この関数は、非同期の処理の世代を進めるための処理です（名前から読み取れる範囲の説明です）。

### 2. 進みと遅れを数える

```zsh:line-numbers=506
	command git rev-list --left-right --count HEAD...@'{u}'
```

`HEAD...@{u}` は、今のコミットと上流のコミットのどちらか一方だけにあるコミットです。`--left-right --count` を付けると、左側（今のブランチだけにあるもの）の数と、右側（上流だけにあるもの）の数が、1 行にまとめて出てきます。

たとえば `3	1` と出れば、3 コミット先行していて、1 コミット遅れている、という意味です。

## ここがすごい

- **1 回の git 呼び出しで 2 つの値を得る**: 先行と遅れを別々に数えると、git を 2 回呼ぶことになります。`--left-right` を使えば、1 回で両方が手に入ります。
- **非同期で動く**: Pure はこの処理を、プロンプトの表示をブロックしないように、裏で動かします。遅いリポジトリでも入力が止まりません。
- **単語分割の罠を避けている**: `noshwordsplit` を設定し、変数の中の空白で壊れないようにしています。

## まとめ

- 2 つの集合の差は、`A...B` と `--left-right --count` で一度に数えられる。
- git の結果を表示する前に、整形の処理を分けて書くと読みやすい。
- 遅い処理は、プロンプトの表示を止めないように裏で動かす。
