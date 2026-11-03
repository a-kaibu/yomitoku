---
title: 予約した後片付けを、逆の順番で実行する仕組み
description: Lua のパッケージマネージャ LuaRocks の run_scheduled_functions。作業中に予約した関数を後ろから順に実行し、後に作ったものを先に片付けます。後始末の順番を正しく保つための書き方です。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [87, 96]
format: 2
function: util.run_scheduled_functions
difficulty: 2
tags: [設計パターン, 再帰, 防御的プログラミング]
---

## ひとことで

`util.run_scheduled_functions()` は、作業の途中で予約しておいた後片付けの関数を、まとめて実行する関数です。予約は `schedule_function` で積まれ、実行はその逆、つまり後から積んだものから先に行われます。一時ファイルの削除や、カレントディレクトリを戻す処理などを、確実に最後にまとめるための仕組みです。

## コード

```lua:line-numbers=87
function util.run_scheduled_functions()
   local fs = require("luarocks.fs")
   if fs.change_dir_to_root then
      fs.change_dir_to_root()
   end
   for i = #scheduled_functions, 1, -1 do
      local item = scheduled_functions[i]
      item.fn(item.arg)
   end
end
```

予約を積む `schedule_function` も、読むのに必要なので引用します。

```lua:line-numbers=63
function util.schedule_function(f, x)
   local item = { fn = f, arg = x }
   table.insert(scheduled_functions, item)
   return item
end
```

## 前提知識

- **後片付け（cleanup）**: 作業で一時的に作ったファイルや、変えた設定を、最後に元に戻す処理のことです。
- **スタック（後入れ先出し）**: 最後に入れたものを、最初に取り出す順番の並びです。皿を重ねて、一番上から使うのに似ています。
- **`for` の逆向き**: `for i = 最後, 1, -1 do` と書くと、末尾から先頭へ向かって回ります。
- **`require`**: モジュールを読み込む Lua の関数です。一度読んだものは、2 回目からは同じものを返します。

## 何をしているか

### 1. 作業ディレクトリを先に戻す

`require("luarocks.fs")` でファイル操作の部品を読み込み、`change_dir_to_root` があれば、作業の基準になるディレクトリに戻します。後の片付けが、正しい場所で行われるようにするためです。

```lua:line-numbers=88
   local fs = require("luarocks.fs")
   if fs.change_dir_to_root then
      fs.change_dir_to_root()
   end
```

### 2. 積んだものを後ろから実行する

`for i = #scheduled_functions, 1, -1` で、一番新しく予約されたものから順に実行します。`item.fn(item.arg)` は、予約したときの関数に、そのときの引数を渡して呼ぶ形です。

```lua:line-numbers=92
   for i = #scheduled_functions, 1, -1 do
      local item = scheduled_functions[i]
      item.fn(item.arg)
   end
```

### 3. 予約は表に積むだけ

`schedule_function` は、関数と引数を 1 つの表にまとめて、配列の末尾に入れます。戻り値として同じ表を返すので、後で予約を取り消すこともできます。

## ここがすごい

- **後から作ったものを先に壊す**: ファイルを作ってから、その中にさらに別のファイルを作ったとします。片付けは逆順なら、中の物から消せるので、途中で消えて困ることがありません。
- **順番の決まりを 1 か所に集める**: 片付けの順番を、呼ぶ側が毎回考える必要がありません。予約する人は、ただ積むだけで正しい順番になります。
- **予約を取り消せる**: `schedule_function` が返す表を使えば、不要になった予約を後で外せます。これは、途中で処理を変えたときに役立ちます。
- **注意点**: 片付けの関数が失敗すると、その後ろの片付けは実行されません。大事な後始末は、失敗しても続けられるように書く必要があります。

## まとめ

- 後片付けは、積んだものを逆の順番で実行すると、依存を壊さずに済む。
- 予約を積む関数と実行する関数を分けると、呼ぶ側が順番を気にしなくてよくなる。
- 片付けの途中で失敗すると残りが動かないので、重要な処理は慎重に書く。
