---
title: 表や関数に番号を振る、Inspector の getId
description: Lua の表示ライブラリ inspect.lua の Inspector:getId。値ごとに一度だけ番号を決め、型ごとの番号も数えます。同じ値は同じ番号で表示されます。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [260, 269]
format: 2
function: Inspector:getId
difficulty: 2
tags: [ハッシュ, データ構造, 可読性]
---
## ひとことで

`Inspector:getId(v)` は、値 `v` に固有の番号を返す関数です。同じ値には、何度呼んでも同じ番号が返ります。表が循環していても、「これは 3 番目に出てきた表だ」のように、一意な印として表示するために使われます。

## コード

```lua:line-numbers=260
function Inspector:getId(v)
   local id = self.ids[v]
   local ids = self.ids
   if not id then
      local tv = type(v)
      id = (ids[tv] or 0) + 1
      ids[v], ids[tv] = id, id
   end
   return tostring(id)
end
```

## 前提知識

- **メソッド定義 `Inspector:getId`**: コロンを使うと、最初の引数 `self` が自動的に渡されます。`self.ids` で、番号を覚えておく表を参照できます。
- **表をキーにする**: Lua では、表自身をキーに使えます。ここでは、値そのものをキーにして、番号を覚えています。
- **`tostring`**: 値を文字列に変換する標準関数です。番号を文字列として返すので、表示に直接使えます。
- **型ごとの数え方**: `type(v)` で、値の型を文字列で取り出せます。`ids[tv]` は、その型の番号が何まで進んだかを覚えます。

## 何をしているか

### 1. 登録済みなら、その番号を使う

`self.ids[v]` を調べます。すでに番号があれば、`id` にその値が入ります。

```lua:line-numbers=260
function Inspector:getId(v)
   local id = self.ids[v]
   local ids = self.ids
   if not id then
```

### 2. 新しい値なら、型ごとに番号を進める

まだ番号がなければ、値の型 `tv` を調べます。`ids[tv]` を一つ増やした値を、新しい番号とします。

```lua:line-numbers=264
      local tv = type(v)
      id = (ids[tv] or 0) + 1
      ids[v], ids[tv] = id, id
```

### 3. 文字列として返す

番号を `tostring` で文字列にして返します。表示する文字列の中に、そのまま埋め込めます。

```lua:line-numbers=268
   return tostring(id)
```

## ここがすごい

- **同じ値は同じ番号**: 値をキーにして覚えるので、同じ表が何度出てきても、同じ番号で表示できます。これで、循環や共有の関係が、目で分かります。
- **型ごとに数える**: 表の番号と、関数の番号が混ざりません。番号の並びが、型ごとに 1 から始まるので、読みやすくなっています。
- **表自身を登録する仕組み**: 表や関数をキーにできるのは、Lua の表がどんな値でもキーになれるからです。文字列の名前を作る必要がありません。
- **注意点**: 番号は、呼ばれた順で決まります。そのため、同じ表でも、処理の順番が変わると番号が変わります。

## まとめ

- 値に番号を付けるときは、値そのものをキーにすると、同じ値の番号を確実に保てる。
- 型ごとに番号を数えると、表示の番号が整理されて読みやすくなる。
- 番号は呼ばれた順で決まるので、比べるときは同じ処理の中で使う。
