---
title: 循環参照を数えながら、同じテーブルを 1 回だけ数える
description: Lua のデバッグ表示ライブラリ inspect.lua の countCycles。テーブルが自分自身を指していないかを、訪問済みの表で確かめながら再帰的に歩きます。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [184, 199]
format: 2
function: countCycles
difficulty: 3
tags: [再帰, データ構造, 防御的プログラミング]
---

## ひとことで

`countCycles(x, cycles, depth)` は、テーブルの中をたどりながら、各テーブルが何回出てくるかを数える関数です。テーブルが自分自身を指していると、そのまま再帰すると終わりません。この関数は「一度見たテーブル」を表に記録し、2 回目以降は数を増やすだけで中には入らないので、循環を安全に扱えます。

## コード

```lua:line-numbers=184
local function countCycles(x, cycles, depth)
   if type(x) == "table" then
      if cycles[x] then
         cycles[x] = cycles[x] + 1
      else
         cycles[x] = 1
         if depth > 0 then
            for k, v in rawpairs(x) do
               countCycles(k, cycles, depth - 1)
               countCycles(v, cycles, depth - 1)
            end
            countCycles(getmetatable(x), cycles, depth - 1)
         end
      end
   end
end
```

## 前提知識

- **循環参照**: テーブルの中の値が、自分自身や、その親をたどるとまた自分に戻ってくる関係のことです。例えば `t.self = t` がそうです。
- **再帰呼び出し**: 関数が自分自身を呼ぶ書き方です。木の形をしたデータを下へ下へとたどるのに向いています。
- **`depth`**: 再帰の深さの上限です。`depth` が `0` になったら、それ以上は中に入りません。
- **`type(x) == "table"`**: 値がテーブルかを調べます。テーブル以外（数字や文字列）は、数える必要がありません。

## 何をしているか

### 1. テーブルでなければ何もしない

最初の `if type(x) == "table"` で、テーブル以外の値を除きます。数字や文字列の中には、さらにたどるものがないからです。

```lua:line-numbers=185
   if type(x) == "table" then
```

### 2. 2 回目以降は数を増やすだけ

`cycles[x]` にすでに数があれば、そのテーブルは以前にも出てきたことになります。数を 1 増やして、中には入りません。ここで止まるので、循環があっても無限に進みません。

```lua:line-numbers=186
      if cycles[x] then
         cycles[x] = cycles[x] + 1
```

### 3. 初めてなら中をたどる

初めて見たテーブルは `cycles[x] = 1` と記録します。そして `depth` がまだ残っていれば、キーと値を 1 つずつ再帰で数え、さらにメタテーブルも数えます。`depth - 1` を渡すことで、たどる深さにも上限があります。

```lua:line-numbers=190
         if depth > 0 then
            for k, v in rawpairs(x) do
               countCycles(k, cycles, depth - 1)
               countCycles(v, cycles, depth - 1)
            end
            countCycles(getmetatable(x), cycles, depth - 1)
         end
```

## ここがすごい

- **訪問済みの表がそのまま停止条件**: 「もう見たか」を記録しておくだけで、循環を断ち切れます。複雑な判定を書かなくても、無限ループを防げる点が要点です。
- **数えることで情報になる**: 単に止めるのではなく、何回参照されたかを数えます。数が 2 以上なら、そのテーブルは複数の場所から指されていると表示に使えます。
- **深さの上限を別に持つ**: 循環がなくても、とても深い構造は再帰が長くなります。`depth` を渡すことで、どんな大きさのデータでも安全な上限を付けられます。
- **注意点**: `depth` を小さくしすぎると、深い場所にある循環を見落とします。上限を決めるときは、表示したいデータの深さとのバランスを考える必要があります。

## まとめ

- 循環のあるデータを歩くときは、訪問済みの表を作り、2 回目は中に入らないようにする。
- 「数を増やす」だけにすると、停止条件と情報の収集を 1 つにまとめられる。
- 再帰には深さの上限を付けると、どんな入力でも安全に止まる。
