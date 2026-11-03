---
title: 何を読まれても「何もない表」を返す、安全なデータ読み込み
description: Lua のシリアライザ serpent の deserialize。文字列のデータを Lua のコードとして読むとき、外側の変数を見せない空の部屋を用意し、関数の呼び出しを禁止します。
language: lua
project: serpent
repo: https://github.com/pkulchenko/serpent
license: MIT
copyright: Copyright (c) 2012-2018 Paul Kulchenko
commit: "139fc18263bc5ffecc1729147891f1eb383046bf"
file: src/serpent.lua
lines: [134, 145]
format: 2
function: deserialize
difficulty: 3
tags: [セキュリティ, メタプログラミング, 防御的プログラミング]
---

## ひとことで

`deserialize(data, opts)` は、`serpent` が作った文字列（テーブルを Lua のコードの形で書いたもの）を、元のテーブルに戻す関数です。文字列は Lua のコードとして実行されるので、そのまま実行すると、どんな命令も動いてしまいます。そこでこの関数は、外側の変数が見えない空の部屋（環境）を用意し、その中でだけ読み込みます。

## コード

```lua:line-numbers=134
local function deserialize(data, opts)
  local env = (opts and opts.safe == false) and G
    or setmetatable({}, {
        __index = function(t,k) return t end,
        __call = function(t,...) error("cannot call functions") end
      })
  local f, res = (loadstring or load)('return '..data, nil, nil, env)
  if not f then f, res = (loadstring or load)(data, nil, nil, env) end
  if not f then return f, res end
  if setfenv then setfenv(f, env) end
  return pcall(f)
end
```

## 前提知識

- **環境（environment）**: Lua のコードが、変数名を探すときに参照するテーブルです。ここでは `_G`（グローバル変数の表）の代わりに、別の表を使わせることができます。
- **`load`**: 文字列を Lua のコードとして読み込み、関数にして返します。第 4 引数に環境を渡すと、その中で変数を探すようになります。
- **metatable の `__index`**: 存在しないキーを読んだときに動く関数です。ここでは、どんな名前を読んでも「環境自身」を返すように作られています。
- **`pcall`**: エラーを起こしうる関数を、安全に呼ぶための関数です。エラーが出ても止まらず、`false` とエラーメッセージを返します。

## 何をしているか

### 1. 空の部屋と、その部屋の決まりを作る

`setmetatable({}, ...)` で空の表を作り、metatable を付けます。`__index` は、存在しないどの名前を読んでも、その表自身を返します。つまり `os` や `print` と書いても、関数ではなく空の部屋が返ってきます。

```lua:line-numbers=136
    or setmetatable({}, {
        __index = function(t,k) return t end,
        __call = function(t,...) error("cannot call functions") end
      })
```

`__call` は、その部屋を関数のように呼ぼうとしたときに動きます。エラーを出して、呼び出しを止めます。

### 2. 「return」付きで読み、だめなら素のまま読む

`'return '..data` は、テーブルの形の文字列を、値として返すコードにします。読み込みに失敗したら、`data` のままで読み直します。そして、環境 `env` を渡して関数を作ります。

```lua:line-numbers=140
  local f, res = (loadstring or load)('return '..data, nil, nil, env)
  if not f then f, res = (loadstring or load)(data, nil, nil, env) end
```

### 3. 環境を差し替えて、安全に実行する

Lua 5.1 では `setfenv` で、関数の環境を後から設定します。Lua 5.2 以降では `load` の引数で決まっているので、この行は通りません。最後に `pcall(f)` で実行し、結果を返します。

```lua:line-numbers=143
  if setfenv then setfenv(f, env) end
  return pcall(f)
```

## ここがすごい

- **名前が何でも空の部屋が返る**: 外の関数や変数を使おうとしても、すべて空の部屋に吸い込まれます。データの中に `os.execute` のような命令が書かれていても、実行されないように見えます。
- **呼び出しを止める 2 段の守り**: `__index` で名前を隠し、`__call` で呼び出しを止めています。どちらか片方では、攻撃の抜け道が残ります。
- **`opts.safe == false` の抜け道**: 信頼できるデータに限って、普通のグローバル環境を使うこともできます。安全と速さ・便利さを、利用者が選べる設計です。
- **注意点**: この仕組みは、あくまで読み込みの便宜のための防御です。`pcall` で囲んでも、無限ループや大量のメモリ使用を防ぐものではありません。信頼できない入力には、別の隔離の仕組みも併用する必要があります。

## まとめ

- 文字列をコードとして読むときは、外側の変数が見えない空の環境を用意する。
- metatable の `__index` と `__call` で、名前の参照と呼び出しを止められる。
- 安全に読むための仕組みでも、無限ループなど別の危険は残るので、用途を正しく理解して使う。
