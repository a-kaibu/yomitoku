---
title: 条件に合うまで列を進める filterm_gen
description: LuaJIT 向け関数型ライブラリ Lua Fun の filterm_gen。引数が複数ある場合に、条件に合う値の組を探すまで列を進めます。合う組が見つかったら、その値をまとめて返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [553, 561]
format: 2
function: filterm_gen
difficulty: 3
tags: [探索, 遅延評価, 関数型]
---
## ひとことで

`filterm_gen(fun, gen_x, param_x, state_x, ...)` は、列の値が複数の引数を持つとき、その組全体を条件 `fun` で判定し、合うまで列を進める関数です。合った組は、すべての値を一緒に返します。引数が一つのときの `filter1_gen` と対になる関数です。

## コード

```lua:line-numbers=553
filterm_gen = function(fun, gen_x, param_x, state_x, ...)
    if state_x == nil then
        return nil
    end
    if fun(...) then
        return state_x, ...
    end
    return filterm_gen_shrink(fun, gen_x, param_x, state_x)
end
```

## 前提知識

- **複数の値の組**: 列の一つの要素が、複数の値で表されることがあります。たとえば、`pairs` は鍵と値の組を返します。
- **`...` による受け渡し**: 可変長の引数で、組の値をそのまま条件に渡し、合ったときは、そのまま返します。
- **相互再帰**: `filterm_gen` と `filterm_gen_shrink` は、互いを呼び合います。次の値を読んでから、再び `filterm_gen` に戻る形です。
- **`nil` による終わり**: 状態が `nil` になったら、列が終わったことを示します。

## 何をしているか

### 1. 列が終わっていないかを確かめる

状態が `nil` なら、列はここで終わりです。`nil` を返して止まります。

```lua:line-numbers=554
    if state_x == nil then
        return nil
    end
```

### 2. 組が条件に合えば、組ごと返す

条件 `fun(...)` が真なら、状態と、組の値すべてを返します。ここで、列の次の要素が決まります。

```lua:line-numbers=557
    if fun(...) then
        return state_x, ...
    end
```

### 3. 合わなければ、次の値を読み直す

合わなければ、`filterm_gen_shrink` で次の値を読み、もう一度判定します。判定の結果が合うまで、この繰り返しになります。

```lua:line-numbers=560
    return filterm_gen_shrink(fun, gen_x, param_x, state_x)
```

## ここがすごい

- **組を崩さずに判定**: 複数の値を、そのまま条件へ渡します。組の形を保ったまま、判定できます。
- **合った組を丸ごと返す**: 途中で値を分けたりせずに、組の全体を返します。後の処理も、同じ形で受け取れます。
- **単純な繰り返しの形**: 合わなければ次へ進む、という一つの流れで書かれています。読みやすい作りです。
- **注意点**: 再帰で次の値に進むので、読み飛ばす回数が非常に多いと、深い呼び出しになります。条件が厳しい場合は、その点に注意してください。

## まとめ

- 複数の値を持つ要素は、組のまま判定すると、形を崩さずに扱える。
- 合うまで次へ進む処理は、相互に呼び合う関数で書くと、流れを分けて理解できる。
- 読み飛ばしが多いときは、呼び出しの深さを意識する。
