---
title: __index を包み、メソッドを先に探すクラスの仕組み
description: Lua のクラスライブラリ middleclass の _createIndexWrapper。__index の指定が関数か表かで包み方を変え、クラス内のメソッドを先に見つけてから、利用者の __index に任せます。
language: lua
project: middleclass
repo: https://github.com/kikito/middleclass
license: MIT
copyright: Copyright (c) 2011 Enrique García Cota
commit: "359f0e2742f51ca77801b513ec91eb9029de8de4"
file: middleclass.lua
lines: [31, 55]
format: 2
function: _createIndexWrapper
difficulty: 2
tags: [メタプログラミング, クロージャ, 設計パターン]
---

## ひとことで

`_createIndexWrapper(aClass, f)` は、インスタンスの `__index` を作る関数です。クラスのメソッドを先に探し、見つからなかったときだけ、利用者が指定した `__index`（関数または表）に任せます。クラスの仕組みと、利用者の独自の `__index` を、両立させるための小さな工夫です。

## コード

:::: code-group

```lua:line-numbers=31 [日本語訳]
local function _createIndexWrapper(aClass, f)
  if f == nil then
    return aClass.__instanceDict
  elseif type(f) == "function" then
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return (f(self, name))
      end
    end
  else -- もし type(f) が table なら
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return f[name]
      end
    end
  end
end
```

```lua:line-numbers=31 [原文]
local function _createIndexWrapper(aClass, f)
  if f == nil then
    return aClass.__instanceDict
  elseif type(f) == "function" then
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return (f(self, name))
      end
    end
  else -- if  type(f) == "table" then
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return f[name]
      end
    end
  end
end
```

::::

## 前提知識

- **`__index`**: 表に存在しないキーを読んだときに、Lua が呼ぶ仕組み（metamethod）です。値が `nil` のときだけ動くので、「無いときの代わり」を決める場所です。
- **`__instanceDict`**: middleclass が、インスタンスの探すメソッドを集めておく表です。インスタンスの metatable がこの表を指すので、メソッドはここから見つかります。
- **クロージャ**: 関数の中で作った関数が、外側の変数（`aClass` や `f`）を覚えたまま使える仕組みです。ここでは、包んだ関数の中で `f` を覚えています。
- **`(f(self, name))`**: 括弧で囲むと、戻り値を 1 つだけにできます。`__index` は 1 つの値しか使わないので、余分な戻り値を捨てるための書き方です。

## 何をしているか

### 1. `f` が無ければ、メソッドの表をそのまま使う

利用者が `__index` を決めていなければ、`aClass.__instanceDict` をそのまま返します。この表には、クラスのメソッドがすべて入っているので、それだけで十分です。

```lua:line-numbers=32
  if f == nil then
    return aClass.__instanceDict
```

### 2. `f` が関数なら、先にメソッドを探してから `f` を呼ぶ

利用者の `__index` が関数のときは、まず `__instanceDict` からキーを探します。見つかったら、その値を返します。見つからなかったときだけ、`f(self, name)` を呼んで結果を返します。

```lua:line-numbers=34
  elseif type(f) == "function" then
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return (f(self, name))
      end
    end
```

### 3. `f` が表なら、同じ順序で表から探す

`f` が表のときも、考え方は同じです。メソッドを先に探し、無ければ `f[name]` を返します。

:::: code-group

```lua:line-numbers=44 [日本語訳]
  else -- もし type(f) が table なら
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return f[name]
      end
    end
```

```lua:line-numbers=44 [原文]
  else -- if  type(f) == "table" then
    return function(self, name)
      local value = aClass.__instanceDict[name]

      if value ~= nil then
        return value
      else
        return f[name]
      end
    end
```

::::

## ここがすごい

- **クラスのメソッドが常に優先される**: 利用者が独自の `__index` を決めても、クラスの仕組みは壊れません。メソッドを先に探すので、動作が予測しやすくなっています。
- **同じ形を 2 通りに使い分ける**: 関数と表という違う指定を、中の 1 つの書き方でまとめて扱えます。`if` で場合分けするのは、最初に 1 度だけです。
- **包むことで元の値を守る**: 利用者の `__index` を直接置き換えず、外側に包んでいます。そのため、クラスのメソッドが後から上書きされにくくなります。
- **注意点**: 探す値が `nil` でない限り、利用者の `__index` は呼ばれません。`false` が入っているキーは、そのまま `false` が返るので、そこは意識して使ってください。

## まとめ

- `__index` の指定の種類に応じて包み方を変えると、どちらの指定にも同じ仕組みで対応できる。
- クラスのメソッドを先に探すと、利用者の独自の探し方を加えても、基本の動きが崩れない。
- 小さな関数で場合分けを 1 回だけ済ませると、後の処理が単純になる。
