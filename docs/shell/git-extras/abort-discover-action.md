---
title: "実行された名前から、abort か continue かを決める"
description: "スクリプトの名前から git- を取り除き、abort か continue だけを受け付けて表示する関数。それ以外はエラーで止める。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-abort"
lines: [32, 39]
function: "discover_action"
difficulty: 2
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`discover_action` は、**実行された名前から、abort か continue かを決める** 関数です。`git-abort` と `git-continue` のように、同じスクリプトを名前だけ変えて使い分けられるようにしています。

同じ中身のファイルを、名前を変えて複数置く、という仕組みを支える部品です。名前の誤りには、すぐ気づけるようにしています。

## コード

```bash:line-numbers=32
discover_action() {
    local action=${1/git-/}
    if [ "$action" != "abort" ] && [ "$action" != "continue" ]; then
        echo "Invalid action: $1" >&2
        exit 1
    fi
    echo "$action"
}
```

## 前提知識

- **シンボリックリンクと名前の使い分け**: 同じファイルに別の名前を付けて、呼び出された名前で動きを変える方法です。
- **`${1/git-/}`**: 文字列の中の最初の `git-` を取り除く、bash の書き方です。
- **`$0`**: 実行されたスクリプトの名前です。ここでは `basename` で、その名前だけを取り出しています。
- **`echo` と `exit`**: 結果を表示し、エラーなら終了コードを返して止めます。

## 何をしているか

### 1. 名前から git- を取り除く

```bash:line-numbers=33
    local action=${1/git-/}
```

呼び出された名前の `git-` の部分を消して、残りを `action` に入れます。

### 2. abort か continue かを確かめる

```bash:line-numbers=34
    if [ "$action" != "abort" ] && [ "$action" != "continue" ]; then
        echo "Invalid action: $1" >&2
        exit 1
    fi
```

`abort` でも `continue` でもなければ、無効な操作だと表示して終了します。

### 3. 結果を返す

```bash:line-numbers=38
    echo "$action"
```

正しい名前であれば、その名前を表示します。呼び出し側は、この出力を受け取って使います。

## ここがすごい

- **名前だけで動きを変える**: 同じスクリプトを、名前によって別の操作として使えます。設定の重複がありません。
- **許す値を限定する**: 2 つの名前だけを通すので、思わぬ呼び出しで中断や続行が起きません。
- **誤りを早く見つける**: 不正な名前は、すぐにエラーで止めます。

## まとめ

- 同じ中身を名前で使い分けるときは、呼び出された名前を検証してから使う。
- 許す値は、明示的な一覧で限定する。
- 不正な入力は、後続の処理の前に止める。
