---
title: 循環を壊さずに表を写す、processRecursive
description: Lua の表示ライブラリ inspect.lua の processRecursive。表を再帰的に辿り、同じ表を二度写さないように visited で覚えます。循環参照があっても、無限に進みません。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [213, 239]
format: 2
function: processRecursive
difficulty: 3
tags: [再帰, メタプログラミング, データ構造]
---
## ひとことで

`processRecursive(process, item, path, visited)` は、表の中身を再帰的に辿りながら、各値を `process` という関数で変換して、新しい表を作る関数です。同じ表が何度出てきても、一度作ったものを使い回すので、表が自分を指す循環があっても無限に進みません。inspect.lua が表を文字列にする前に、中身を整えるために使われます。

## コード

```lua:line-numbers=213
local function processRecursive(process,
   item,
   path,
   visited)
   if item == nil then return nil end
   if visited[item] then return visited[item] end

   local processed = process(item, path)
   if type(processed) == "table" then
      local processedCopy = {}
      visited[item] = processedCopy
      local processedKey

      for k, v in rawpairs(processed) do
         processedKey = processRecursive(process, k, makePath(path, k, inspect.KEY), visited)
         if processedKey ~= nil then
            processedCopy[processedKey] = processRecursive(process, v, makePath(path, processedKey), visited)
         end
      end

      local mt = processRecursive(process, getmetatable(processed), makePath(path, inspect.METATABLE), visited)
      if type(mt) ~= 'table' then mt = nil end
      setmetatable(processedCopy, mt)
      processed = processedCopy
   end
   return processed
end
```

## 前提知識

- **再帰**: 関数が自分自身を呼ぶことで、入れ子の構造を一段ずつ辿る書き方です。
- **循環参照**: 表 `a` の中に `a` 自身が入っているように、同じ表へ戻ってくる参照のことです。再帰で辿ると、そのままでは終わりません。
- **`visited`**: 処理済みの表と、その写しを覚えておく表です。キーが元の表、値が新しい写しになります。
- **`rawpairs`**: メタテーブルの `__pairs` を無視して、表のキーと値を回す関数です。元の中身をそのまま見るために使います。
- **`makePath`**: どの位置の値を処理しているかを、文字列の経路として作る関数です。`inspect.KEY` や `inspect.METATABLE` は、それぞれの種類を表す印です。

## 何をしているか

### 1. 値がなければ、そのまま返す

`item` が `nil` なら、何もせずに `nil` を返します。すでに写しを作った表なら、前に作った写しを返します。これで、同じ表を二度処理しなくなります。

```lua:line-numbers=217
   if item == nil then return nil end
   if visited[item] then return visited[item] end
```

### 2. 表なら、先に写しを作って登録する

`process` で値を変換し、結果が表なら、空の写しを作ります。`visited[item]` に写しを登録してから中身を回すので、途中で同じ表が出てきても、この写しを使えます。

```lua:line-numbers=220
   local processed = process(item, path)
   if type(processed) == "table" then
      local processedCopy = {}
      visited[item] = processedCopy
```

### 3. 中身とメタテーブルを、再帰的に写す

キーと値を一つずつ、再帰で変換して写しに入れます。最後に、メタテーブルも同じ方法で変換して、写しに付けます。

```lua:line-numbers=226
      for k, v in rawpairs(processed) do
         processedKey = processRecursive(process, k, makePath(path, k, inspect.KEY), visited)
         if processedKey ~= nil then
            processedCopy[processedKey] = processRecursive(process, v, makePath(path, processedKey), visited)
         end
      end

      local mt = processRecursive(process, getmetatable(processed), makePath(path, inspect.METATABLE), visited)
      if type(mt) ~= 'table' then mt = nil end
      setmetatable(processedCopy, mt)
      processed = processedCopy
```

## ここがすごい

- **先に登録してから中身を回す**: 写しを作って `visited` に入れてから再帰するので、循環した参照が来ても、作りかけの写しを指すだけで済みます。
- **同じ表は一つだけ**: 一度処理した表は、どこから現れても同じ写しになります。表の共有関係が、写しでも保たれます。
- **メタテーブルも対象**: 表の振る舞いを決める metatable も、同じ仕組みで写します。表示の結果が、元の表の性質を正しく反映します。
- **注意点**: 再帰は、非常に深い入れ子では、スタックを使い切る可能性があります。また、`process` が毎回新しい表を返すと、写しの数が増えます。

## まとめ

- 循環のある構造を辿るときは、処理を始める前に写しを登録すると、無限の再帰を防げる。
- 同じ対象を一つだけ作ると、共有された参照の関係をそのまま残せる。
- 辿る経路を一緒に渡すと、どこで何を処理したかを後で説明できる。
