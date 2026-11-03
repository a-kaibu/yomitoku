---
title: 比較の関数で、最も大きい値を一つ選ぶ max_by
description: LuaJIT 向け関数型ライブラリ Lua Fun の max_by。渡された比較関数で、列の中の最大の値を選びます。min_by の対になる関数で、比べ方は呼ぶ側が決めます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [788, 798]
format: 2
function: max_by
difficulty: 2
tags: [関数型, 探索, イテレータ]
---
## ひとことで

`max_by(cmp, gen, param, state)` は、比較関数 `cmp` を使って、列の中から最も大きいとされる値を選ぶ関数です。`min_by` の対になる関数で、比べ方を呼ぶ側が決められます。値の大きさだけでなく、特定の項目の大きさで選ぶようなことができます。

## コード

```lua:line-numbers=788
local max_by = function(cmp, gen_x, param_x, state_x)
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("max: iterator is empty")
    end

    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
    return m
end
```

## 前提知識

- **比較関数 `cmp`**: 二つの値を受け取って、残すべき値を返す関数です。`max_by` では、より大きいとみなしたほうを返すように書きます。
- **`min_by` との対**: `min_by` は小さい方を、`max_by` は大きい方を残す関数です。構造は同じで、比べ方を決める関数が異なります。
- **先頭の値を最初の候補に**: 列の最初の値を、初めの候補 `m` にします。空の列では、比べられないのでエラーです。
- **`for` で残りを回す**: 二番目以降の値を、一つずつ取り出して比べます。

## 何をしているか

### 1. 先頭の値を候補にする

列から最初の値を取り出し、候補 `m` とします。列が空ならエラーにします。

```lua:line-numbers=789
    local state_x, m = gen_x(param_x, state_x)
    if state_x == nil then
        error("max: iterator is empty")
    end
```

### 2. 残りを比較関数で比べる

残りの値を一つずつ取り出し、`cmp(m, r)` の結果を新しい候補にします。この比べを、列が終わるまで続けます。

```lua:line-numbers=794
    for _, r in gen_x, param_x, state_x do
        m = cmp(m, r)
    end
```

### 3. 最後の候補を返す

すべてを比べ終えたら、残った候補 `m` を返します。これが最も大きいとされた値です。

```lua:line-numbers=797
    return m
```

## ここがすごい

- **比べ方を外から決める**: 数の大きさ、文字列の長さ、表の特定の項目などを、関数として渡せます。
- **一度回すだけ**: 列を一度だけ進めて答えが決まるので、余分な処理がありません。
- **`min_by` と見比べられる**: 対になる関数が同じ形なので、一方を理解すれば、もう一方もすぐ読めます。
- **注意点**: 比較関数が、大小の関係を一貫して示さないと、結果が意図と違うことがあります。空の列では、エラーになります。

## まとめ

- 最大値を選ぶ処理は、比べ方を関数で渡すと、どんな値にも使える。
- 対になる関数は同じ形で書くと、理解と保守が楽になる。
- 空の列の扱いを決めておくと、呼ぶ側の安全が保たれる。
