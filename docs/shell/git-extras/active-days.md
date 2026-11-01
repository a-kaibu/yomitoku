---
title: "作業した日数を数える"
description: "コミットの日付の一覧から重複を除き、何日分の日付があるかを数えて表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [77, 82]
function: "active_days"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`active_days` は、**コミットがあった日の数を数える** 関数です。同じ日に何回コミットしても、1 日として数えます。

作業の継続具合を見るために、git-summary の概要に表示されます。何日にわたって作業したかは、コミットの回数とは違う目安になります。

## コード

```bash:line-numbers=77
active_days() {
  commit_date "$1" | sort -r | uniq | awk '
    { sum += 1 }
    END { print sum }
  '
}
```

## 前提知識

- **`commit_date`**: コミットの日付の一覧を出す、同じファイル内の関数です。この関数は、その出力を受け取ります。
- **`sort -r`**: 行を逆順に並べ替えるコマンドです。
- **`uniq`**: 隣り合う同じ行を 1 つにまとめるコマンドです。並べ替えてから使うことで、全ての重複が消えます。
- **`awk`**: 行ごとに処理を書けるテキスト処理のツールです。`END` ブロックは、全ての行を読んだあとに実行されます。

## 何をしているか

### 1. 日付の一覧を並べ替え、重複を消す

```bash:line-numbers=78
  commit_date "$1" | sort -r | uniq | awk '
```

`commit_date` の出力を逆順に並べ、`uniq` で同じ日付を 1 つにまとめます。

### 2. 行を数えて表示する

```bash:line-numbers=79
    { sum += 1 }
    END { print sum }
  '
```

`awk` で 1 行ごとに件数を足し、全部読んだあとで合計を表示します。残った行は、ユニークな日付の数です。

## ここがすごい

- **パイプで組み立てる**: 1 つのコマンドで全部行わず、小さな道具をつないで処理します。それぞれの役割がはっきりします。
- **並べ替えと重複の消去を組み合わせる**: `uniq` は隣の行しか見ないため、先に並べ替えています。この順序が、正しい件数を保証します。
- **数を読むだけ**: 日付の中身は表示せず、件数だけを返します。関数の目的が単純です。

## まとめ

- 重複を消して数えるときは、並べ替えてから `uniq` を使う。
- 行の集計は、`awk` の `END` で最後にまとめて表示すると簡潔。
- 小さな道具をパイプでつなぐと、役割が分かりやすい。
