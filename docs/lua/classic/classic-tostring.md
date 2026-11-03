---
title: オブジェクトを文字列で表す、__tostring の既定値
description: Lua のクラス補助ライブラリ rxi/classic の Object:__tostring。オブジェクトを print や tostring したときの表示を、既定の文字列にします。子クラスで上書きできます。
language: lua
project: classic
repo: https://github.com/rxi/classic
license: MIT
copyright: Copyright (c) 2014, rxi
commit: "e5610756c98ac2f8facd7ab90c94e1a097ecd2c6"
file: classic.lua
lines: [56, 58]
format: 2
function: Object:__tostring
difficulty: 1
tags: [メタプログラミング, 設計パターン, 可読性]
---
## ひとことで

`Object:__tostring()` は、`classic` のオブジェクトを文字列にしたときの表示を決める関数です。既定では `"Object"` という文字列を返します。`print` や `tostring` にオブジェクトを渡すと、この関数が呼ばれます。子クラスで同じ名前の関数を書けば、表示だけを変えられます。

## コード

```lua:line-numbers=56
function Object:__tostring()
  return "Object"
end
```

## 前提知識

- **`__tostring`（metamethod）**: metatable に入れておくと、`tostring` や `print` が呼ばれたときに使われる特別な関数です。Lua の仕組みで、値の文字列表現を決めます。
- **`Object` が metatable の役割**: `classic` では、オブジェクトの metatable がクラスそのものになっています。そのため、クラスに書いた `__tostring` が、オブジェクトにも効きます。
- **継承による上書き**: 子クラスで同じ名前の関数を書くと、子の表示が優先されます。`classic` の `extend` で作った子は、この仕組みで表示を変えられます。
- **文字列を返す約束**: `__tostring` は、必ず文字列を返す必要があります。返す値が文字列でないと、`tostring` がエラーになります。

## 何をしているか

### 1. 既定の表示を返す

`return "Object"` で、表示用の文字列をそのまま返します。どの子クラスも、上書きしなければ、この表示になります。

```lua:line-numbers=57
  return "Object"
```

## ここがすごい

- **規則が一か所**: 表示の既定値を、基底のクラスで一度だけ決めています。子ごとに書かなくても、同じ表示になります。
- **子で簡単に変えられる**: 子のクラスで `__tostring` を書けば、その子だけ表示を変えられます。仕組みを変えずに、見た目だけを変えられます。
- **デバッグが楽になる**: `print` でオブジェクトを確かめるとき、中身の代わりに何のオブジェクトかが分かる文字列が出ます。
- **注意点**: 文字列以外を返すと、`tostring` でエラーになります。また、`"Object"` は子の名前ではないので、子では名前を返すように書き換えるのが普通です。

## まとめ

- 値の表示は、`__tostring` を基底のクラスに一つ置くと、全体で統一できる。
- 子クラスで上書きできる仕組みにすると、既定の表示を保ちながら、個別の表示も作れる。
- `__tostring` は必ず文字列を返す約束なので、返り値の型を守る。
