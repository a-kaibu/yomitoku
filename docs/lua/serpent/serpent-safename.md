---
title: 添字を安全な名前にする safename、foo.bar と foo[3] を使い分ける
description: Lua のシリアライズライブラリ serpent の safename。表の鍵を、そのまま名前として書けるかで、foo.bar か foo['b a r'] の形を使い分けます。キーワードも避けます。
language: lua
project: serpent
repo: https://github.com/pkulchenko/serpent
license: MIT
copyright: Copyright (c) 2012-2018 Paul Kulchenko
commit: "139fc18263bc5ffecc1729147891f1eb383046bf"
file: src/serpent.lua
lines: [39, 43]
format: 2
function: safename
difficulty: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`safename(path, name)` は、表の鍵 `name` を、Lua のソースコードの中で正しく書ける形にする関数です。名前として書ける単純な識別子なら `foo.bar` の形を、書けない場合は `foo['b a r']` の形を選びます。出力された Lua のコードが、そのまま読み込めるようにするための関数です。

## コード

:::: code-group

```lua:line-numbers=39 [日本語訳]
  local function safename(path, name) -- foo.bar、foo[3]、foo['b a r'] を作る
    local n = name == nil and '' or name
    local plain = type(n) == "string" and n:match("^[%l%u_][%w_]*$") and not keyword[n]
    local safe = plain and n or '['..safestr(n)..']'
    return (path or '')..(plain and path and '.' or '')..safe, safe end
```

```lua:line-numbers=39 [原文]
  local function safename(path, name) -- generates foo.bar, foo[3], or foo['b a r']
    local n = name == nil and '' or name
    local plain = type(n) == "string" and n:match("^[%l%u_][%w_]*$") and not keyword[n]
    local safe = plain and n or '['..safestr(n)..']'
    return (path or '')..(plain and path and '.' or '')..safe, safe end
```

::::

## 前提知識

- **識別子（identifier）**: 変数や項目の名前として使える文字列です。英字やアンダースコアで始まり、英数字とアンダースコアが続きます。
- **キーワード**: `end` や `local` のように、言語が特別な意味を持たせている単語です。識別子として使えません。
- **`n:match("^[%l%u_][%w_]*$")`**: 文字列全体が識別子の形かを確かめるパターンです。`^` と `$` で、先頭から末尾まで一致するかを見ます。
- **`safestr`**: 文字列を、引用符つきの安全な形にする serpent の内部の関数です。

## 何をしているか

### 1. 名前が単純な識別子かを判定する

`n` を文字列として、識別子の形のパターンに一致するかを調べます。さらに、キーワードでないことも確かめます。両方が真なら、`plain` は真になります。

```lua:line-numbers=40
    local n = name == nil and '' or name
    local plain = type(n) == "string" and n:match("^[%l%u_][%w_]*$") and not keyword[n]
```

### 2. 形に応じて、書き方を選ぶ

単純な名前なら、そのまま使います。そうでなければ、`safestr` で引用符つきにして、角括弧で囲みます。

```lua:line-numbers=42
    local safe = plain and n or '['..safestr(n)..']'
```

### 3. 親のパスとつないで返す

親のパス `path` があれば、単純な名前の場合だけ `.` でつなぎます。角括弧の形は、そのまま後ろに続きます。結果と、名前の部分の両方を返します。

```lua:line-numbers=43
    return (path or '')..(plain and path and '.' or '')..safe, safe end
```

## ここがすごい

- **出力が正しい Lua になる**: 名前が書けない場合でも、引用符つきの角括弧に変えるので、読み込めないコードが出ません。
- **キーワードを避ける**: `end` のような鍵を、そのまま書いてしまう誤りを防ぎます。
- **二つの戻り値**: 全体の形と、名前の部分を分けて返します。呼ぶ側は、親のパスとして使うか、単独で使うかを選べます。
- **注意点**: 識別子の判定は、ASCII の文字を前提にしています。日本語の鍵は、角括弧の形で書かれます。

## まとめ

- 出力する名前は、言語の文法に合わせて書き方を分けると、読み込める形を保てる。
- キーワードのような例外は、判定に含めておくと、思わぬ構文エラーを防げる。
- 形を決める関数が、全体の形と部分の名前を別々に返すと、呼び出し側の使い分けがしやすい。
