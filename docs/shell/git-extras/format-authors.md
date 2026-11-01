---
title: "作者ごとの割合を、表の形にそろえる"
description: "作者の行数と全体に占める割合を計算し、列をそろえた表として表示する関数。特殊な区切り文字で列を分けてから戻す。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [142, 154]
function: "format_authors"
difficulty: 3
format: 2
tags: [文字列処理, CLI, イディオム]
---
## ひとことで

`format_authors` は、**作者ごとの行数と割合を、きれいな表の形にそろえる** 関数です。入力は、行数と作者名の一覧です。

表の列をそろえるには、区切り文字で分けてから `column` を使います。ただし、名前に含まれる文字と衝突しないように、特殊な記号を区切りにしています。

## コード

::: code-group

```bash:line-numbers=142 [日本語訳]
format_authors() {
  # 作者名に含まれない珍しい Unicode の文字を、区切りとして使います。
  # column は区切りを指定すると、タブをエスケープしてしまうためです。
  # そこで、表示のあとで元のタブに戻します。
  LC_ALL=C awk '
  { args[NR] = $0; sum += $0 }
  END {
    for (i = 1; i <= NR; ++i) {
      printf "%s♪%2.1f%%\n", args[i], 100 * args[i] / sum
    }
  }
  ' | column -t -s♪ | sed "s/\\\x09/\t/g"
}
```

```bash:line-numbers=142 [原文]
format_authors() {
  # a rare unicode character is used as separator to avoid conflicting with
  # author name. However, Linux column utility will escape tab if separator
  # specified, so we do unesaping after it.
  LC_ALL=C awk '
  { args[NR] = $0; sum += $0 }
  END {
    for (i = 1; i <= NR; ++i) {
      printf "%s♪%2.1f%%\n", args[i], 100 * args[i] / sum
    }
  }
  ' | column -t -s♪ | sed "s/\\\x09/\t/g"
}
```

:::

## 前提知識

- **`awk` の `END`**: 全ての行を読み終わったあとに実行される部分です。合計を出してから、結果を表示するために使います。
- **`printf`**: 書式を指定して、整った文字列を作ります。ここでは割合を小数 1 桁で表示します。
- **`column -t -s`**: 区切り文字で分けた行を、列をそろえた表にするコマンドです。`-s` で区切りを指定します。
- **タブの扱い**: `column` は区切りがタブのとき、タブを別の文字に置き換えてしまうことがあります。そこで最後に戻しています。

## 何をしているか

### 1. 行を読み、合計を出す

```bash:line-numbers=146
  LC_ALL=C awk '
  { args[NR] = $0; sum += $0 }
```

各行を配列に保存し、行数の合計を計算します。割合の分母になる値です。

### 2. 作者ごとに割合を付けて出力する

```bash:line-numbers=148
  END {
    for (i = 1; i <= NR; ++i) {
      printf "%s♪%2.1f%%\n", args[i], 100 * args[i] / sum
    }
```

全ての行を順に表示します。行数と作者名の間に特殊な区切り文字を入れ、割合を `%` 付きで付け加えます。

### 3. 列をそろえてタブを戻す

```bash:line-numbers=153
  ' | column -t -s♪ | sed "s/\\\x09/\t/g"
```

`column` で列をそろえ、最後に `sed` で、消された可能性のあるタブを元に戻します。

## ここがすごい

- **区切りの衝突を避ける**: 作者名に普通の記号が含まれても、区切りと混ざらないように特殊な記号を使っています。
- **先に合計を出す**: 割合を求めるには全体の数が必要です。読みながら計算せず、全部読んでから表示する順序です。
- **表示の後始末を忘れない**: `column` の副作用を、最後に直す工夫があります。出力が意図した形になります。

## まとめ

- 列をそろえるときは、名前と衝突しない区切りを選ぶ。
- 割合は、先に全体の合計を求めてから表示する。
- 道具の副作用は、後の処理で戻すと安定する。
