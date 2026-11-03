---
title: 区切りを 1 つずつ探して、空の欄も正しく分ける split
description: Lua のユーティリティ集 Penlight の utils.split。find で区切りの位置を探し、その間を切り出していきます。先頭と末尾の空欄の扱いや、欄の数の上限も決められます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [708, 731]
format: 2
function: utils.split
difficulty: 2
tags: [文字列処理, 正規表現, データ構造]
---

## ひとことで

`utils.split(s, re, plain, n)` は、文字列 `s` を区切りの `re` で分けて、配列にして返す関数です。区切りを省略すると、空白の並びで分けます。`plain` を真にすると、区切りをパターンではなくそのままの文字として扱います。`n` を指定すると、分ける数に上限を付けられます。

## コード

```lua:line-numbers=708
function utils.split(s,re,plain,n)
    utils.assert_string(1,s)
    local i1,ls = 1,{}
    if not re then re = '%s+' end
    if re == '' then return {s} end
    while true do
        local i2,i3 = find(s,re,i1,plain)
        if not i2 then
            local last = sub(s,i1)
            if last ~= '' then append(ls,last) end
            if #ls == 1 and ls[1] == '' then
                return {}
            else
                return ls
            end
        end
        append(ls,sub(s,i1,i2-1))
        if n and #ls == n then
            ls[#ls] = sub(s,i1)
            return ls
        end
        i1 = i3+1
    end
end
```

## 前提知識

- **`find`**: 文字列の中で、パターンに合う最初の位置を返します。戻り値は、一致の開始位置と終了位置です。
- **`plain`**: 真なら、パターンの記号を普通の文字として探します。`.` を区切りにしたいときに使います。
- **`sub`**: 指定した範囲の文字列を切り出す関数です。
- **空の欄**: 区切りが連続すると、間に空の文字列ができます。この関数は、その扱いも決めています。

## 何をしているか

### 1. 区切りを探す

`find(s, re, i1, plain)` で、今の位置 `i1` から区切りを探します。見つからなければ、最後の欄を取り出して終わります。

```lua:line-numbers=714
        local i2,i3 = find(s,re,i1,plain)
```

### 2. 最後の欄の扱い

見つからなかったときは、残りの部分 `last` を入れます。空でなければ配列に加えます。配列が「空文字 1 つ」だけなら、空の配列を返します。空の文字列を区切りで分けたときに、余計な欄を作らないためです。

```lua:line-numbers=716
            local last = sub(s,i1)
```

### 3. 区切りの前を入れて、上限を確かめる

見つかったら、`i1` から区切りの 1 つ前までを入れます。`n` が指定されていて欄の数が上限に達したら、残りを最後の欄にまとめて返します。

```lua:line-numbers=724
        append(ls,sub(s,i1,i2-1))
```

```lua:line-numbers=726
            ls[#ls] = sub(s,i1)
```

### 4. 次の位置へ進む

`i1 = i3+1` で、区切りの後ろから探し直します。

## ここがすごい

- **空欄の扱いを決めている**: 末尾の空欄は捨て、空文字 1 つだけの入力は空の配列にします。使う側が、いつも同じ形の結果を受け取れます。
- **上限で残りをまとめる**: `n` を使うと、`key=value=more` のような文字列を、先頭だけ分けて残りを 1 つの欄として得られます。
- **`plain` でパターンを避ける**: 区切りに `.` や `+` を使っても、`plain` を真にすれば、そのまま探せます。
- **注意点**: 区切りの文字列が長いと、探す回数が増えます。大きな文字列を何度も分けるときは、区切りを短くすると速くなります。

## まとめ

- 区切りで分けるときは、見つけた位置から切り出していく形にすると書きやすい。
- 空欄や上限の扱いを先に決めておくと、呼ぶ側が結果を予測しやすい。
- 記号を区切りに使うなら、`plain` の指定を忘れない。
