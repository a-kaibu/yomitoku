---
title: 文字列の値を、Lua の式として読み戻す deserialize
description: Lua のユーティリティ集 lume の deserialize。serialize で作った文字列を、return を付けて読み込み、元の値に戻します。内部では dostring を使います。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [595, 597]
format: 2
function: lume.deserialize
difficulty: 2
tags: [メタプログラミング, データ構造, 防御的プログラミング]
---
## ひとことで

`lume.deserialize(str)` は、`lume.serialize` で作った文字列を、元の Lua の値に戻す関数です。文字列の前に `return ` を付けて、Lua のコードとして読み込みます。その結果、表や数などの値が、そのまま復元されます。保存したデータを、再び使えるようにするための関数です。

## コード

```lua:line-numbers=595
function lume.deserialize(str)
  return lume.dostring("return " .. str)
end
```

## 前提知識

- **シリアライズ（serialize）**: 値を、保存や送信ができる文字列に変えることです。この文字列を読み戻すことを、デシリアライズと呼びます。
- **Lua の式としての表**: Lua の表は、`{ a = 1 }` のように、コードの中に書けます。`serialize` は、この書き方に近い文字列を作ります。
- **`return`**: 値を関数の結果として返す文です。`return ` を付けると、読み込んだコードが、表などの値を返すようになります。
- **`lume.dostring`**: 文字列を Lua のコードとして読み込み、実行する lume の関数です。読み込んだ結果の値を取り出すために使います。

## 何をしているか

### 1. 文字列の前に return を付ける

`"return " .. str` で、文字列を `return` の文に変えます。こうすると、実行の結果として、表などの値を受け取れます。

```lua:line-numbers=596
  return lume.dostring("return " .. str)
```

### 2. 読み込んで実行し、値を返す

`lume.dostring` が、その文字列を読み込んで実行します。戻り値が、保存されていた値になります。

```lua:line-numbers=596
  return lume.dostring("return " .. str)
```

## ここがすごい

- **書き方を逆にする**: 出力の形を、そのまま読み戻せる形にしておくので、二つの関数が互いに対になります。
- **保存の形を人が読める**: 文字列は Lua のコードなので、中身を目で確かめられます。デバッグや、設定の編集にも役立ちます。
- **一行で完結**: `return` を付けて読むという一つの考え方で、関数の中身が短くまとまっています。
- **注意点**: 任意の文字列を実行するので、信頼できないデータを読むと、危険なコードが動くおそれがあります。読み込むデータの出所を、必ず確かめてください。

## まとめ

- 保存と復元を一組で考えるときは、出力の形を読み戻せるものにすると、二つの関数が自然に対になる。
- コードとして読むデータは、外部から来たものを信用しない。
- 短い関数でも、仕組みを理解しておくと、危険な使い方を避けられる。
