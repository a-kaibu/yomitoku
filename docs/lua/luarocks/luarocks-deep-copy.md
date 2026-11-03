---
title: テーブルの中のテーブルまで写す、深いコピーの 10 行
description: Lua のパッケージマネージャ LuaRocks の util.deep_copy。テーブルの中身を再帰でたどり、入れ子になったテーブルも新しく作り直します。循環参照には対応していない点も読みます。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [387, 397]
format: 2
function: util.deep_copy
difficulty: 2
tags: [再帰, データ構造, 設計パターン]
---

## ひとことで

`util.deep_copy(tbl)` は、テーブルを「深く」コピーする関数です。ふつうの代入は、テーブルの参照をコピーするだけなので、元と新しいテーブルが同じ中身を共有してしまいます。この関数は、中にあるテーブルも 1 つずつ新しく作り直すので、コピーを変えても元が変わりません。

## コード

```lua:line-numbers=387
function util.deep_copy(tbl)
   local copy = {}
   for k, v in pairs(tbl) do
      if type(v) == "table" then
         copy[k] = util.deep_copy(v)
      else
         copy[k] = v
      end
   end
   return copy
end
```

## 前提知識

- **参照のコピー**: Lua では、テーブルを `b = a` と代入すると、同じテーブルを指す別の名前ができるだけです。中身は共有されます。
- **浅いコピー（shallow copy）**: テーブルの一段目だけを新しく作る方法です。中にさらにテーブルがあると、その部分は共有されたままです。
- **深いコピー（deep copy）**: 入れ子のテーブルも、すべて新しく作る方法です。
- **再帰呼び出し**: 関数が自分自身を呼ぶことです。入れ子の深さだけ、同じ処理を繰り返せます。

## 何をしているか

### 1. 新しい空の表を用意する

`copy` は、コピー先の空の表です。元の `tbl` とは別のものなので、ここに入れた値は元に影響しません。

```lua:line-numbers=388
   local copy = {}
```

### 2. 値を 1 つずつ見る

`pairs(tbl)` で、キーと値を 1 組ずつ取り出します。値がテーブルなら、その中身も同じ関数でコピーします。そうでなければ、数字や文字列のように、そのまま代入して問題ありません。

```lua:line-numbers=389
   for k, v in pairs(tbl) do
      if type(v) == "table" then
         copy[k] = util.deep_copy(v)
      else
         copy[k] = v
      end
   end
```

### 3. 完成したコピーを返す

すべての組を入れ終わったら、新しい表を返します。

```lua:line-numbers=396
   return copy
```

## ここがすごい

- **数字や文字列はそのまま代入できる**: 値として変わらないものは、コピーが不要です。テーブルだけを再帰で作り直すので、無駄な処理が少なくなります。
- **同じ関数で入れ子を扱える**: 入れ子の深さが何段でも、同じ 3 行の判定で済みます。再帰は、木の形のデータに合った書き方です。
- **限界をよく知っておく**: この関数は、テーブルが自分自身を指す循環参照に対応していません。そのようなデータを渡すと、無限に再帰して止まらなくなります。LuaRocks の設定データのように、循環しないことが分かっている場所で使われる、という割り切りの設計です。
- **注意点**: テーブルのキーは、コピーされません。キーがテーブルの場合、その参照はそのまま使われます。

## まとめ

- テーブルを独立させたいときは、入れ子も再帰で新しく作る深いコピーが必要。
- 値がテーブルかどうかで分ければ、必要な部分だけを作り直せる。
- 循環参照のあるデータには使えないので、データの形を確かめてから使う。
