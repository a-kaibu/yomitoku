---
title: 既存の表を新しい中身で置き換える、hotswap の update
description: Lua のユーティリティ集 lume の hotswap の内部関数 update。再読み込みしたモジュールの値を、古い表の中へ再帰的に書き戻し、既存の参照を生かしたまま中身だけを入れ替えます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [691, 699]
format: 2
function: update
difficulty: 3
tags: [再帰, メタプログラミング, 防御的プログラミング]
---
## ひとことで

`update(old, new)` は、`lume.hotswap` の中で使われる内部の関数です。再読み込みした新しい表 `new` の中身を、古い表 `old` に書き戻します。古い表の参照はそのまま残るので、その表を使っている他の場所は、新しい中身を見られます。プログラムを止めずに、コードを差し替えるための仕組みの要です。

## コード

```lua:line-numbers=691
  local function update(old, new)
    if updated[old] then return end
    updated[old] = true
    local oldmt, newmt = getmetatable(old), getmetatable(new)
    if oldmt and newmt then update(oldmt, newmt) end
    for k, v in pairs(new) do
      if type(v) == "table" then update(old[k], v) else old[k] = v end
    end
  end
```

## 前提知識

- **表は参照で共有される**: 同じ表を複数の場所が持っていると、その中身の変更は全員に見えます。`update` は、この性質を利用して、参照を変えずに中身だけを変えます。
- **`updated` の表**: 一度処理した表を覚えておく表です。循環する参照があっても、同じ表を二度処理せず、無限に進まないようにします。
- **metatable の更新**: 古い表と新しい表の両方に metatable があれば、その metatable も同じ方法で書き換えます。クラスの振る舞いも、差し替えられます。
- **再帰による入れ子の処理**: 値が表なら、その中身も `update` で再帰的に書き戻します。深い入れ子まで、同じ規則で差し替えられます。

## 何をしているか

### 1. 同じ表を二度処理しないようにする

`updated[old]` が真なら、すでに処理した表なので、何もせずに戻ります。処理が終わったら、印を付けます。

```lua:line-numbers=692
    if updated[old] then return end
    updated[old] = true
```

### 2. metatable を先に書き換える

古い表と新しい表の両方に metatable があれば、その二つを `update` で書き換えます。振る舞いの定義も、新しい版に揃います。

```lua:line-numbers=694
    local oldmt, newmt = getmetatable(old), getmetatable(new)
    if oldmt and newmt then update(oldmt, newmt) end
```

### 3. 中身を一つずつ書き戻す

新しい表の各項目を回します。値が表なら、古い表の同じ鍵の位置を相手に、再帰で書き戻します。表でなければ、そのまま代入します。

```lua:line-numbers=696
    for k, v in pairs(new) do
      if type(v) == "table" then update(old[k], v) else old[k] = v end
    end
```

## ここがすごい

- **参照を変えずに差し替える**: 古い表の参照を、どこかで付け替える必要がありません。使っている側は、何も変えずに新しい中身を使えます。
- **循環に強い**: `updated` の印で、同じ表を二度処理しません。相互に参照し合う表でも、安全に書き換えられます。
- **metatable も対象**: 振る舞いの定義が変わったときも、古い表に新しい規則が反映されます。
- **注意点**: 古い表にあって新しい表にない鍵は、消されずに残ります。削除された項目が、古い表に残ることがあります。

## まとめ

- 参照を保ったまま中身を差し替えると、使っている側に変更を伝えずに済む。
- 循環する構造は、処理済みの印を付けると、無限に進まずに書き換えられる。
- 差し替えでは、消えた項目が残るので、その扱いを事前に決めておく。
