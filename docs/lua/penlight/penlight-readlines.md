---
title: ファイルの行を配列に読み込む readlines
description: Lua のユーティリティ集 Penlight の utils.readlines。ファイルを開いて、各行を配列に入れて返します。開けなかったときは、エラーの情報を返します。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [574, 584]
format: 2
function: utils.readlines
difficulty: 1
tags: [入出力, エラー処理, データ構造]
---
## ひとことで

`utils.readlines(filename)` は、テキストファイルを一行ずつ読み、その行を並べた配列を返す関数です。ファイルが開けなかったときは、エラーの情報を返します。設定ファイルや、データの一覧を読むときに、短く書けます。

## コード

```lua:line-numbers=574
function utils.readlines(filename)
    utils.assert_string(1,filename)
    local f,err = io.open(filename,'r')
    if not f then return raise(err) end
    local res = {}
    for line in f:lines() do
        append(res,line)
    end
    f:close()
    return res
end
```

## 前提知識

- **`io.open`**: ファイルを開く標準関数です。成功すると、ファイルの操作をするための値を返します。失敗すると、`nil` と、理由の文字列を返します。
- **`f:lines()`**: 開いたファイルから、一行ずつ値を取り出すイテレータを返すメソッドです。`for` で回すと、末尾まで順に読めます。
- **`f:close()`**: 開いたファイルを閉じます。閉じ忘れると、使える資源を無駄にします。
- **`raise`**: エラーを、Penlight の方針に従って伝える関数です。設定によって、戻り値として返すか、エラーを起こすかが変わります。

## 何をしているか

### 1. ファイル名を確かめて開く

`assert_string` で、ファイル名が文字列であるかを確かめます。そして、`io.open` で読み取りとして開きます。

```lua:line-numbers=575
    utils.assert_string(1,filename)
    local f,err = io.open(filename,'r')
```

### 2. 開けなかったら、エラーを伝える

`f` が `nil` のときは、`raise(err)` でエラーを伝えて終わります。理由の文字列は、そのまま `err` として渡されます。

```lua:line-numbers=577
    if not f then return raise(err) end
```

### 3. 行を配列に入れて、閉じる

`f:lines()` で行を一つずつ取り出し、`append` で配列に入れます。読み終えたら、`f:close()` でファイルを閉じて、配列を返します。

```lua:line-numbers=578
    local res = {}
    for line in f:lines() do
        append(res,line)
    end
    f:close()
    return res
```

## ここがすごい

- **閉じ忘れを防ぐ**: 読み終えたら、ファイルを必ず閉じています。資源の後始末が、関数の中で完結します。
- **エラーの扱いを統一**: 開けなかった理由を、Penlight の共通の仕組みで伝えます。呼ぶ側は、他の関数と同じ書き方で失敗に対応できます。
- **引数の確認が先**: ファイル名が文字列でないと、開く前に止まります。思わぬ型のエラーを避けられます。
- **注意点**: ファイル全体を一度に配列にするので、巨大なファイルではメモリを多く使います。大きなデータは、一行ずつ処理する方法を考えてください。

## まとめ

- ファイルを読むときは、開く、読む、閉じるの流れを一つの関数にまとめると、閉じ忘れを防げる。
- 失敗の伝え方を共通の仕組みにすると、呼ぶ側の処理が統一できる。
- 大きなファイルは、配列に全部入れず、行ごとに扱う方法を選ぶ。
