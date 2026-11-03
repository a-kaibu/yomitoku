---
title: 文字列 1 行から関数を作る「ラムダ」の裏側
description: Lua の小さなユーティリティ集 lume の lambda。"x,y -> x+y" のような文字列を読んで、Lua のコードを組み立てて実行し、関数として返します。作った関数はキャッシュされます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [546, 554]
format: 2
function: lume.lambda
difficulty: 3
tags: [メタプログラミング, 正規表現, キャッシュ]
---

## ひとことで

`lume.lambda(str)` は、`"x,y -> x*y"` のような短い文字列を受け取り、その式を持った関数を返す関数です。文字列の中身を Lua のコードとして組み立て、読み込んで実行します。2 回目以降は作った関数を使い回すので、同じ文字列に対しては組み立てを 1 回しか行いません。

## コード

```lua:line-numbers=546
function lume.lambda(str)
  if not lambda_cache[str] then
    local args, body = str:match([[^([%w,_ ]-)%->(.-)$]])
    assert(args and body, "bad string lambda")
    local s = "return function(" .. args .. ")\nreturn " .. body .. "\nend"
    lambda_cache[str] = lume.dostring(s)
  end
  return lambda_cache[str]
end
```

キャッシュの変数（`lambda_cache`）と、`lume.dostring` は、読むのに必要なので続けて引用します。

```lua:line-numbers=544
local lambda_cache = {}
```

```lua:line-numbers=673
function lume.dostring(str)
  return assert((loadstring or load)(str))()
end
```

`lume.dostring` は、文字列を Lua のコードとして読み込んで実行する関数です。

```lua:line-numbers=673
function lume.dostring(str)
  return assert((loadstring or load)(str))()
end
```

## 前提知識

- **文字列の検索（パターン）**: `str:match(パターン)` は、文字列の中からパターンに合う部分を探して取り出す関数です。`()` で囲んだ部分が取り出す対象になります。
- **長い文字列 `[[ ... ]]`**: 二重の角かっこで囲むと、中の `\` や `"` をエスケープせずに書けます。パターン文字列を読みやすく書くために使われています。
- **`load`**: 文字列を Lua のコードとしてコンパイルし、関数として返す関数です。Lua 5.1 では `loadstring` という名前でした。`loadstring or load` は、両方のバージョンで動くようにするための書き方です。
- **`..`**: 文字列をつなぐ演算子です。
- **キャッシュ**: 同じ入力の結果を覚えておき、次回は計算せずに使い回す仕組みです。

## 何をしているか

### 1. 文字列を「引数」と「本体」に分ける

`match` のパターン `^([%w,_ ]-)%->(.-)$` は、「先頭から、英数字・カンマ・アンダースコア・空白だけの部分」を `args` に、「`->` より後ろ」を `body` に取り出します。`"x,y -> x*y"` なら、`args` は `"x,y "`、`body` は `" x*y"` になります。

```lua:line-numbers=548
    local args, body = str:match([[^([%w,_ ]-)%->(.-)$]])
```

もし `->` がないなど形が違えば、`args` か `body` が `nil` になるので `assert` で止めます。

```lua:line-numbers=549
    assert(args and body, "bad string lambda")
```

### 2. Lua のコードを文字列として組み立てる

引数と本体を使って、次の形の Lua のコードを作ります。

```lua:line-numbers=550
    local s = "return function(" .. args .. ")\nreturn " .. body .. "\nend"
```

`"x,y -> x*y"` の場合は、次のような 3 行の文字列になります。

```lua
return function(x,y )
return  x*y 
end
```

`\n` は改行です。`return function(...) ... end` は「関数を返すコード」なので、これを実行すると関数そのものが手に入ります。

### 3. 読み込んで実行し、キャッシュする

`lume.dostring(s)` は、組み立てたコードを `load` で読み込み、すぐ実行します。実行結果は作られた関数なので、それを `lambda_cache` に保存します。

```lua:line-numbers=551
    lambda_cache[str] = lume.dostring(s)
```

最後に、キャッシュから関数を返します。

```lua:line-numbers=553
  return lambda_cache[str]
```

## ここがすごい

- **文字列から関数を作れる**: `local double = lume.lambda("x -> x*2")` と書くと、`double(5)` は `10` を返します。`function(x) return x*2 end` と書く代わりに、式だけを短く書けます。
- **コードを生成して実行する仕組み**: 入力された文字列を Lua のコードに変換するのは、Lua の `load` が使えるからこそです。言語にそれがなければ、式を解釈する小さなパーサーを自分で書く必要があります。
- **キャッシュで組み立てを 1 回にする**: `load` はコンパイルのコストがかかります。同じ式が何度も使われる場合、キャッシュがないと毎回コンパイルすることになります。
- **注意点**: 文字列を実行するので、外部から受け取った文字列をそのまま渡すと危険です。`lume.lambda` は信頼できる開発者のコードの中で使う前提の関数です。

## まとめ

- 短い式を文字列で書けるようにするには、文字列を Lua のコードに組み立てて `load` すると簡単に実現できる。
- パターンの `()` で、文字列を必要な部分に分けて取り出せる。
- コンパイルのように重い処理は、キャッシュで 1 回だけにする。
