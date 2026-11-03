---
title: 文字列を読み込んで実行する dostring
description: Lua のユーティリティ集 lume の dostring。文字列の Lua コードを読み込み、すぐに実行します。読み込みに失敗すると、エラーを起こします。Lua の版に応じて load の名前を選びます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [673, 675]
format: 2
function: lume.dostring
difficulty: 2
tags: [メタプログラミング, 防御的プログラミング, エラー処理]
---
## ひとことで

`lume.dostring(str)` は、文字列として書かれた Lua のコードを読み込み、その場で実行する関数です。読み込みに失敗したときは、`assert` によってエラーを起こします。設定の一部をコードとして書きたいときや、テストのために短いコードを動かすときに使えます。

## コード

```lua:line-numbers=673
function lume.dostring(str)
  return assert((loadstring or load)(str))()
end
```

## 前提知識

- **`load` と `loadstring`**: 文字列を Lua のコードとして読み込み、関数として返す標準関数です。Lua 5.1 では `loadstring`、5.2 以降では `load` という名前でした。
- **`(loadstring or load)`**: 両方の名前のうち、存在するほうを使う書き方です。Lua の版の違いを、この一行で吸収しています。
- **読み込みの結果**: 読み込みに成功すると、実行できる関数が返ります。失敗すると、`nil` とエラーの文字列が返ります。
- **`assert`**: 値が偽のときにエラーを起こす関数です。`nil` が返ったときに、理由とともに止めることができます。

## 何をしているか

### 1. 読み込みの関数を選び、文字列を読む

`loadstring` があればそれを、なければ `load` を使い、文字列 `str` を読み込みます。結果は、実行できる関数か、失敗の情報になります。

```lua:line-numbers=674
  return assert((loadstring or load)(str))()
```

### 2. 読み込めたら、すぐに実行する

`assert` で、読み込みの結果が `nil` でないかを確かめます。成功すれば、得られた関数に `()` を付けて、その場で実行します。失敗すれば、エラーで止まります。

```lua:line-numbers=674
  return assert((loadstring or load)(str))()
```

## ここがすごい

- **版の違いを一行で吸収**: 呼ぶ側は、Lua の版を気にせず使えます。同じコードが、古い版と新しい版の両方で動きます。
- **失敗を隠さない**: 読み込みの失敗を `assert` で明示的に報告するので、おかしな値が黙って通りません。
- **とても短い**: 読み込み、確認、実行が、一つの式にまとまっています。
- **注意点**: 任意の文字列を実行するのは、非常に危険です。信頼できない入力を渡すと、コンピュータ上で好きな処理を実行されるおそれがあります。

## まとめ

- 文字列をコードとして扱うときは、版ごとの関数名の違いを、`or` で一か所にまとめると便利。
- 読み込みの失敗は、`assert` で止めると、原因を見つけやすい。
- 外部の文字列をコードとして実行しないように、入力の出所を必ず確かめる。
